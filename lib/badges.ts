import { prisma } from "./prisma"

export type BadgeType =
  | "striker" | "playmaker"
  | "hero-goal" | "hero-assist"
  | "hat-trick"
  | "on-fire" | "assist-streak"
  | "iron-man" | "veteran"
  | "champion"
  | "mvp-legend"
  | "goals-5" | "goals-10" | "goals-15"
  | "deadly-duo"

export type PlayerBadge = { type: BadgeType }

export async function getActiveBadges(seasonId?: string | null): Promise<Map<string, PlayerBadge[]>> {
  const result = new Map<string, PlayerBadge[]>()

  function add(playerId: string, type: BadgeType) {
    const arr = result.get(playerId) ?? []
    arr.push({ type })
    result.set(playerId, arr)
  }

  const [
    resolvedSeason,
    lastMatch,
    allLineups,
    allGoals,
    allPlayedMatches,
    mvpGroupBy,
    lastInactiveSeason,
  ] = await Promise.all([
    seasonId
      ? Promise.resolve({ id: seasonId } as { id: string } | null)
      : prisma.season.findFirst({ where: { isActive: true }, select: { id: true } }),
    prisma.match.findFirst({
      where:   { status: "PLAYED" },
      orderBy: { scheduledAt: "desc" },
      select:  { id: true },
    }),
    prisma.matchLineup.findMany({
      where:   { match: { status: "PLAYED" } },
      select:  { playerId: true, teamId: true, match: { select: { id: true, seasonId: true, scheduledAt: true } } },
      orderBy: { match: { scheduledAt: "desc" } },
    }),
    prisma.goal.findMany({
      where:  { match: { status: "PLAYED" }, isOwnGoal: false },
      select: { scorerId: true, assisterId: true, matchId: true, match: { select: { seasonId: true } } },
    }),
    prisma.match.findMany({
      where:  { status: "PLAYED" },
      select: { id: true, seasonId: true, homeTeamId: true, awayTeamId: true, homeScore: true, awayScore: true },
    }),
    prisma.match.groupBy({
      by:      ["mvpPlayerId"],
      where:   { mvpPlayerId: { not: null }, status: "PLAYED" },
      _count:  { mvpPlayerId: true },
    }),
    prisma.season.findFirst({
      where:   { isActive: false },
      orderBy: { startDate: "desc" },
      select:  { id: true },
    }),
  ])

  const sid = resolvedSeason?.id

  // ── Index: per-player lineup history (desc by date) ───────────────────────

  const playerMatches = new Map<string, string[]>()     // playerId -> [matchId] desc
  const playerTeamInSeason = new Map<string, Map<string, string>>() // seasonId -> playerId -> teamId

  for (const l of allLineups) {
    const arr = playerMatches.get(l.playerId) ?? []
    arr.push(l.match.id)
    playerMatches.set(l.playerId, arr)

    const seasonMap = playerTeamInSeason.get(l.match.seasonId) ?? new Map()
    if (!seasonMap.has(l.playerId)) seasonMap.set(l.playerId, l.teamId)
    playerTeamInSeason.set(l.match.seasonId, seasonMap)
  }

  // ── Index: goal/assist presence per player per match ─────────────────────

  const scoredIn  = new Map<string, Set<string>>() // playerId -> Set<matchId>
  const assistedIn = new Map<string, Set<string>>() // playerId -> Set<matchId>

  const seasonGoals   = new Map<string, number>() // playerId -> count (active season)
  const seasonAssists = new Map<string, number>() // playerId -> count
  const seasonDuo     = new Map<string, number>() // `scorerId:assisterId` -> count
  const lastGoals     = new Map<string, number>() // playerId -> count (last match)
  const lastAssists   = new Map<string, number>() // playerId -> count

  for (const g of allGoals) {
    const isActiveSeason = g.match.seasonId === sid
    const isLastMatch    = g.matchId === lastMatch?.id

    // scored
    const scoredSet = scoredIn.get(g.scorerId) ?? new Set()
    scoredSet.add(g.matchId)
    scoredIn.set(g.scorerId, scoredSet)

    if (isActiveSeason) seasonGoals.set(g.scorerId, (seasonGoals.get(g.scorerId) ?? 0) + 1)
    if (isLastMatch)    lastGoals.set(g.scorerId,   (lastGoals.get(g.scorerId)   ?? 0) + 1)

    // assisted
    if (g.assisterId) {
      const assistSet = assistedIn.get(g.assisterId) ?? new Set()
      assistSet.add(g.matchId)
      assistedIn.set(g.assisterId, assistSet)

      if (isActiveSeason) {
        seasonAssists.set(g.assisterId, (seasonAssists.get(g.assisterId) ?? 0) + 1)
        const key = `${g.scorerId}:${g.assisterId}`
        seasonDuo.set(key, (seasonDuo.get(key) ?? 0) + 1)
      }
      if (isLastMatch) lastAssists.set(g.assisterId, (lastAssists.get(g.assisterId) ?? 0) + 1)
    }
  }

  // ── Hero: top scorer / assister of last match ─────────────────────────────

  if (lastMatch) {
    let maxG = 0, maxA = 0
    for (const c of lastGoals.values())   maxG = Math.max(maxG, c)
    for (const c of lastAssists.values()) maxA = Math.max(maxA, c)
    if (maxG > 0) for (const [pid, c] of lastGoals)   if (c === maxG) add(pid, "hero-goal")
    if (maxA > 0) for (const [pid, c] of lastAssists) if (c === maxA) add(pid, "hero-assist")

    // Hat-trick
    for (const [pid, c] of lastGoals) if (c >= 3) add(pid, "hat-trick")
  }

  // ── Seasonal badges ────────────────────────────────────────────────────────

  if (sid) {
    // Striker: top scorer
    let maxG = 0
    for (const c of seasonGoals.values()) maxG = Math.max(maxG, c)
    if (maxG > 0) for (const [pid, c] of seasonGoals) if (c === maxG) add(pid, "striker")

    // Playmaker: top assister
    let maxA = 0
    for (const c of seasonAssists.values()) maxA = Math.max(maxA, c)
    if (maxA > 0) for (const [pid, c] of seasonAssists) if (c === maxA) add(pid, "playmaker")

    // Goal milestones (highest tier wins)
    for (const [pid, c] of seasonGoals) {
      if (c >= 15)     add(pid, "goals-15")
      else if (c >= 10) add(pid, "goals-10")
      else if (c >= 5)  add(pid, "goals-5")
    }

    // Deadly Duo
    if (seasonDuo.size > 0) {
      const best = [...seasonDuo.entries()].sort((a, b) => b[1] - a[1])[0]
      if (best[1] >= 2) {
        const [scorerId, assisterId] = best[0].split(":")
        add(scorerId,   "deadly-duo")
        add(assisterId, "deadly-duo")
      }
    }

    // Iron Man: played in all PLAYED matches of the season (min 5 matches)
    const seasonMatchIds = new Set(allPlayedMatches.filter(m => m.seasonId === sid).map(m => m.id))
    if (seasonMatchIds.size >= 5) {
      for (const [pid, matchArr] of playerMatches) {
        const seasonCount = matchArr.filter(mid => seasonMatchIds.has(mid)).length
        if (seasonCount >= seasonMatchIds.size) add(pid, "iron-man")
      }
    }
  }

  // ── On Fire: goal or assist in each of last 3 appearances ─────────────────

  for (const [pid, matchArr] of playerMatches) {
    if (matchArr.length < 3) continue
    const last3 = matchArr.slice(0, 3)
    if (last3.every(mid => scoredIn.get(pid)?.has(mid) || assistedIn.get(pid)?.has(mid))) {
      add(pid, "on-fire")
    }
  }

  // ── Assist Streak: assist in each of last 3 appearances ───────────────────

  for (const [pid, matchArr] of playerMatches) {
    if (matchArr.length < 3) continue
    const last3 = matchArr.slice(0, 3)
    if (last3.every(mid => assistedIn.get(pid)?.has(mid))) {
      add(pid, "assist-streak")
    }
  }

  // ── Veteran: most all-time appearances (min 10) ───────────────────────────

  let maxApps = 0
  for (const arr of playerMatches.values()) maxApps = Math.max(maxApps, arr.length)
  if (maxApps >= 10) {
    for (const [pid, arr] of playerMatches) if (arr.length === maxApps) add(pid, "veteran")
  }

  // ── MVP Legend: 3+ MVP titles ─────────────────────────────────────────────

  for (const row of mvpGroupBy) {
    if (row.mvpPlayerId && row._count.mvpPlayerId >= 3) add(row.mvpPlayerId, "mvp-legend")
  }

  // ── Champion: players of winning team in last completed season ────────────

  if (lastInactiveSeason) {
    const prevMatches = allPlayedMatches.filter(m => m.seasonId === lastInactiveSeason.id)
    const pts = new Map<string, number>()
    for (const m of prevMatches) {
      if (m.homeScore === null || m.awayScore === null) continue
      const h = pts.get(m.homeTeamId) ?? 0
      const a = pts.get(m.awayTeamId) ?? 0
      if (m.homeScore > m.awayScore)      { pts.set(m.homeTeamId, h + 3); pts.set(m.awayTeamId, a) }
      else if (m.homeScore < m.awayScore) { pts.set(m.homeTeamId, h);     pts.set(m.awayTeamId, a + 3) }
      else                                { pts.set(m.homeTeamId, h + 1); pts.set(m.awayTeamId, a + 1) }
    }
    if (pts.size > 0) {
      const winnerTeamId = [...pts.entries()].sort((a, b) => b[1] - a[1])[0][0]
      const seasonPlayerTeam = playerTeamInSeason.get(lastInactiveSeason.id)
      if (seasonPlayerTeam) {
        for (const [pid, teamId] of seasonPlayerTeam) {
          if (teamId === winnerTeamId) add(pid, "champion")
        }
      }
    }
  }

  return result
}
