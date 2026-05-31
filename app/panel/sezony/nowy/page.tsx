import { redirect } from "next/navigation"
import Link from "next/link"
import { verifySession } from "@/lib/dal"
import SeasonForm from "./season-form"

export default async function NewSeasonPage() {
  const session = await verifySession()
  if (session.role !== "ORGANIZER") redirect("/mecze")

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <Link href="/panel/sezony" className="hover:text-zinc-600 transition-colors">
          Sezony
        </Link>
        <span>›</span>
        <span>Nowy sezon</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Nowy sezon</h1>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <SeasonForm />
      </div>
    </div>
  )
}
