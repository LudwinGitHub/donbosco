"use client"
import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { populateMatchFromGroupSlots } from "@/app/actions/registrations"

export default function PopulateButton({ matchId }: { matchId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handle() {
    startTransition(async () => {
      const res = await populateMatchFromGroupSlots(matchId)
      if (res.message) {
        toast.error(res.message)
      } else {
        toast.success("Lista uzupełniona z listy bazowej.")
        router.refresh()
      }
    })
  }

  return (
    <button
      onClick={handle}
      disabled={isPending}
      className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-100 transition-colors disabled:opacity-50"
    >
      {isPending ? "Ładowanie…" : "Wczytaj z listy bazowej"}
    </button>
  )
}
