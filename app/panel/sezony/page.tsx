import { redirect } from "next/navigation"
import Link from "next/link"
import { verifySession } from "@/lib/dal"
import { prisma } from "@/lib/prisma"
import { activateSeason, deactivateSeason } from "@/app/actions/seasons"

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export default async function SeasonsPage() {
  const session = await verifySession()
  if (session.role !== "ORGANIZER") redirect("/mecze")

  const seasons = await prisma.season.findMany({
    orderBy: { startDate: "desc" },
    include: {
      _count: {
        select: { teams: true, matches: true },
      },
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sezony</h1>
        </div>
        <Link
          href="/panel/sezony/nowy"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
        >
          + Nowy sezon
        </Link>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white divide-y divide-zinc-100">
        {seasons.map((season) => (
          <div key={season.id} className="flex items-center gap-4 px-4 py-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-zinc-900">{season.name}</span>
                {season.isActive && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    Aktywny
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {formatDate(season.startDate)}
                {season.endDate ? ` – ${formatDate(season.endDate)}` : ""}
                {" · "}
                {season._count.teams} drużyny · {season._count.matches} meczów
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!season.isActive ? (
                <form action={activateSeason.bind(null, season.id)}>
                  <button
                    type="submit"
                    className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
                  >
                    Aktywuj
                  </button>
                </form>
              ) : (
                <form action={deactivateSeason.bind(null, season.id)}>
                  <button
                    type="submit"
                    className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
                  >
                    Dezaktywuj
                  </button>
                </form>
              )}
              <Link
                href={`/panel/sezony/${season.id}`}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
              >
                Zarządzaj →
              </Link>
            </div>
          </div>
        ))}
        {seasons.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-zinc-400">Brak sezonów.</p>
        )}
      </div>
    </div>
  )
}
