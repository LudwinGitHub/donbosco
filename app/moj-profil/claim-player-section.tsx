"use client"
import { useState, useActionState } from "react"
import { claimPlayerProfile, type PlayerFormState } from "@/app/actions/players"

type Player = {
  id: string
  firstName: string
  lastName: string
  nickname: string | null
}

export default function ClaimPlayerSection({ players }: { players: Player[] }) {
  const [search, setSearch] = useState("")
  const [state, action, pending] = useActionState<PlayerFormState, FormData>(claimPlayerProfile, undefined)

  const filtered = players.filter((p) => {
    const q = search.toLowerCase()
    return (
      p.firstName.toLowerCase().includes(q) ||
      p.lastName.toLowerCase().includes(q) ||
      (p.nickname?.toLowerCase().includes(q) ?? false)
    )
  })

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-zinc-700">Znajdź swój profil gracza</p>
        <p className="mt-0.5 text-xs text-zinc-400">
          Wyszukaj się na liście i kliknij „To ja", aby powiązać profil z kontem.
        </p>
      </div>

      <input
        type="search"
        placeholder="Szukaj po nazwisku lub przydomku…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
      />

      {state?.message && (
        <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.message}
        </p>
      )}

      <div className="max-h-72 overflow-y-auto rounded-lg border border-zinc-200 divide-y divide-zinc-100">
        {filtered.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
            <span className="text-sm text-zinc-800">
              {p.firstName} {p.lastName}
              {p.nickname && (
                <span className="ml-1.5 text-xs text-zinc-400">„{p.nickname}"</span>
              )}
            </span>
            <form action={action}>
              <input type="hidden" name="playerId" value={p.id} />
              <button
                type="submit"
                disabled={pending}
                className="shrink-0 rounded-md bg-zinc-900 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
              >
                {pending ? "…" : "To ja"}
              </button>
            </form>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-zinc-400">
            {search ? "Brak wyników." : "Wszyscy gracze mają już powiązane konta."}
          </p>
        )}
      </div>
    </div>
  )
}
