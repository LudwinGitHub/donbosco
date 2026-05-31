import { prisma } from "./prisma"
import { getStandings } from "./standings"

// ─── Types ────────────────────────────────────────────────────────────────────

export type MatchHighlight = {
  matchId: string
  seasonName: string
  round: number | null
  homeTeamName: string
  homeTeamColor: string
  awayTeamName: string
  awayTeamColor: string
  homeScore: number
  awayScore: number
  scheduledAt: Date
  value: number
}

export type PlayerMatchRecord = {
  playerId: string
  firstName: string
  lastName: string
  nickname: string | null
  goals: number
  matchId: string
  seasonName: string
  scheduledAt: Date
  vsTeam: string
}

export type SeasonOverview = {
  seasonId: string
  seasonName: string
  played: number
  totalGoals: number
  avgGoals: number
  champion: string | null
  championColor: string | null
  champPoints: number | null
}

// ─── Records ──────────────────────────────────────────────────────────────────

export async function getMatchHighlights(): Promise<{
  highestScoring: MatchHighlight[]
  biggestWin: MatchHighlight[]
}> {
  const matches = await prisma.match.findMany({
    where: { status: "PLAYED", homeScore: { not: null }, awayScore: { not: null } },
    include: {
      homeTeam: true,
      awayTeam: true,
      season:   { select: { name: true } },
    },
  })

  const withCalc = matches.map((m) => ({
    matchId:       m.id,
    seasonName:    m.season.name,
    round:         m.round,
    homeTeamName:  m.homeTeam.name,
    homeTeamColor: m.homeTeam.color,
    awayTeamName:  m.awayTeam.name,
    awayTeamColor: m.awayTeam.color,
    homeScore:     m.homeScore!,
    awayScore:     m.awayScore!,
    scheduledAt:   m.scheduledAt,
    totalGoals:    m.homeScore! + m.awayScore!,
    margin:        Math.abs(m.homeScore! - m.awayScore!),
  }))

  const highestScoring = [...withCalc]
    .sort((a, b) => b.totalGoals - a.totalGoals || b.scheduledAt.getTime() - a.scheduledAt.getTime())
    .slice(0, 5)
    .map((m) => ({ ...m, value: m.totalGoals }))

  const biggestWin = [...withCalc]
    .filter((m) => m.margin > 0)
    .sort((a, b) => b.margin - a.margin || b.totalGoals - a.totalGoals)
    .slice(0, 5)
    .map((m) => ({ ...m, value: m.margin }))

  return { highestScoring, biggestWin }
}

export async function getTopSingleMatchScorers(limit = 5): Promise<PlayerMatchRecord[]> {
  const rows = await prisma.$queryRaw<Array<{
    playerId:    string
    firstName:   string
    lastName:    string
    nickname:    string | null
    goals:       number
    matchId:     string
    seasonName:  string
    scheduledAt: Date
    vsTeam:      string
    teamId:      string
  }>>`
    SELECT
      p.id         AS "playerId",
      p."firstName",
      p."lastName",
      p.nickname,
      COUNT(g.id)::int AS goals,
      m.id         AS "matchId",
      s.name       AS "seasonName",
      m."scheduledAt",
      CASE
        WHEN g."teamId" = m."homeTeamId" THEN at.name
        ELSE ht.name
      END AS "vsTeam",
      g."teamId"
    FROM goals g
    JOIN players p  ON g."scorerId"    = p.id
    JOIN matches m  ON g."matchId"     = m.id
    JOIN seasons s  ON m."seasonId"    = s.id
    JOIN teams   ht ON m."homeTeamId"  = ht.id
    JOIN teams   at ON m."awayTeamId"  = at.id
    WHERE g."isOwnGoal" = false
    GROUP BY p.id, p."firstName", p."lastName", p.nickname,
             m.id, s.name, m."scheduledAt",
             g."teamId", m."homeTeamId", ht.name, at.name
    ORDER BY goals DESC, m."scheduledAt" DESC
    LIMIT ${limit}
  `
  return rows.map(({ teamId: _, ...r }) => r)
}

