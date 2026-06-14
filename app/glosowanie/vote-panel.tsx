"use client"
import { useState, useEffect, useTransition, useOptimistic } from "react"
import { useRouter } from "next/navigation"
import { castDrawVote } from "@/app/actions/draws"
import PollBar from "@/app/ui/poll-bar"

type PlayerInfo = { id: string; firstName: string; lastName: string; nickname: string | null }
type DrawOption = { team1: PlayerInfo[]; team2: PlayerInfo[]; rating1: number; rating2: number }

type VotePanelProps = {
  matchId:          string
  scheduledAtISO:   string
  windowOpenAtISO:  string
  windowCloseAtISO: string
  optionA:         DrawOption
  optionB:         DrawOption
  votesA:          number
  votesB:          number
  totalVotes:      number
  userVote:        "A" | "B" | null
  isLoggedIn:      boolean
  maxVotes:        number
  homeTeamName:    string
  awayTeamName:    string
}

type VotingState = "upcoming" | "active" | "closed"

export default function VotePanel(props: VotePanelProps) {
  const {
    matchId, windowOpenAtISO, windowCloseAtISO,
    optionA, optionB,
    userVote, votesA, votesB, totalVotes,
    isLoggedIn, maxVotes,
    homeTeamName, awayTeamName,
  } = props

  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [timeDisplay, setTimeDisplay] = useState("")
  const [votingState, setVotingState] = useState<VotingState>("upcoming")

  // ── Optimistic state — instant UI feedback before server confirms ──────────
  const [opt, updateOpt] = useOptimistic(
    { userVote, votesA, votesB, totalVotes },
    (state, newVote: "A" | "B" | null) => {
      let a = state.votesA, b = state.votesB, t = state.totalVotes
      if (state.userVote === "A") { a = Math.max(0, a - 1); t = Math.max(0, t - 1) }
      if (state.userVote === "B") { b = Math.max(0, b - 1); t = Math.max(0, t - 1) }
      if (newVote === "A") { a++; t++ }
      if (newVote === "B") { b++; t++ }
      return { userVote: newVote, votesA: a, votesB: b, totalVotes: t }
    }
  )

  // ── Clock ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const tick = () => {
      const now     = Date.now()
      const windowMs = new Date(windowOpenAtISO).getTime()
      const closeMs  = new Date(windowCloseAtISO).getTime()
      if (totalVotes >= maxVotes || now >= closeMs) {
        setVotingState("closed")
        setTimeDisplay("Głosowanie zakończone")
        return
      }
      if (now < windowMs) {
        setVotingState("upcoming")
        setTimeDisplay("Otworzy się za " + fmtCountdown(windowMs - now))
      } else {
        setVotingState("active")
        setTimeDisplay("Zamknięcie za " + fmtCountdown(closeMs - now))
      }
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [windowOpenAtISO, windowCloseAtISO, totalVotes, maxVotes])

  // ── Live polling — refresh server data every 12s when voting is active ─────
  useEffect(() => {
    if (votingState !== "active") return
    const id = setInterval(() => router.refresh(), 12_000)
    return () => clearInterval(id)
  }, [votingState, router])

  // ── Vote handler ───────────────────────────────────────────────────────────
  const vote = (choice: "A" | "B" | null) => {
    if (!isLoggedIn || isPending || votingState !== "active") return
    startTransition(async () => {
      updateOpt(choice)
      await castDrawVote(matchId, choice)
    })
  }

  const pctA = opt.totalVotes === 0 ? 50 : Math.round((opt.votesA / opt.totalVotes) * 100)

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
      {opt.totalVotes > 0 && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-zinc-400">
            <span>Opcja A — {opt.votesA} {voteLabel(opt.votesA)}</span>
            <span className="font-medium text-zinc-500">{opt.totalVotes}/{maxVotes}</span>
            <span>Opcja B — {opt.votesB} {voteLabel(opt.votesB)}</span>
          </div>
          <PollBar pct={pctA} color="bg-blue-400" />
        </div>
      )}

      {/* Option cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <OptionCard
          label="Opcja A" accentColor="#3b82f6"
          option={optionA} votes={opt.votesA} totalVotes={opt.totalVotes}
          isChosen={opt.userVote === "A"}
          votingState={votingState} isLoggedIn={isLoggedIn} isPending={isPending}
          onVote={() => vote(opt.userVote === "A" ? null : "A")}
          homeTeamName={homeTeamName} awayTeamName={awayTeamName}
        />
        <OptionCard
          label="Opcja B" accentColor="#f59e0b"
          option={optionB} votes={opt.votesB} totalVotes={opt.totalVotes}
          isChosen={opt.userVote === "B"}
          votingState={votingState} isLoggedIn={isLoggedIn} isPending={isPending}
          onVote={() => vote(opt.userVote === "B" ? null : "B")}
          homeTeamName={homeTeamName} awayTeamName={awayTeamName}
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
  homeTeamName, awayTeamName,
}: {
  label:        string
  accentColor:  string
  option:       DrawOption
  votes:        number
  totalVotes:   number
  isChosen:     boolean
  votingState:  VotingState
  isLoggedIn:   boolean
  isPending:    boolean
  onVote:       () => void
  homeTeamName: string
  awayTeamName: string
}) {
  const pct      = totalVotes === 0 ? 0 : Math.round((votes / totalVotes) * 100)
  const otherVotes = totalVotes - votes
  const isWinner   = votingState === "closed" && totalVotes > 0 && votes > otherVotes

  return (
    <div className={`overflow-hidden rounded-xl border transition-all duration-300 ${
      isWinner ? "border-green-300 bg-green-50" :
      isChosen ? "border-zinc-400 bg-zinc-50"   :
                 "border-zinc-200 bg-white"
    }`}>
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

      <div className="p-4 space-y-3">
        <TeamMini label={homeTeamName} players={option.team1} />
        <TeamMini label={awayTeamName} players={option.team2} />
      </div>

      {votingState === "active" && isLoggedIn && (
        <div className="px-4 pb-4">
          <button
            onClick={onVote}
            disabled={isPending}
            className={`w-full rounded-lg py-2 text-sm font-medium transition-all duration-150 disabled:opacity-60 ${
              isChosen
                ? "bg-zinc-800 text-white hover:bg-zinc-600"
                : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            {isPending ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Zapisuję…
              </span>
            ) : isChosen ? "Wycofaj głos" : `Głosuję za ${label}`}
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
