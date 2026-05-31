"use client"
import { useTransition } from "react"
import { toast } from "sonner"
import { castMvpVote, removeMvpVote } from "@/app/actions/mvp-votes"

type MvpVoteProps = {
  matchId: string
  lineup: Array<{
    playerId: string
    firstName: string
    lastName: string
    nickname: string | null
    teamName: string
    teamColor: string
    goals: number
    assists: number
  }>
  votes: Array<{ nomineeId: string; count: number }>
  myVoteNomineeId: string | null
  canVote: boolean
  votingDeadline: string | null
  votingClosed: boolean
}

export default function MvpVoteSection({
  matchId,
  lineup,
  votes,
  myVoteNomineeId,
  canVote,
  votingDeadline,
  votingClosed,
}: MvpVoteProps) {
  const [isPending, startTransition] = useTransition()

  // Build a map for quick vote-count lookup
  const voteMap = new Map(votes.map((v) => [v.nomineeId, v.count]))

  // Sort lineup by vote count descending
  const sorted = [...lineup].sort(
    (a, b) => (voteMap.get(b.playerId) ?? 0) - (voteMap.get(a.playerId) ?? 0),
  )

  const totalVotes = votes.reduce((sum, v) => sum + v.count, 0)

  function handleVote(nomineeId: string) {
    startTransition(async () => {
      try {
        await castMvpVote(matchId, nomineeId)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Błąd podczas głosowania.")
      }
    })
  }

  function handleRemoveVote() {
    startTransition(async () => {
      try {
        await removeMvpVote(matchId)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Błąd podczas usuwania głosu.")
      }
    })
  }

  const deadlineLabel = votingDeadline
    ? new Date(votingDeadline).toLocaleString("pl-PL", {
        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
      })
    : null

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Głosowanie MVP
        </h2>
        {votingClosed ? (
          <span className="text-xs text-zinc-400">Głosowanie zakończone</span>
        ) : deadlineLabel ? (
          <span className="text-xs text-zinc-400">Do: {deadlineLabel}</span>
        ) : null}
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <div className="divide-y divide-zinc-50">
          {sorted.map((player) => {
            const count = voteMap.get(player.playerId) ?? 0
            const isMyVote = myVoteNomineeId === player.playerId
            const hasVotedForOther = myVoteNomineeId !== null && !isMyVote

            return (
              <div
                key={player.playerId}
                className={
                  isMyVote
                    ? "bg-amber-50 border border-amber-200 rounded-lg mx-2 my-1.5 px-3 py-2"
                    : "px-3 py-2 mx-2 my-0.5 rounded-lg hover:bg-zinc-50 transition-colors"
                }
              >
                <div className="flex items-center gap-2">
                  {/* Team color dot */}
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: player.teamColor }}
                  />

                  {/* Player name and team */}
                  <div className="flex-1 min-w-0">
                    <span
                      className={`text-sm font-medium leading-snug ${
                        hasVotedForOther ? "text-zinc-400" : "text-zinc-900"
                      }`}
                    >
                      {player.firstName} {player.lastName}
                      {player.nickname && (
                        <span className="ml-1 text-xs font-normal text-zinc-400">
                          „{player.nickname}"
                        </span>
                      )}
                    </span>
                    <span
                      className={`ml-1.5 text-xs ${
                        hasVotedForOther ? "text-zinc-300" : "text-zinc-400"
                      }`}
                    >
                      {player.teamName}
                    </span>
                    {(player.goals > 0 || player.assists > 0) && (
                      <span className="ml-1.5 text-xs text-zinc-400">
                        {player.goals > 0 && `${player.goals} gol${player.goals === 1 ? "" : "e"}`}
                        {player.goals > 0 && player.assists > 0 && ", "}
                        {player.assists > 0 &&
                          `${player.assists} ${player.assists === 1 ? "asysta" : "asysty"}`}
                      </span>
                    )}
                  </div>

                  {/* Vote count */}
                  <span
                    className={`text-sm font-bold tabular-nums ${
                      count > 0
                        ? isMyVote
                          ? "text-amber-600"
                          : "text-amber-500"
                        : "text-zinc-300"
                    }`}
                  >
                    {count}
                    <span className="ml-0.5 text-xs font-normal text-zinc-400">
                      {" "}
                      {count === 1 ? "głos" : "głosów"}
                    </span>
                  </span>

                  {/* Vote button */}
                  {canVote && (
                    <>
                      {isMyVote ? (
                        <button
                          onClick={handleRemoveVote}
                          disabled={isPending}
                          className="shrink-0 rounded-md bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-200 disabled:opacity-50"
                        >
                          ✓ Twój głos
                        </button>
                      ) : hasVotedForOther ? (
                        <button
                          onClick={() => handleVote(player.playerId)}
                          disabled={isPending}
                          className="shrink-0 rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-300 hover:text-zinc-600 disabled:opacity-50"
                        >
                          zmień głos
                        </button>
                      ) : (
                        <button
                          onClick={() => handleVote(player.playerId)}
                          disabled={isPending}
                          className="shrink-0 rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 disabled:opacity-50"
                        >
                          Zagłosuj
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {totalVotes === 0 && !canVote && (
          <p className="px-4 py-3 text-center text-sm text-zinc-400">Brak głosów.</p>
        )}

        {totalVotes > 0 && (
          <p className="px-4 py-2.5 text-center text-xs text-zinc-400 border-t border-zinc-50">
            Łącznie: {totalVotes} {totalVotes === 1 ? "głos" : "głosów"}
          </p>
        )}
      </div>
    </section>
  )
}
