"use client"
import { useActionState, useEffect } from "react"
import { editMatch, type MatchFormState } from "@/app/actions/matches"
import { toast } from "sonner"

type Props = {
  matchId: string
  defaultDate: string
  defaultTime: string
  defaultVenue: string
  defaultRound: string
  defaultPlayerLimit: number
  defaultStatus: "SCHEDULED" | "CANCELLED" | "POSTPONED"
}

export default function EditMatchForm({
  matchId,
  defaultDate,
  defaultTime,
  defaultVenue,
  defaultRound,
  defaultPlayerLimit,
  defaultStatus,
}: Props) {
  const [state, action, pending] = useActionState<MatchFormState, FormData>(
    editMatch,
    undefined
  )

  useEffect(() => {
    if (state?.message) toast.error(state.message)
  }, [state])

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="matchId" value={matchId} />

      {state?.message && (
        <p className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {state.message}
        </p>
      )}

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
            defaultValue={defaultTime}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="venue" className="block text-sm font-medium text-zinc-700">
            Boisko <span className="text-zinc-400">(opcjonalnie)</span>
          </label>
          <input
            id="venue"
            name="venue"
            type="text"
            defaultValue={defaultVenue}
            placeholder="np. Boisko przy Don Bosco"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="round" className="block text-sm font-medium text-zinc-700">
            Kolejka <span className="text-zinc-400">(opcjonalnie)</span>
          </label>
          <input
            id="round"
            name="round"
            type="number"
            min="1"
            defaultValue={defaultRound}
            placeholder="nr kolejki"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
          />
        </div>
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
          defaultValue={defaultPlayerLimit}
          className="w-32 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
        />
        <p className="text-xs text-zinc-400">Domyślnie 14 (7 vs 7)</p>
      </div>

      <div className="space-y-1">
        <label htmlFor="status" className="block text-sm font-medium text-zinc-700">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={defaultStatus}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
        >
          <option value="SCHEDULED">Zaplanowany</option>
          <option value="CANCELLED">Odwołany</option>
          <option value="POSTPONED">Przełożony</option>
        </select>
        {state?.errors?.status?.map((e) => (
          <p key={e} className="text-xs text-red-500">{e}</p>
        ))}
        <p className="rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-700">
          Zmiana statusu na &apos;Odwołany&apos; lub &apos;Przełożony&apos; wyśle powiadomienie do wszystkich graczy.
        </p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
      >
        {pending ? "Zapisywanie…" : "Zapisz zmiany"}
      </button>
    </form>
  )
}
