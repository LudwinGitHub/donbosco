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
