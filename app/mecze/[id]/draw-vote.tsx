"use client"
import { useTransition } from "react"
import { castDrawVote } from "@/app/actions/draws"

type PlayerInfo = {
  id: string
  firstName: string
  lastName: string
  nickname: string | null
}

type DrawOption = {
  team1: PlayerInfo[]
  team2: PlayerInfo[]
  rating1: number
  rating2: number
}

export type DrawVoteData = {
  matchId:    string
  optionA:    DrawOption
  optionB:    DrawOption
  votesA:     number
  votesB:     number
  userVote:   "A" | "B" | null
  isLoggedIn: boolean
}

export default function DrawVoting({ data }: { data: DrawVoteData }) {
  const [isPending, startTransition] = useTransition()

  const vote = (choice: "A" | "B") => {
    if (!data.isLoggedIn || isPending) return
    startTransition(async () => {
      await castDrawVote(data.matchId, choice)
    })
  }

  const totalVotes = data.votesA + data.votesB
  const pctA = totalVotes === 0 ? 50 : Math.round((data.votesA / totalVotes) * 100)

  return (
    <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
        <span className="text-sm font-semibold text-zinc-900">Głosowanie na skład</span>
        {totalVotes > 0 && (
          <span className="text-xs text-zinc-400">
            {totalVotes} {totalVotes === 1 ? "głos" : totalVotes < 5 ? "głosy" : "głosów"}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 divide-x divide-zinc-100">
        <VoteOption
          label="Opcja A"
          option={data.optionA}
          votes={data.votesA}
          pct={pctA}
          isChosen={data.userVote === "A"}
          onVote={() => vote("A")}
          isPending={isPending}
          isLoggedIn={data.isLoggedIn}
        />
        <VoteOption
          label="Opcja B"
          option={data.optionB}
          votes={data.votesB}
          pct={100 - pctA}
          isChosen={data.userVote === "B"}
          onVote={() => vote("B")}
          isPending={isPending}
          isLoggedIn={data.isLoggedIn}
        />
      </div>

      {!data.isLoggedIn && (
        <p className="px-4 py-2 border-t border-zinc-100 text-xs text-center text-zinc-400">
          Zaloguj się, żeby oddać głos.
        </p>
      )}
    </div>
  )
}

function VoteOption({
  label,
  option,
  votes,
  pct,
  isChosen,
  onVote,
  isPending,
  isLoggedIn,
}: {
  label: string
  option: DrawOption
  votes: number
  pct: number
  isChosen: boolean
  onVote: () => void
  isPending: boolean
  isLoggedIn: boolean
}) {
  return (
    <div className={`p-4 space-y-3 transition-colors ${isChosen ? "bg-zinc-50" : ""}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-zinc-800">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400 tabular-nums">{pct}%</span>
          {isLoggedIn && (
            <button
              onClick={onVote}
              disabled={isPending}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                isChosen
                  ? "bg-zinc-900 text-white"
                  : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {isChosen ? "Wybrałem/am" : "Głosuję"}
            </button>
          )}
        </div>
      </div>

      {/* Vote bar */}
      <div className="h-1.5 rounded-full bg-zinc-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-zinc-400 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Teams */}
      <div className="space-y-2">
        <TeamMiniList label="Drużyna 1" players={option.team1} />
        <TeamMiniList label="Drużyna 2" players={option.team2} />
      </div>
    </div>
  )
}

function TeamMiniList({ label, players }: { label: string; players: PlayerInfo[] }) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold text-zinc-400 uppercase tracking-wide">{label}</p>
      <ul className="space-y-0.5">
        {players.map((p) => (
          <li key={p.id} className="text-sm text-zinc-700 leading-snug">
            {p.firstName} {p.lastName}
            {p.nickname && (
              <span className="ml-1 text-xs text-zinc-400">„{p.nickname}"</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
