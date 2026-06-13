import { prisma } from "./prisma"

export type PlayerForm = "up" | "down" | "stable"

export type SeasonChartEntry = {
  seasonName: string
  goals: number
  assists: number
  played: number
}

export async function getSeasonStatsForPlayer(playerId: string): Promise<SeasonChartEntry[]> {
  const [lineups, goals, assists] = await Promise.all([
    prisma.matchLineup.findMany({
      where: { playerId, match: { status: "PLAYED" } },
      select: {
        matchId: true,
        match: { select: { seasonId: true, season: { select: { name: true, startDate: true } } } },
      },
    }),
    prisma.goal.findMany({
      where: { scorerId: playerId, isOwnGoal: false },
      select: { matchId: true },
    }),
    prisma.goal.findMany({
      where: { assisterId: playerId },
      select: { matchId: true },
    }),
  ])

  const goalsByMatch = new Map<string, number>()
  for (const g of goals) goalsByMatch.set(g.matchId, (goalsByMatch.get(g.matchId) ?? 0) + 1)
  const assistsByMatch = new Map<string, number>()
  for (const a of assists) assistsByMatch.set(a.matchId, (assistsByMatch.get(a.matchId) ?? 0) + 1)

  type Acc = { seasonName: string; startDate: Date; goals: number; assists: number; played: number; seen: Set<string> }
  const map = new Map<string, Acc>()

  for (const l of lineups) {
    const sid = l.match.seasonId
    if (!map.has(sid)) {
      map.set(sid, { seasonName: l.match.season.name, startDate: l.match.season.startDate, goals: 0, assists: 0, played: 0, seen: new Set() })
    }
    const s = map.get(sid)!
    if (!s.seen.has(l.matchId)) {
      s.seen.add(l.matchId)
      s.played++
      s.goals   += goalsByMatch.get(l.matchId)   ?? 0
      s.assists += assistsByMatch.get(l.matchId) ?? 0
    }
  }

  return [...map.values()]
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    .map(({ seasonName, goals, assists, played }) => ({ seasonName, goals, assists, played }))
}

export async function getPlayerForms(): Promise<Map<string, PlayerForm>> {
  const last3 = await prisma.match.findMany({
    where: { status: "PLAYED" },
    orderBy: { scheduledAt: "desc" },
    take: 3,
    select: { id: true },
  })

  if (last3.length < 2) return new Map()

  const matchIds = last3.map((m) => m.id)
  const chronological = [...matchIds].reverse()

  const [lineups, goals] = await Promise.all([
    prisma.matchLineup.findMany({
      where: { matchId: { in: matchIds } },
      select: { playerId: true, matchId: true },
    }),
    prisma.goal.findMany({
      where: { matchId: { in: matchIds }, isOwnGoal: false },
      select: { scorerId: true, assisterId: true, matchId: true },
    }),
  ])

  const scoreMap = new Map<string, Map<string, number>>()
  for (const l of lineups) {
    if (!scoreMap.has(l.playerId)) scoreMap.set(l.playerId, new Map())
    if (!scoreMap.get(l.playerId)!.has(l.matchId))
      scoreMap.get(l.playerId)!.set(l.matchId, 0)
  }
  for (const g of goals) {
    const s = scoreMap.get(g.scorerId)
    if (s?.has(g.matchId)) s.set(g.matchId, s.get(g.matchId)! + 1)
    if (g.assisterId) {
      const a = scoreMap.get(g.assisterId)
      if (a?.has(g.matchId)) a.set(g.matchId, a.get(g.matchId)! + 1)
    }
  }

  const result = new Map<string, PlayerForm>()
  for (const [playerId, matchScores] of scoreMap.entries()) {
    const played = chronological.filter((id) => matchScores.has(id))
    if (played.length < 2) continue
    const last = matchScores.get(played[played.length - 1])!
    const prev = matchScores.get(played[played.length - 2])!
    result.set(playerId, last > prev ? "up" : last < prev ? "down" : "stable")
  }

  return result
}

export type SeasonLeaders = {
  season:    { id: string; name: string; startDate: Date }
  topScorer: PlayerWithStats | null
  topAssist: PlayerWithStats | null
  topApps:   PlayerWithStats | null
}

export type PlayerWithStats = {
  id: string
  firstName: string
  lastName: string
  nickname: string | null
  photoUrl: string | null
  avatarId: number | null
  team: { id: string; name: string; color: string } | null
  played: number
  goals: number
  assists: number
}

export async function getPlayersWithStats(seasonId?: string): Promise<PlayerWithStats[]> {
  const matchFilter  = seasonId ? { match: { seasonId } } : {}
  const teamFilter   = seasonId ? { team: { seasonId } } : {}

  const players = await prisma.player.findMany({
    include: {
      teamPlayers: {
        include: { team: true },
        where:   teamFilter,
      },
      matchLineups: {
        where: matchFilter,
        select: { matchId: true },
      },
      goalsScored: {
        where: { ...matchFilter, isOwnGoal: false },
        select: { id: true },
      },
      goalsAssisted: {
        where: matchFilter,
        select: { id: true },
      },
    },
  })

  return players
    .map((p) => ({
      id:        p.id,
      firstName: p.firstName,
      lastName:  p.lastName,
      nickname:  p.nickname,
      photoUrl:  p.photoUrl,
      avatarId:  p.avatarId,
      team:      p.teamPlayers[0]?.team ?? null,
      played:    p.matchLineups.length,
      goals:     p.goalsScored.length,
      assists:   p.goalsAssisted.length,
    }))
    .filter((p) => p.played > 0)
    .sort((a, b) =>
      b.played - a.played ||
      b.goals  - a.goals  ||
      b.assists - a.assists ||
      a.lastName.localeCompare(b.lastName)
    )
}