// ─── Additional types ─────────────────────────────────────────────────────────

export type ScorerRankingRow = {
  playerId:  string
  firstName: string
  lastName:  string
  nickname:  string | null
  teamName:  string | null
  teamColor: string | null
  goals:     number
  assists:   number
  matches:   number
}

export type HeadToHeadResult = {
  team1: { id: string; name: string; color: string; wins: number; goals: number }
  team2: { id: string; name: string; color: string; wins: number; goals: number }
  draws:        number
  totalMatches: number
  matches: Array<{
    matchId:     string
    scheduledAt: Date
    homeScore:   number
    awayScore:   number
    homeTeamId:  string
    seasonName:  string
  }>
}

export type TeamStatsRow = {
  teamId:           string
  teamName:         string
  teamColor:        string
  played:           number
  avgGoalsScored:   number
  avgGoalsConceded: number
  cleanSheets:      number
}

// ─── Scorer ranking ───────────────────────────────────────────────────────────

export async function getFullScorerRanking(seasonId?: string): Promise<ScorerRankingRow[]> {
  const matchFilter = seasonId ? { match: { seasonId } } : {}

  const players = await prisma.player.findMany({
    where: {
      OR: [
        { goalsScored:   { some: { isOwnGoal: false, ...matchFilter } } },
        { goalsAssisted: { some: matchFilter } },
        { matchLineups:  { some: matchFilter } },
      ],
    },
    include: {
      goalsScored: {
        where: { isOwnGoal: false, ...matchFilter },
        select: { id: true },
      },
      goalsAssisted: {
        where: matchFilter,
        select: { id: true },
      },
      matchLineups: {
        where: matchFilter,
        select: { matchId: true },
      },
      teamPlayers: seasonId
        ? {
            include: { team: { select: { name: true, color: true } } },
            where:   { team: { seasonId } },
          }
        : { include: { team: { select: { name: true, color: true } } } },
    },
  })

  return players
    .map((p) => {
      const matchIds = new Set(p.matchLineups.map((l) => l.matchId))
      return {
        playerId:  p.id,
        firstName: p.firstName,
        lastName:  p.lastName,
        nickname:  p.nickname,
        teamName:  p.teamPlayers[0]?.team.name  ?? null,
        teamColor: p.teamPlayers[0]?.team.color ?? null,
        goals:     p.goalsScored.length,
        assists:   p.goalsAssisted.length,
        matches:   matchIds.size,
      }
    })
    .filter((r) => r.goals > 0 || r.assists > 0)
    .sort((a, b) => b.goals - a.goals || b.assists - a.assists || a.lastName.localeCompare(b.lastName))
}

// ─── Head to head ─────────────────────────────────────────────────────────────

export async function getHeadToHead(team1Id: string, team2Id: string): Promise<HeadToHeadResult> {
  const [team1, team2] = await Promise.all([
    prisma.team.findUniqueOrThrow({ where: { id: team1Id }, select: { id: true, name: true, color: true } }),
    prisma.team.findUniqueOrThrow({ where: { id: team2Id }, select: { id: true, name: true, color: true } }),
  ])

  const matches = await prisma.match.findMany({
    where: {
      status: "PLAYED",
      homeScore: { not: null },
      awayScore: { not: null },
      OR: [
        { homeTeamId: team1Id, awayTeamId: team2Id },
        { homeTeamId: team2Id, awayTeamId: team1Id },
      ],
    },
    include: { season: { select: { name: true } } },
    orderBy: { scheduledAt: "desc" },
    take: 10,
  })

  let team1Wins = 0
  let team2Wins = 0
  let draws     = 0
  let team1Goals = 0
  let team2Goals = 0

  for (const m of matches) {
    const hs = m.homeScore!
    const as = m.awayScore!
    if (m.homeTeamId === team1Id) {
      team1Goals += hs
      team2Goals += as
      if (hs > as)      team1Wins++
      else if (hs < as) team2Wins++
      else              draws++
    } else {
      team1Goals += as
      team2Goals += hs
      if (as > hs)      team1Wins++
      else if (as < hs) team2Wins++
      else              draws++
    }
  }

  return {
    team1: { ...team1, wins: team1Wins, goals: team1Goals },
    team2: { ...team2, wins: team2Wins, goals: team2Goals },
    draws,
    totalMatches: matches.length,
    matches: matches.map((m) => ({
      matchId:     m.id,
      scheduledAt: m.scheduledAt,
      homeScore:   m.homeScore!,
      awayScore:   m.awayScore!,
      homeTeamId:  m.homeTeamId,
      seasonName:  m.season.name,
    })),
  }
}

