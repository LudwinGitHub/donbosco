import { redirect } from "next/navigation"
import Link from "next/link"
import { verifySession } from "@/lib/dal"
import { getActiveSeason } from "@/lib/standings"
import { prisma } from "@/lib/prisma"
import NewMatchForm from "./new-match-form"

export default async function NewMatchPage() {
  const session = await verifySession()
  if (session.role !== "ORGANIZER") redirect("/mecze")

  const season = await getActiveSeason()
  if (!season) {
    return <p className="text-zinc-500">Brak aktywnego sezonu. Utwórz sezon przed dodaniem meczu.</p>
  }

  const teams = await prisma.team.findMany({
    where: { seasonId: season.id },
    orderBy: { name: "asc" },
  })

  const today = new Date().toISOString().split("T")[0]

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <Link href="/mecze" className="hover:text-zinc-600 transition-colors">
          Mecze
        </Link>
        <span>›</span>
        <span>Nowy mecz</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Nowy mecz</h1>
        <p className="mt-1 text-sm text-zinc-500">{season.name}</p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <NewMatchForm seasonId={season.id} teams={teams} defaultDate={today} />
      </div>
    </div>
  )
}
