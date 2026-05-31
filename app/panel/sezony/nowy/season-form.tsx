"use client"
import { useActionState, useEffect } from "react"
import { createSeason, type SeasonFormState } from "@/app/actions/seasons"
import { toast } from "sonner"

export default function SeasonForm() {
  const [state, action, pending] = useActionState<SeasonFormState, FormData>(
    createSeason,
    undefined
  )

  useEffect(() => {
    if (state?.message) toast.error(state.message)
  }, [state])

  return (
    <form action={action} className="space-y-5">
      {state?.message && (
        <p className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {state.message}
        </p>
      )}

      <div className="space-y-1">
        <label htmlFor="name" className="block text-sm font-medium text-zinc-700">
          Nazwa sezonu
        </label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder="np. Sezon 2025/2026"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
        />
        {state?.errors?.name?.map((e) => (
          <p key={e} className="text-xs text-red-500">{e}</p>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="startDate" className="block text-sm font-medium text-zinc-700">
            Data rozpoczęcia
          </label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
          />
          {state?.errors?.startDate?.map((e) => (
            <p key={e} className="text-xs text-red-500">{e}</p>
          ))}
        </div>

        <div className="space-y-1">
          <label htmlFor="endDate" className="block text-sm font-medium text-zinc-700">
            Data zakończenia <span className="text-zinc-400">(opcjonalnie)</span>
          </label>
          <input
            id="endDate"
            name="endDate"
            type="date"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
          />
          {state?.errors?.endDate?.map((e) => (
            <p key={e} className="text-xs text-red-500">{e}</p>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
      >
        {pending ? "Tworzenie…" : "Utwórz sezon"}
      </button>
    </form>
  )
}