// ─── Team stats ───────────────────────────────────────────────────────────────

export async function getTeamStats(seasonId: string): Promise<TeamStatsRow[]> {
  const matches = await prisma.match.findMany({
    where:   { seasonId, status: "PLAYED", homeScore: { not: null }, awayScore: { not: null } },
    include: { homeTeam: true, awayTeam: true },
  })

  const map = new Map<string, { teamName: string; teamColor: string; played: number; goalsFor: number; goalsAgainst: number; cleanSheets: number }>()

  const ensure = (team: { id: string; name: string; color: string }) => {
    if (!map.has(team.id)) {
      map.set(team.id, { teamName: team.name, teamColor: team.color, played: 0, goalsFor: 0, goalsAgainst: 0, cleanSheets: 0 })
    }
    return map.get(team.id)!
  }

  for (const m of matches) {
    const hg   = m.homeScore!
    const ag   = m.awayScore!
    const home = ensure(m.homeTeam)
    const away = ensure(m.awayTeam)

    home.played++; away.played++
    home.goalsFor     += hg; home.goalsAgainst += ag
    away.goalsFor     += ag; away.goalsAgainst += hg
    if (ag === 0) home.cleanSheets++
    if (hg === 0) away.cleanSheets++
  }

  return [...map.entries()]
    .map(([teamId, r]) => ({
      teamId,
      teamName:         r.teamName,
      teamColor:        r.teamColor,
      played:           r.played,
      avgGoalsScored:   r.played > 0 ? Math.round((r.goalsFor    / r.played) * 10) / 10 : 0,
      avgGoalsConceded: r.played > 0 ? Math.round((r.goalsAgainst / r.played) * 10) / 10 : 0,
      cleanSheets:      r.cleanSheets,
    }))
    .sort((a, b) => b.avgGoalsScored - a.avgGoalsScored)
}

// ─── Season overviews ─────────────────────────────────────────────────────────

export async function getSeasonOverviews(): Promise<SeasonOverview[]> {
  const seasons = await prisma.season.findMany({
    orderBy: { startDate: "desc" },
  })

  const results = await Promise.all(
    seasons.map(async (s) => {
      const [matches, standings] = await Promise.all([
        prisma.match.findMany({
          where: { seasonId: s.id, status: "PLAYED", homeScore: { not: null } },
          select: { homeScore: true, awayScore: true },
        }),
        getStandings(s.id),
      ])

      const played     = matches.length
      const totalGoals = matches.reduce((sum, m) => sum + (m.homeScore ?? 0) + (m.awayScore ?? 0), 0)
      const champion   = standings[0] ?? null

      return {
        seasonId:       s.id,
        seasonName:     s.name,
        played,
        totalGoals,
        avgGoals:       played > 0 ? Math.round((totalGoals / played) * 10) / 10 : 0,
        champion:       champion?.teamName ?? null,
        championColor:  champion?.teamColor ?? null,
        champPoints:    champion?.points ?? null,
      }
    })
  )

  return results
}
