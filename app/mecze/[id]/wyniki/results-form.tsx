"use client"
import { useState } from "react"
import { useActionState } from "react"
import { saveMatchResult, type MatchFormState, type GoalInput } from "@/app/actions/matches"

type Player = { id: string; firstName: string; lastName: string; nickname: string | null }
type Team = { id: string; name: string; color: string; players: Player[] }
type GoalRow = GoalInput & { key: string }

export default function ResultsForm({
  matchId,
  homeTeam,
  awayTeam,
  initialHomeScore,
  initialAwayScore,
  initialGoals,
}: {
  matchId: string
  homeTeam: Team
  awayTeam: Team
  initialHomeScore: number | null
  initialAwayScore: number | null
  initialGoals: GoalInput[]
}) {
  const [state, action, pending] = useActionState<MatchFormState, FormData>(
    saveMatchResult,
    undefined
  )
  const [goals, setGoals] = useState<GoalRow[]>(
    initialGoals.map((g, i) => ({ ...g, key: String(i) }))
  )
  const [nextKey, setNextKey] = useState(initialGoals.length)

  const addGoal = () => {
    setGoals((prev) => [
      ...prev,
      { key: String(nextKey), teamId: "", scorerId: "", assisterId: "", minute: "", isOwnGoal: false },
    ])
    setNextKey((n) => n + 1)
  }

  const updateGoal = (key: string, updates: Partial<GoalRow>) => {
    setGoals((prev) => prev.map((g) => (g.key === key ? { ...g, ...updates } : g)))
  }

  const removeGoal = (key: string) => {
    setGoals((prev) => prev.filter((g) => g.key !== key))
  }

  const goalsPayload = goals.map(({ key: _k, ...g }) => g)

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="matchId" value={matchId} />
      <input type="hidden" name="goals" value={JSON.stringify(goalsPayload)} />

      {(state?.message || state?.errors) && (
        <p className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {state.message ?? "Popraw błędy w formularzu."}
        </p>
      )}

      {/* Wynik */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Wynik</h2>
        <div className="flex items-center gap-4">
          <ScoreInput
            name="homeScore"
            label={homeTeam.name}
            color={homeTeam.color}
            defaultValue={initialHomeScore ?? ""}
            error={state?.errors?.homeScore?.[0]}
          />
          <span className="text-xl font-light text-zinc-300">:</span>
          <ScoreInput
            name="awayScore"
            label={awayTeam.name}
            color={awayTeam.color}
            defaultValue={initialAwayScore ?? ""}
            error={state?.errors?.awayScore?.[0]}
          />
        </div>
      </section>

      {/* Bramki */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Bramki</h2>

        {goals.length > 0 && (
          <div className="space-y-2">
            {goals.map((goal) => (
              <GoalRowComponent
                key={goal.key}
                goal={goal}
                homeTeam={homeTeam}
                awayTeam={awayTeam}
                onChange={updateGoal}
                onRemove={removeGoal}
              />
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={addGoal}
          className="flex items-center gap-1.5 rounded-lg border border-dashed border-zinc-300 px-4 py-2 text-sm text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-700"
        >
          <span className="text-base leading-none">+</span> Dodaj bramkę
        </button>
      </section>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
      >
        {pending ? "Zapisywanie…" : "Zapisz wyniki"}
      </button>
    </form>
  )
}

// ─── Pojedyncza bramka ────────────────────────────────────────────────────────

function GoalRowComponent({
  goal,
  homeTeam,
  awayTeam,
  onChange,
  onRemove,
}: {
  goal: GoalRow
  homeTeam: Team
  awayTeam: Team
  onChange: (key: string, updates: Partial<GoalRow>) => void
  onRemove: (key: string) => void
}) {
  const players =
    goal.teamId === homeTeam.id
      ? homeTeam.players
      : goal.teamId === awayTeam.id
        ? awayTeam.players
        : []

  const handleTeamChange = (teamId: string) => {
    onChange(goal.key, { teamId, scorerId: "", assisterId: "" })
  }

  return (
    <div className="flex flex-wrap items-start gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
      {/* Drużyna */}
      <div className="flex flex-col gap-1 min-w-[130px]">
        <label className="text-xs text-zinc-400">Drużyna</label>
        <select
          value={goal.teamId}
          onChange={(e) => handleTeamChange(e.target.value)}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-zinc-500"
        >
          <option value="">Wybierz…</option>
          <option value={homeTeam.id}>
            {homeTeam.name}
          </option>
          <option value={awayTeam.id}>
            {awayTeam.name}
          </option>
        </select>
      </div>

      {/* Strzelec */}
      <div className="flex flex-col gap-1 min-w-[150px] flex-1">
        <label className="text-xs text-zinc-400">Strzelec</label>
        <select
          value={goal.scorerId}
          onChange={(e) => onChange(goal.key, { scorerId: e.target.value })}
          disabled={!goal.teamId}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-zinc-500 disabled:opacity-40"
        >
          <option value="">Wybierz…</option>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.firstName} {p.lastName}
              {p.nickname ? ` (${p.nickname})` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Asysta */}
      <div className="flex flex-col gap-1 min-w-[150px] flex-1">
        <label className="text-xs text-zinc-400">Asysta</label>
        <select
          value={goal.assisterId}
          onChange={(e) => onChange(goal.key, { assisterId: e.target.value })}
          disabled={!goal.teamId}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-zinc-500 disabled:opacity-40"
        >
          <option value="">Brak</option>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.firstName} {p.lastName}
              {p.nickname ? ` (${p.nickname})` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Minuta */}
      <div className="flex flex-col gap-1 w-20">
        <label className="text-xs text-zinc-400">Minuta</label>
        <input
          type="number"
          value={goal.minute}
          onChange={(e) => onChange(goal.key, { minute: e.target.value })}
          placeholder="–"
          min="1"
          max="120"
          className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-zinc-500"
        />
      </div>

      {/* Samobój + Usuń */}
      <div className="flex flex-col gap-1 items-start justify-end pt-5">
        <label className="flex items-center gap-1.5 cursor-pointer text-sm text-zinc-600 select-none">
          <input
            type="checkbox"
            checked={goal.isOwnGoal}
            onChange={(e) => onChange(goal.key, { isOwnGoal: e.target.checked })}
            className="rounded"
          />
          samobój
        </label>
      </div>

      <div className="flex items-end pb-0.5 ml-auto">
        <button
          type="button"
          onClick={() => onRemove(goal.key)}
          className="rounded-md px-2 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500"
          aria-label="Usuń bramkę"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

// ─── Pole wyniku ──────────────────────────────────────────────────────────────

function ScoreInput({
  name,
  label,
  color,
  defaultValue,
  error,
}: {
  name: string
  label: string
  color: string
  defaultValue: number | string
  error?: string
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-2">
      <div className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-sm font-medium text-zinc-700">{label}</span>
      </div>
      <input
        name={name}
        type="number"
        min="0"
        defaultValue={defaultValue}
        className="w-20 rounded-lg border border-zinc-300 py-2 text-center text-2xl font-bold tabular-nums outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
