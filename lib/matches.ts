import { prisma } from "./prisma"

export type MatchListItem = {
  id: string
  round: number | null
  scheduledAt: Date
  playedAt: Date | null
  status: string
  venue: string | null
  homeScore: number | null
  awayScore: number | null
  playerLimit: number
  homeTeam: { id: string; name: string; color: string }
  awayTeam: { id: string; name: string; color: string }
}

export async function getMatches(seasonId: string): Promise<MatchListItem[]> {
  return prisma.match.findMany({
    where: { seasonId },
    include: { homeTeam: true, awayTeam: true },
    orderBy: [{ round: "desc" }, { scheduledAt: "desc" }],
  })
}

export type GoalDetail = {
  id: string
  minute: number | null
  isOwnGoal: boolean
  teamId: string
  scorer: { id: string; firstName: string; lastName: string; nickname: string | null }
  assister: { id: string; firstName: string; lastName: string; nickname: string | null } | null
}

export type LineupEntry = {
  teamId: string
  player: { id: string; userId: string | null; firstName: string; lastName: string; nickname: string | null }
  team: { id: string; name: string; color: string }
}

export type MatchDetail = MatchListItem & {
  goals:        GoalDetail[]
  matchLineups: LineupEntry[]
  mvpPlayer:    { id: string; firstName: string; lastName: string } | null
}

export async function getMatchById(id: string): Promise<MatchDetail | null> {
  return prisma.match.findUnique({
    where: { id },
    include: {
      homeTeam: true,
      awayTeam: true,
      goals: {
        include: { scorer: true, assister: true },
        orderBy: { minute: "asc" },
      },
      matchLineups: {
        include: { player: true, team: true },
        orderBy: { player: { lastName: "asc" } },
      },
      mvpPlayer: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  })
}
