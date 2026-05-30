import { prisma } from "@/lib/prisma"
import { getOptionalSession } from "@/lib/dal"
import VotePanel from "./vote-panel"

const VOTE_WINDOW_MS = 3 * 60 * 60 * 1000

export default async function GlosowaniePage() {
  const [session, draw] = await Promise.all([
    getOptionalSession(),
    prisma.matchDraw.findFirst({
      where:   { match: { status: "SCHEDULED", scheduledAt: { gt: new Date() } } },
      include: {
        match:  { select: { scheduledAt: true, homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } } } },
        votes:  { select: { choice: true, userId: true } },
        _count: { select: { votes: true } },
      },
      orderBy: { match: { scheduledAt: "asc" } },
    }),
  ])

  if (!draw) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Głosowanie na skład</h1>
        <div className="rounded-xl border border-zinc-200 bg-white px-6 py-16 text-center text-sm text-zinc-400">
          Brak aktywnego losowania. Organizator opublikuje składy przed meczem.
        </div>
      </div>
    )
  }

  // Resolve player names
  const allIds = [...new Set([
    ...draw.optionATeam1, ...draw.optionATeam2,
    ...draw.optionBTeam1, ...draw.optionBTeam2,
  ])]
  const drawPlayers = await prisma.player.findMany({
    where:  { id: { in: allIds } },
    select: { id: true, firstName: true, lastName: true, nickname: true },
  })
  const pm      = new Map(drawPlayers.map((p) => [p.id, p]))
  const resolve = (ids: string[]) =>
    ids.map((i) => pm.get(i)).filter((p): p is NonNullable<typeof p> => !!p)

  const scheduledAt  = draw.match.scheduledAt
  const windowOpenAt = new Date(scheduledAt.getTime() - VOTE_WINDOW_MS)
  const votesA       = draw.votes.filter((v) => v.choice === "A").length
  const votesB       = draw.votes.filter((v) => v.choice === "B").length
  const userVote     = session
    ? (draw.votes.find((v) => v.userId === session.userId)?.choice ?? null)
    : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Głosowanie na skład</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {draw.match.homeTeam.name} vs {draw.match.awayTeam.name}
        </p>
      </div>
      <VotePanel
        matchId={draw.matchId}
        scheduledAtISO={scheduledAt.toISOString()}
        windowOpenAtISO={windowOpenAt.toISOString()}
        optionA={{
          team1:   resolve(draw.optionATeam1),
          team2:   resolve(draw.optionATeam2),
          rating1: draw.optionARating1,
          rating2: draw.optionARating2,
        }}
        optionB={{
          team1:   resolve(draw.optionBTeam1),
          team2:   resolve(draw.optionBTeam2),
          rating1: draw.optionBRating1,
          rating2: draw.optionBRating2,
        }}
        votesA={votesA}
        votesB={votesB}
        totalVotes={votesA + votesB}
        userVote={userVote as "A" | "B" | null}
        isLoggedIn={!!session}
        maxVotes={14}
      />
    </div>
  )
}
