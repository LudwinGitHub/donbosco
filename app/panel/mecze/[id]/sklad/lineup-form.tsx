"use client"
import { useState, useActionState } from "react"
import { updateMatchLineup, type MatchFormState, type LineupEntryInput } from "@/app/actions/matches"

type Player = { id: string; firstName: string; lastName: string; nickname: string | null }
type Team   = { id: string; name: string; color: string }

export default function LineupForm({
  matchId,
  homeTeam,
  awayTeam,
  homePlayers,
  awayPlayers,
  initialHomeLineup,
  initialAwayLineup,
}: {
  matchId:           string
  homeTeam:          Team
  awayTeam:          Team
  homePlayers:       Player[]
  awayPlayers:       Player[]
  initialHomeLineup: Set<string>
  initialAwayLineup: Set<string>
}) {
  const [state, action, pending] = useActionState<MatchFormState, FormData>(
    updateMatchLineup,
    undefined
  )

  const [homeChecked, setHomeChecked] = useState<Set<string>>(new Set(initialHomeLineup))
  const [awayChecked, setAwayChecked] = useState<Set<string>>(new Set(initialAwayLineup))

  const toggle = (
    id: string,
    checked: Set<string>,
    setChecked: React.Dispatch<React.SetStateAction<Set<string>>>
  ) => {
    setChecked((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const buildEntries = (): LineupEntryInput[] => [
    ...[...homeChecked].map((pid) => ({ playerId: pid, teamId: homeTeam.id })),
    ...[...awayChecked].map((pid) => ({ playerId: pid, teamId: awayTeam.id })),
  ]

  const handleSubmit = (formData: FormData) => {
    formData.set("entries", JSON.stringify(buildEntries()))
    action(formData)
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <input type="hidden" name="matchId" value={matchId} />

      {state?.message && (
        <p className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {state.message}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TeamColumn
          team={homeTeam}
          players={homePlayers}
          checked={homeChecked}
          onToggle={(id) => toggle(id, homeChecked, setHomeChecked)}
        />
        <TeamColumn
          team={awayTeam}
          players={awayPlayers}
          checked={awayChecked}
          onToggle={(id) => toggle(id, awayChecked, setAwayChecked)}
        />
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-zinc-100 text-sm text-zinc-500">
        <span>{homeChecked.size + awayChecked.size} graczy w składzie</span>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
        >
          {pending ? "Zapisywanie…" : "Zapisz skład"}
        </button>
      </div>
    </form>
  )
}

function TeamColumn({
  team,
  players,
  checked,
  onToggle,
}: {
  team:     Team
  players:  Player[]
  checked:  Set<string>
  onToggle: (id: string) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 pb-1 border-b border-zinc-100">
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: team.color }} />
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{team.name}</span>
        <span className="ml-auto text-xs text-zinc-400">{checked.size}</span>
      </div>
      {players.length === 0 && (
        <p className="text-xs text-zinc-400">Brak graczy przypisanych do drużyny.</p>
      )}
      {players.map((p) => (
        <label key={p.id} className="flex items-center gap-2.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={checked.has(p.id)}
            onChange={() => onToggle(p.id)}
            className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
          />
          <span className="text-sm text-zinc-700 group-hover:text-zinc-900 select-none">
            {p.firstName} {p.lastName}
            {p.nickname && <span className="ml-1 text-xs text-zinc-400">„{p.nickname}"</span>}
          </span>
        </label>
      ))}
    </div>
  )
}