export type PlayerProfile = {
  id:           string
  firstName:    string
  lastName:     string
  nickname:     string | null
  totalPlayed:  number
  totalGoals:   number
  totalAssists: number
  totalMvp:     number
  seasons: Array<{
    season:  { id: string; name: string; startDate: Date }
    team:    { id: string; name: string; color: string } | null
    played:  number
    goals:   number
    assists: number
  }>
  matches: Array<{
    matchId:  string
    date:     Date
    round:    number | null
    season:   { id: string; name: string }
    myTeam:   { id: string; name: string; color: string }
    opponent: { id: string; name: string; color: string }
    homeScore: number | null
    awayScore: number | null
    isHome:   boolean
    goals:    number
    assists:  number
  }>
}

export async function getPlayerProfile(id: string): Promise<PlayerProfile | null> {
  const player = await prisma.player.findUnique({
    where: { id },
    include: {
      matchLineups: {
        include: {
          match: {
            include: {
              season:   { select: { id: true, name: true, startDate: true } },
              homeTeam: { select: { id: true, name: true, color: true } },
              awayTeam: { select: { id: true, name: true, color: true } },
            },
          },
          team: { select: { id: true, name: true, color: true } },
        },
        orderBy: { match: { scheduledAt: "desc" } },
      },
      goalsScored:   { where: { isOwnGoal: false }, select: { matchId: true } },
      goalsAssisted: { select: { matchId: true } },
    },
  })

  if (!player) return null

  const goalsByMatch   = new Map<string, number>()
  const assistsByMatch = new Map<string, number>()
  for (const g of player.goalsScored)   goalsByMatch.set(g.matchId,   (goalsByMatch.get(g.matchId)   ?? 0) + 1)
  for (const a of player.goalsAssisted) assistsByMatch.set(a.matchId, (assistsByMatch.get(a.matchId) ?? 0) + 1)

  type SeasonAgg = {
    season:  { id: string; name: string; startDate: Date }
    team:    { id: string; name: string; color: string } | null
    played:  number; goals: number; assists: number
  }
  const seasonMap = new Map<string, SeasonAgg>()
  for (const l of player.matchLineups) {
    const sid = l.match.season.id
    if (!seasonMap.has(sid)) seasonMap.set(sid, { season: l.match.season, team: l.team, played: 0, goals: 0, assists: 0 })
    const s = seasonMap.get(sid)!
    s.played++
    s.goals   += goalsByMatch.get(l.matchId)   ?? 0
    s.assists += assistsByMatch.get(l.matchId) ?? 0
  }

  const matches = player.matchLineups
    .filter((l) => l.match.status === "PLAYED")
    .map((l) => {
      const m      = l.match
      const isHome = m.homeTeam.id === l.team.id
      return {
        matchId:   l.matchId,
        date:      m.scheduledAt,
        round:     m.round,
        season:    m.season,
        myTeam:    l.team,
        opponent:  isHome ? m.awayTeam : m.homeTeam,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        isHome,
        goals:   goalsByMatch.get(l.matchId)   ?? 0,
        assists: assistsByMatch.get(l.matchId) ?? 0,
      }
    })

  const totalMvp = await prisma.match.count({ where: { mvpPlayerId: player.id } })

  return {
    id:           player.id,
    firstName:    player.firstName,
    lastName:     player.lastName,
    nickname:     player.nickname,
    totalPlayed:  player.matchLineups.length,
    totalGoals:   player.goalsScored.length,
    totalAssists: player.goalsAssisted.length,
    totalMvp,
    seasons: [...seasonMap.values()].sort(
      (a, b) => new Date(b.season.startDate).getTime() - new Date(a.season.startDate).getTime()
    ),
    matches,
  }
}

export async function getSeasonalLeaders(
  seasons: { id: string; name: string; startDate: Date }[]
): Promise<SeasonLeaders[]> {
  const allStats = await Promise.all(seasons.map((s) => getPlayersWithStats(s.id)))
  return seasons.map((season, i) => {
    const players   = allStats[i]
    const byGoals   = [...players].sort((a, b) => b.goals   - a.goals)
    const byAssists = [...players].sort((a, b) => b.assists - a.assists)
    const byPlayed  = [...players].sort((a, b) => b.played  - a.played)
    return {
      season,
      topScorer: byGoals[0]?.goals   > 0 ? byGoals[0]   : null,
      topAssist: byAssists[0]?.assists > 0 ? byAssists[0] : null,
      topApps:   byPlayed[0]?.played  > 0 ? byPlayed[0]  : null,
    }
  })
}
