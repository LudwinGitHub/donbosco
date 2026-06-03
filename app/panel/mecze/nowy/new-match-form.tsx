"use client"
import { useActionState, useEffect } from "react"
import { createMatch, type MatchFormState } from "@/app/actions/matches"
import { toast } from "sonner"

type Team = { id: string; name: string; color: string }

export default function NewMatchForm({
  seasonId,
  teams,
  defaultDate,
}: {
  seasonId: string
  teams: Team[]
  defaultDate: string
}) {
  const [state, action, pending] = useActionState<MatchFormState, FormData>(
    createMatch,
    undefined
  )

  useEffect(() => {
    if (state?.message) toast.error(state.message)
  }, [state])

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="seasonId" value={seasonId} />

      {state?.message && (
        <p className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {state.message}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="homeTeamId" className="block text-sm font-medium text-zinc-700">
            Gospodarz
          </label>
          <select
            id="homeTeamId"
            name="homeTeamId"
            defaultValue=""
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
          >
            <option value="" disabled>Wybierz…</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          {state?.errors?.homeTeamId?.map((e) => (
            <p key={e} className="text-xs text-red-500">{e}</p>
          ))}
        </div>

        <div className="space-y-1">
          <label htmlFor="awayTeamId" className="block text-sm font-medium text-zinc-700">
            Gość
          </label>
          <select
            id="awayTeamId"
            name="awayTeamId"
            defaultValue=""
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
          >
            <option value="" disabled>Wybierz…</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          {state?.errors?.awayTeamId?.map((e) => (
            <p key={e} className="text-xs text-red-500">{e}</p>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="date" className="block text-sm font-medium text-zinc-700">
            Data
          </label>
          <input
            id="date"
            name="date"
            type="date"
            defaultValue={defaultDate}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
          />
          {state?.errors?.date?.map((e) => (
            <p key={e} className="text-xs text-red-500">{e}</p>
          ))}
        </div>

        <div className="space-y-1">
          <label htmlFor="time" className="block text-sm font-medium text-zinc-700">
            Godzina
          </label>
          <input
            id="time"
            name="time"
            type="time"
            defaultValue="16:00"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="venue" className="block text-sm font-medium text-zinc-700">
          Boisko
        </label>
        <input
          id="venue"
          name="venue"
          type="text"
          defaultValue="boisko Don Bosco"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="playerLimit" className="block text-sm font-medium text-zinc-700">
          Limit graczy
        </label>
        <input
          id="playerLimit"
          name="playerLimit"
          type="number"
          min="2"
          max="40"
          defaultValue={14}
          className="w-32 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
        />
        <p className="text-xs text-zinc-400">Domyślnie 14 (7 vs 7)</p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
      >
        {pending ? "Tworzenie…" : "Utwórz mecz"}
      </button>
    </form>
  )
}
