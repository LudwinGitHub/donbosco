"use client"
import { useState, useMemo, useEffect, useTransition } from "react"
import {
  generateBalancedTeams,
  playerRating,
  type PlayerForBalance,
  type BalancedTeams,
} from "@/lib/team-balancer"
import { saveMatchDraw } from "@/app/actions/draws"

const MAX_PLAYERS = 14

type MatchOption = {
  id: string
  round: number | null
  scheduledAt: string
  homeTeamName: string
  awayTeamName: string
}

export default function TeamPicker({
  players,
  matches,
}: {
  players: PlayerForBalance[]
  matches: MatchOption[]
}) {
  const [search,   setSearch]   = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [drawA,    setDrawA]    = useState<BalancedTeams | null>(null)
  const [drawB,    setDrawB]    = useState<BalancedTeams | null>(null)
  const [matchId,  setMatchId]  = useState(matches[0]?.id ?? "")

  const selectedMatch = matches.find((m) => m.id === matchId) ?? null
  const [saved,    setSaved]    = useState(false)
  const [isPending, startTransition] = useTransition()

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return players.filter(
      (p) =>
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q) ||
        (p.nickname?.toLowerCase().includes(q) ?? false)
    )
  }, [players, search])

  useEffect(() => {
    setSaved(false)
    if (selected.size >= 2) {
      const active = players.filter((p) => selected.has(p.id))
      setDrawA(generateBalancedTeams(active))
      setDrawB(generateBalancedTeams(active))
    } else {
      setDrawA(null)
      setDrawB(null)
    }
  }, [selected, players])

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else if (next.size < MAX_PLAYERS) {
        next.add(id)
      }
      return next
    })
  }

  const selectAll = () => {
    setSelected((prev) => {
      const toAdd = filtered
        .filter((p) => !prev.has(p.id))
        .slice(0, MAX_PLAYERS - prev.size)
      if (toAdd.length === 0) return prev
      const next = new Set(prev)
      toAdd.forEach((p) => next.add(p.id))
      return next
    })
  }

  const clearAll = () => setSelected(new Set())

  const reroll = (option: "A" | "B") => {
    if (selected.size < 2) return
    const active = players.filter((p) => selected.has(p.id))
    if (option === "A") setDrawA(generateBalancedTeams(active))
    else               setDrawB(generateBalancedTeams(active))
    setSaved(false)
  }

  const handleSave = () => {
    if (!drawA || !drawB || !matchId) return
    startTransition(async () => {
      await saveMatchDraw(matchId, drawA, drawB)
      setSaved(true)
    })
  }

  const atLimit  = selected.size >= MAX_PLAYERS
  const hasDraws = !!drawA && !!drawB

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* ── Col 1: player selector ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <input
              type="search"
              placeholder="Szukaj gracza…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
            />
            <span className={`shrink-0 text-sm font-medium tabular-nums ${atLimit ? "text-amber-600" : "text-zinc-500"}`}>
              {selected.size} / {MAX_PLAYERS}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button onClick={selectAll} className="text-zinc-500 hover:text-zinc-800 underline underline-offset-2">
              Zaznacz widocznych
            </button>
            <span className="text-zinc-200">|</span>
            <button onClick={clearAll} className="text-zinc-500 hover:text-zinc-800 underline underline-offset-2">
              Wyczyść
            </button>
            {atLimit && (
              <span className="ml-1 font-medium text-amber-600">Limit osiągnięty</span>
            )}
          </div>

          <div className="max-h-[540px] overflow-y-auto rounded-xl border border-zinc-200 bg-white divide-y divide-zinc-100">
            {filtered.map((p) => {
              const isSelected = selected.has(p.id)
              const disabled   = atLimit && !isSelected
              return (
                <label
                  key={p.id}
                  className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                    disabled ? "opacity-40" : "cursor-pointer hover:bg-zinc-50"
                  } ${isSelected ? "bg-zinc-50" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggle(p.id)}
                    disabled={disabled}
                    className="h-4 w-4 rounded border-zinc-300 accent-zinc-900"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-zinc-900 truncate">
                      {p.firstName} {p.lastName}
                    </span>
                    {p.nickname && (
                      <span className="ml-1.5 text-xs text-zinc-400">„{p.nickname}"</span>
                    )}
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5">
                    <RatingDot rating={playerRating(p)} />
                    <span className="text-xs text-zinc-400 tabular-nums">
                      {p.goals}G {p.assists}A
                    </span>
                  </div>
                </label>
              )
            })}
            {filtered.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-zinc-400">Brak wyników.</p>
            )}
          </div>
        </div>

        {/* ── Col 2: Option A ── */}
        <DrawColumn
          label="Opcja A"
          color="#3b82f6"
          draw={drawA}
          canReroll={selected.size >= 2}
          onReroll={() => reroll("A")}
          team1Name={selectedMatch?.homeTeamName}
          team2Name={selectedMatch?.awayTeamName}
        />

        {/* ── Col 3: Option B ── */}
        <DrawColumn
          label="Opcja B"
          color="#f59e0b"
          draw={drawB}
          canReroll={selected.size >= 2}
          onReroll={() => reroll("B")}
          team1Name={selectedMatch?.homeTeamName}
          team2Name={selectedMatch?.awayTeamName}
        />
      </div>

      {/* ── Match selector + save ── */}
      {hasDraws && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4">
          {matches.length === 0 ? (
            <p className="flex-1 text-sm text-zinc-400">Brak nadchodzących meczów.</p>
          ) : (
            <select
              value={matchId}
              onChange={(e) => { setMatchId(e.target.value); setSaved(false) }}
              className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-800 outline-none focus:border-zinc-500"
            >
              {matches.map((m) => {
                const d = new Date(m.scheduledAt)
                const dd = String(d.getDate()).padStart(2, "0")
                const mm = String(d.getMonth() + 1).padStart(2, "0")
                const hh = String(d.getHours()).padStart(2, "0")
                const mi = String(d.getMinutes()).padStart(2, "0")
                const label = m.round
                  ? `Kolejka ${m.round} — ${dd}.${mm}, ${hh}:${mi}`
                  : `${dd}.${mm}, ${hh}:${mi}`
                return (
                  <option key={m.id} value={m.id}>{label}</option>
                )
              })}
            </select>
          )}
          <button
            onClick={handleSave}
            disabled={isPending || saved || !matchId}
            className="shrink-0 rounded-xl bg-zinc-900 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saved ? "Opublikowano ✓" : isPending ? "Zapisuję…" : "Opublikuj głosowanie"}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function DrawColumn({
  label,
  color,
  draw,
  canReroll,
  onReroll,
  team1Name,
  team2Name,
}: {
  label: string
  color: string
  draw: BalancedTeams | null
  canReroll: boolean
  onReroll: () => void
  team1Name?: string
  team2Name?: string
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold text-zinc-800">
          <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
          {label}
        </span>
        <button
          onClick={onReroll}
          disabled={!canReroll}
          className="text-xs text-zinc-500 hover:text-zinc-800 underline underline-offset-2 disabled:opacity-30"
        >
          Losuj ponownie
        </button>
      </div>

      {!draw ? (
        <div className="flex items-center justify-center rounded-xl border border-dashed border-zinc-200 py-16 text-sm text-zinc-400">
          Zaznacz co najmniej 2 graczy
        </div>
      ) : (
        <div className="space-y-2">
          <BalanceBar ratingA={draw.ratingA} ratingB={draw.ratingB} />
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <TeamList label={team1Name ?? "Drużyna 1"} players={draw.teamA} />
            <div className="border-t border-zinc-100" />
            <TeamList label={team2Name ?? "Drużyna 2"} players={draw.teamB} />
          </div>
        </div>
      )}
    </div>
  )
}

