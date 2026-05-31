import { redirect } from "next/navigation"
import Link from "next/link"
import { verifySession } from "@/lib/dal"
import { prisma } from "@/lib/prisma"
import EditMatchForm from "./edit-match-form"

export default async function EditMatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await verifySession()
  if (session.role !== "ORGANIZER") redirect("/mecze")

  const match = await prisma.match.findUnique({
    where: { id },
    include: { homeTeam: true, awayTeam: true },
  })
  if (!match) redirect("/mecze")
  if (match.status === "PLAYED")
    redirect(`/mecze/${id}?toast=${encodeURIComponent("Nie można edytować rozegraneg meczu")}`)

  const scheduledDate = match.scheduledAt.toISOString().slice(0, 10)
  const scheduledTime = match.scheduledAt.toTimeString().slice(0, 5)

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <Link href="/mecze" className="hover:text-zinc-600 transition-colors">
          Mecze
        </Link>
        <span>›</span>
        <Link href={`/mecze/${id}`} className="hover:text-zinc-600 transition-colors">
          {match.homeTeam.name} vs {match.awayTeam.name}
        </Link>
        <span>›</span>
        <span>Edytuj</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Edytuj mecz</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {match.homeTeam.name} vs {match.awayTeam.name}
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <EditMatchForm
          matchId={id}
          defaultDate={scheduledDate}
          defaultTime={scheduledTime}
          defaultVenue={match.venue ?? ""}
          defaultRound={match.round?.toString() ?? ""}
          defaultPlayerLimit={match.playerLimit}
          defaultStatus={match.status as "SCHEDULED" | "CANCELLED" | "POSTPONED"}
        />
      </div>
    </div>
  )
}
