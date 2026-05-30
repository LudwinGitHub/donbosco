"use client"

import { useTransition } from "react"
import { deleteMatch } from "@/app/actions/matches"

export default function DeleteMatchButton({ matchId }: { matchId: string }) {
  const [pending, startTransition] = useTransition()

  function handleClick() {
    if (!confirm("Czy na pewno chcesz usunąć ten mecz? Operacja jest nieodwracalna.")) return
    startTransition(() => deleteMatch(matchId))
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50"
    >
      {pending ? "…" : "Usuń mecz"}
    </button>
  )
}
