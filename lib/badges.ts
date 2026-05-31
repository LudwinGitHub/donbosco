import { prisma } from "./prisma"

export type BadgeType = "striker" | "playmaker" | "hero-goal" | "hero-assist"
export type PlayerBadge = { type: BadgeType }

export async function getActiveBadges(seasonId?: string | null): Promise<Map<string, PlayerBadge[]>> {
  const result = new Map<string, PlayerBadge[]>()

  function add(playerId: string, badge: PlayerBadge) {
    const arr = result.get(playerId) ?? []
    arr.push(badge)
    result.set(playerId, arr)
  }

  const resolvedSeasonId = seasonId ?? (await prisma.season.findFirst({ where: { isActive: true }, select: { id: true } }))?.id

  if (resolvedSeasonId) {
    const [topScorer, topAssister] = await Promise.all([
      prisma.goal.groupBy({
        by: ["scorerId"],
        where: { match: { seasonId: resolvedSeasonId, status: "PLAYED" }, isOwnGoal: false },
        _count: { scorerId: true },
        orderBy: { _count: { scorerId: "desc" } },
        take: 1,
      }),
      prisma.goal.groupBy({
        by: ["assisterId"],
        where: { match: { seasonId: resolvedSeasonId, status: "PLAYED" }, assisterId: { not: null } },
        _count: { assisterId: true },
        orderBy: { _count: { assisterId: "desc" } },
        take: 1,
      }),
    ])

    if (topScorer[0]?._count.scorerId > 0) {
      add(topScorer[0].scorerId, { type: "striker" })
    }
    if (topAssister[0]?.assisterId && topAssister[0]._count.assisterId > 0) {
      add(topAssister[0].assisterId!, { type: "playmaker" })
    }
  }

  const lastMatch = await prisma.match.findFirst({
    where: { status: "PLAYED" },
    orderBy: { playedAt: "desc" },
    select: { id: true },
  })

  if (lastMatch) {
    const [heroGoal, heroAssist] = await Promise.all([
      prisma.goal.groupBy({
        by: ["scorerId"],
        where: { matchId: lastMatch.id, isOwnGoal: false },
        _count: { scorerId: true },
        orderBy: { _count: { scorerId: "desc" } },
        take: 1,
      }),
      prisma.goal.groupBy({
        by: ["assisterId"],
        where: { matchId: lastMatch.id, assisterId: { not: null } },
        _count: { assisterId: true },
        orderBy: { _count: { assisterId: "desc" } },
        take: 1,
      }),
    ])

    if (heroGoal[0]?._count.scorerId > 0) {
      add(heroGoal[0].scorerId, { type: "hero-goal" })
    }
    if (heroAssist[0]?.assisterId && heroAssist[0]._count.assisterId > 0) {
      add(heroAssist[0].assisterId!, { type: "hero-assist" })
    }
  }

  return result
}
