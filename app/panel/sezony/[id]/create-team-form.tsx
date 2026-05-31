"use client"
import { useActionState, useEffect } from "react"
import { createTeam, type TeamFormState } from "@/app/actions/teams"
import { toast } from "sonner"

export default function CreateTeamForm({ seasonId }: { seasonId: string }) {
  const [state, action, pending] = useActionState<TeamFormState, FormData>(
    createTeam,
    undefined
  )

  useEffect(() => {
    if (state?.message) toast.error(state.message)
  }, [state])

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-zinc-700">Dodaj drużynę</h3>
      <form action={action} className="space-y-3">
        <input type="hidden" name="seasonId" value={seasonId} />

        {state?.message && (
          <p className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {state.message}
          </p>
        )}

        <div className="flex gap-3">
          <div className="flex-1 space-y-1">
            <label htmlFor="team-name" className="block text-xs font-medium text-zinc-600">
              Nazwa drużyny
            </label>
            <input
              id="team-name"
              name="name"
              type="text"
              placeholder="np. Drużyna A"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
            />
            {state?.errors?.name?.map((e) => (
              <p key={e} className="text-xs text-red-500">{e}</p>
            ))}
          </div>

          <div className="space-y-1">
            <label htmlFor="team-color" className="block text-xs font-medium text-zinc-600">
              Kolor
            </label>
            <input
              id="team-color"
              name="color"
              type="color"
              defaultValue="#3b82f6"
              className="h-[38px] w-14 cursor-pointer rounded-lg border border-zinc-300 px-1 py-1 outline-none focus:border-zinc-500"
            />
            {state?.errors?.color?.map((e) => (
              <p key={e} className="text-xs text-red-500">{e}</p>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
        >
          {pending ? "Dodawanie…" : "Dodaj drużynę"}
        </button>
      </form>
    </div>
  )
}
