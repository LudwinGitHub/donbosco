"use client"
import { useState, useEffect, useTransition } from "react"
import { castDrawVote } from "@/app/actions/draws"

type PlayerInfo = { id: string; firstName: string; lastName: string; nickname: string | null }
type DrawOption = { team1: PlayerInfo[]; team2: PlayerInfo[]; rating1: number; rating2: number }

type VotePanelProps = {
  matchId:         string
  scheduledAtISO:  string
  windowOpenAtISO: string
  optionA:         DrawOption
  optionB:         DrawOption
  votesA:          number
  votesB:          number
  totalVotes:      number
  userVote:        "A" | "B" | null
  isLoggedIn:      boolean
  maxVotes:        number
}

type VotingState = "upcoming" | "active" | "closed"

export default function VotePanel(props: VotePanelProps) {
  const {
    matchId, scheduledAtISO, windowOpenAtISO,
    optionA, optionB, votesA, votesB, totalVotes,
    userVote, isLoggedIn, maxVotes,
  } = props

  const [timeDisplay, setTimeDisplay] = useState("")
  const [votingState, setVotingState] = useState<VotingState>("upcoming")
  const [isPending,   startTransition] = useTransition()

  useEffect(() => {
    const tick = () => {
      const now      = Date.now()
      const windowMs = new Date(windowOpenAtISO).getTime()
      const matchMs  = new Date(scheduledAtISO).getTime()

      if (totalVotes >= maxVotes || now >= matchMs) {
        setVotingState("closed")
        setTimeDisplay("Głosowanie zakończone")
        return
      }
      if (now < windowMs) {
        setVotingState("upcoming")
        setTimeDisplay("Otworzy się za " + fmtCountdown(windowMs - now))
      } else {
        setVotingState("active")
        setTimeDisplay("Mecz za " + fmtCountdown(matchMs - now))
      }
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [windowOpenAtISO, scheduledAtISO, totalVotes, maxVotes])

  const vote = (choice: "A" | "B" | null) => {
    if (!isLoggedIn || isPending || votingState !== "active") return
    startTransition(async () => {
      await castDrawVote(matchId, choice)
    })
  }

  const pctA = totalVotes === 0 ? 50 : Math.round((votesA / totalVotes) * 100)

  return (
    <div className="space-y-4">
      {/* Status bar */}
      <div className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium ${
        votingState === "closed"   ? "bg-zinc-100 text-zinc-500" :
        votingState === "upcoming" ? "bg-amber-50 text-amber-700" :
                                     "bg-green-50 text-green-700"
      }`}>
        <span className="flex items-center gap-2">
          <span className={`h-2 w-2 shrink-0 rounded-full ${
            votingState === "closed"   ? "bg-zinc-400" :
            votingState === "upcoming" ? "bg-amber-400" :
                                         "animate-pulse bg-green-500"
          }`} />
          {votingState === "closed"   ? "Głosowanie zakończone" :
           votingState === "upcoming" ? "Głosowanie wkrótce" :
                                        "Głosowanie otwarte"}
        </span>
        <span className="tabular-nums font-mono text-sm">{timeDisplay}</span>
      </div>

      {/* Vote tally */}
      {totalVotes > 0 && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-zinc-400">
            <span>Opcja A — {votesA} {voteLabel(votesA)}</span>
            <span className="font-medium text-zinc-500">{totalVotes}/{maxVotes}</span>
            <span>Opcja B — {votesB} {voteLabel(votesB)}</span>
          </div>
          <div className="flex h-2 overflow-hidden rounded-full bg-amber-100">
            <div
              className="h-full rounded-full bg-blue-400 transition-all duration-700"
              style={{ width: `${pctA}%` }}
            />
          </div>
        </div>
      )}

      {/* Option cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <OptionCard
          label="Opcja A"
          accentColor="#3b82f6"
          option={optionA}
          votes={votesA}
          totalVotes={totalVotes}
          isChosen={userVote === "A"}
          votingState={votingState}
          isLoggedIn={isLoggedIn}
          isPending={isPending}
          onVote={() => vote(userVote === "A" ? null : "A")}
        />
        <OptionCard
          label="Opcja B"
          accentColor="#f59e0b"
          option={optionB}
          votes={votesB}
          totalVotes={totalVotes}
          isChosen={userVote === "B"}
          votingState={votingState}
          isLoggedIn={isLoggedIn}
          isPending={isPending}
          onVote={() => vote(userVote === "B" ? null : "B")}
        />
      </div>

      {!isLoggedIn && votingState === "active" && (
        <p className="text-center text-sm text-zinc-400">
          <a href="/logowanie" className="underline underline-offset-2 hover:text-zinc-600">
            Zaloguj się
          </a>
          , żeby oddać głos.
        </p>
      )}
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function OptionCard({
  label, accentColor, option, votes, totalVotes,
  isChosen, votingState, isLoggedIn, isPending, onVote,
}: {
  label:       string
  accentColor: string
  option:      DrawOption
  votes:       number
  totalVotes:  number
  isChosen:    boolean
  votingState: VotingState
  isLoggedIn:  boolean
  isPending:   boolean
  onVote:      () => void
}) {
  const pct      = totalVotes === 0 ? 0 : Math.round((votes / totalVotes) * 100)
  const otherVotes = totalVotes - votes
  const isWinner = votingState === "closed" && totalVotes > 0 && votes > otherVotes

  return (
    <div className={`overflow-hidden rounded-xl border transition-colors ${
      isWinner ? "border-green-300 bg-green-50" :
      isChosen ? "border-zinc-400 bg-zinc-50"   :
                 "border-zinc-200 bg-white"
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-zinc-800">
          <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: accentColor }} />
          {label}
          {isChosen && votingState === "active" && (
            <span className="text-xs font-normal text-zinc-500">· Twój głos</span>
          )}
          {isWinner && <span className="text-xs font-medium text-green-600">· Zwycięska</span>}
        </span>
        {totalVotes > 0 && (
          <span className="tabular-nums text-xs text-zinc-400">{votes} ({pct}%)</span>
        )}
      </div>

      {/* Player lists */}
      <div className="p-4 space-y-3">
        <TeamMini label="Drużyna 1" players={option.team1} />
        <TeamMini label="Drużyna 2" players={option.team2} />
      </div>

      {/* Vote button — only when active and logged in */}
      {votingState === "active" && isLoggedIn && (
        <div className="px-4 pb-4">
          <button
            onClick={onVote}
            disabled={isPending}
            className={`w-full rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
              isChosen
                ? "bg-zinc-800 text-white hover:bg-zinc-600"
                : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            {isChosen ? "Wycofaj głos" : `Głosuję za ${label}`}
          </button>
        </div>
      )}
    </div>
  )
}

function TeamMini({ label, players }: { label: string; players: PlayerInfo[] }) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">{label}</p>
      <ul className="space-y-0.5">
        {players.map((p) => (
          <li key={p.id} className="text-sm text-zinc-700">
            {p.firstName} {p.lastName}
            {p.nickname && <span className="ml-1 text-xs text-zinc-400">„{p.nickname}"</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}

function fmtCountdown(ms: number): string {
  if (ms <= 0) return "0:00:00"
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return `${h}:${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`
}

function voteLabel(n: number): string {
  if (n === 1) return "głos"
  if (n >= 2 && n <= 4) return "głosy"
  return "głosów"
}
