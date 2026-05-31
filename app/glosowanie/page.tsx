import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { getOptionalSession } from "@/lib/dal"
import VotePanel from "./vote-panel"
import MvpVoteSection from "@/app/mecze/[id]/mvp-vote"

const DRAW_VOTE_WINDOW_MS = 3 * 60 * 60 * 1000
const MVP_WINDOW_MS       = 3 * 24 * 60 * 60 * 1000

export default async function GlosowaniePage() {
  const session = await getOptionalSession()

  const [draw, mvpMatch] = await Promise.all([
    prisma.matchDraw.findFirst({
      where:   { match: { status: "SCHEDULED", scheduledAt: { gt: new Date() } } },
      include: {
        match:  { select: { scheduledAt: true, homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } } } },
        votes:  { select: { choice: true, userId: true } },
        _count: { select: { votes: true } },
      },
      orderBy: { match: { scheduledAt: "asc" } },
    }),
    prisma.match.findFirst({
      where:   { status: "PLAYED", matchLineups: { some: {} } },
      orderBy: { playedAt: "desc" },
      include: {
        homeTeam:     { select: { name: true, color: true } },
        awayTeam:     { select: { name: true, color: true } },
        mvpPlayer:    { select: { id: true, firstName: true, lastName: true } },
        matchLineups: {
          include: {
            player: { select: { id: true, userId: true, firstName: true, lastName: true, nickname: true } },
            team:   { select: { name: true, color: true } },
          },
        },
        goals: {
          include: { scorer: { select: { id: true } }, assister: { select: { id: true } } },
        },
      },
    }),
  ])

  // ── MVP voting data ──────────────────────────────────────────────────────────

  const mvpDeadline  = mvpMatch?.playedAt
    ? new Date(mvpMatch.playedAt.getTime() + MVP_WINDOW_MS)
    : null
  const mvpVotingOpen = !!mvpDeadline && new Date() < mvpDeadline && !mvpMatch?.mvpPlayer

  const [mvpVotes, myMvpVote] = mvpMatch
    ? await Promise.all([
        prisma.matchMvpVote.groupBy({
          by:      ["nomineeId"],
          where:   { matchId: mvpMatch.id },
          _count:  { nomineeId: true },
          orderBy: { _count: { nomineeId: "desc" } },
        }),
        session
          ? prisma.matchMvpVote.findUnique({
              where: { matchId_voterId: { matchId: mvpMatch.id, voterId: session.userId } },
            })
          : Promise.resolve(null),
      ])
    : [[], null]

  const myPlayerInLineup = session && mvpMatch
    ? mvpMatch.matchLineups.find((l) => l.player.userId === session.userId)
    : null
  const canVote = !!myPlayerInLineup && mvpVotingOpen

  const lineupWithStats = mvpMatch
    ? mvpMatch.matchLineups.map((l) => ({
        playerId:  l.player.id,
        firstName: l.player.firstName,
        lastName:  l.player.lastName,
        nickname:  l.player.nickname ?? null,
        teamName:  l.team.name,
        teamColor: l.team.color,
        goals:   mvpMatch.goals.filter((g) => g.scorer.id === l.player.id && !g.isOwnGoal).length,
        assists: mvpMatch.goals.filter((g) => g.assister?.id === l.player.id).length,
      }))
    : []

  // ── Draw voting data ──────────────────────────────────────────────────────────

  let drawSection: React.ReactNode = null
  if (draw) {
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
    const windowOpenAt = new Date(scheduledAt.getTime() - DRAW_VOTE_WINDOW_MS)
    const votesA       = draw.votes.filter((v) => v.choice === "A").length
    const votesB       = draw.votes.filter((v) => v.choice === "B").length
    const userVote     = session
      ? (draw.votes.find((v) => v.userId === session.userId)?.choice ?? null)
      : null

    drawSection = (
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-bold">Głosowanie na skład</h2>
          <p className="mt-0.5 text-sm text-zinc-500">
            {draw.match.homeTeam.name} vs {draw.match.awayTeam.name}
          </p>
        </div>
        <VotePanel
          matchId={draw.matchId}
          scheduledAtISO={scheduledAt.toISOString()}
          windowOpenAtISO={windowOpenAt.toISOString()}
          optionA={{ team1: resolve(draw.optionATeam1), team2: resolve(draw.optionATeam2), rating1: draw.optionARating1, rating2: draw.optionARating2 }}
          optionB={{ team1: resolve(draw.optionBTeam1), team2: resolve(draw.optionBTeam2), rating1: draw.optionBRating1, rating2: draw.optionBRating2 }}
          votesA={votesA}
          votesB={votesB}
          totalVotes={votesA + votesB}
          userVote={userVote as "A" | "B" | null}
          isLoggedIn={!!session}
          maxVotes={14}
        />
      </section>
    )
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Głosowanie</h1>

      {/* ── MVP ── */}
      {mvpMatch ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">MVP meczu</h2>
              <p className="mt-0.5 text-sm text-zinc-500">
                {mvpMatch.homeTeam.name} vs {mvpMatch.awayTeam.name}
                {mvpMatch.round !== null && ` · kolejka ${mvpMatch.round}`}
              </p>
            </div>
            <Link
              href={`/mecze/${mvpMatch.id}`}
              className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              Szczegóły meczu →
            </Link>
          </div>

          {mvpMatch.mvpPlayer && !mvpVotingOpen ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 flex items-center gap-4">
              <span className="text-3xl">⭐</span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">MVP meczu</p>
                <p className="mt-0.5 text-lg font-bold text-zinc-900">
                  {mvpMatch.mvpPlayer.firstName} {mvpMatch.mvpPlayer.lastName}
                </p>
              </div>
            </div>
          ) : (
            <MvpVoteSection
              matchId={mvpMatch.id}
              lineup={lineupWithStats}
              votes={mvpVotes.map((v) => ({ nomineeId: v.nomineeId, count: v._count.nomineeId }))}
              myVoteNomineeId={myMvpVote?.nomineeId ?? null}
              canVote={canVote}
              votingDeadline={mvpDeadline?.toISOString() ?? null}
              votingClosed={!mvpVotingOpen}
            />
          )}
        </section>
      ) : (
        <section>
          <h2 className="text-lg font-bold">MVP meczu</h2>
          <div className="mt-3 rounded-xl border border-zinc-200 bg-white px-6 py-10 text-center text-sm text-zinc-400">
            Brak rozegranych meczów.
          </div>
        </section>
      )}

      {/* ── Skład ── */}
      {drawSection ?? (
        <section>
          <h2 className="text-lg font-bold">Głosowanie na skład</h2>
          <div className="mt-3 rounded-xl border border-zinc-200 bg-white px-6 py-10 text-center text-sm text-zinc-400">
            Brak aktywnego losowania. Organizator opublikuje składy przed meczem.
          </div>
        </section>
      )}
    </div>
  )
}