function TeamList({ label, players }: { label: string; players: PlayerForBalance[] }) {
  return (
    <div>
      <div className="px-3 py-2 bg-zinc-50 border-b border-zinc-100">
        <span className="text-xs font-semibold text-zinc-500">{label}</span>
      </div>
      <ul className="divide-y divide-zinc-100">
        {[...players]
          .sort((a, b) => playerRating(b) - playerRating(a))
          .map((p) => (
            <li key={p.id} className="flex items-center gap-2 px-3 py-1.5">
              <RatingDot rating={playerRating(p)} />
              <span className="flex-1 text-sm text-zinc-800 truncate">
                {p.firstName} {p.lastName}
              </span>
            </li>
          ))}
      </ul>
    </div>
  )
}

function RatingDot({ rating }: { rating: number }) {
  const color =
    rating === 0 ? "bg-zinc-200" :
    rating < 0.8 ? "bg-amber-400" :
                   "bg-green-500"
  return <span className={`h-2 w-2 rounded-full shrink-0 ${color}`} />
}

function BalanceBar({ ratingA, ratingB }: { ratingA: number; ratingB: number }) {
  const total = ratingA + ratingB
  const pctA  = total === 0 ? 50 : Math.round((ratingA / total) * 100)
  const diff  = Math.abs(ratingA - ratingB)
  const label = diff < 0.5 ? "Świetna równowaga" : diff < 1.5 ? "Dobra równowaga" : "Nierówne składy"

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-zinc-400">
        <span>{ratingA.toFixed(1)}</span>
        <span className="text-zinc-500">{label}</span>
        <span>{ratingB.toFixed(1)}</span>
      </div>
      <div className="flex h-1.5 overflow-hidden rounded-full bg-zinc-200">
        <div
          className="h-full rounded-full bg-zinc-500 transition-all duration-500"
          style={{ width: `${pctA}%` }}
        />
      </div>
    </div>
  )
}
