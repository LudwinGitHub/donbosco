import Link from "next/link"
import { getFullScorerRanking } from "@/lib/stats"
import { getActiveSeason, getAllSeasons } from "@/lib/standings"
import ScorerTable from "./scorer-table"

export default async function StrzelcyPage({
  searchParams,
}: {
  searchParams: Promise<{ sezon?: string }>
}) {
  const { sezon } = await searchParams
  const [allSeasons, activeSeason] = await Promise.all([getAllSeasons(), getActiveSeason()])

  const selectedSeasonId = sezon ?? activeSeason?.id
  const rows = await getFullScorerRanking(selectedSeasonId)

  return (
    <div className="space-y-8">
      <div>
        <Link href="/statystyki" className="mb-3 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700">
          ← Statystyki
        </Link>
        <h1 className="text-2xl font-bold">Klasyfikacja strzelców</h1>
        <p className="mt-0.5 text-sm text-zinc-500">Gole i asysty we wszystkich sezonach</p>
      </div>

      {/* Season selector */}
      {allSeasons.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Link
            href="/statystyki/strzelcy"
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              !sezon
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900"
            }`}
          >
            Wszystkie
          </Link>
          {[...allSeasons].reverse().map((s) => (
            <Link
              key={s.id}
              href={`/statystyki/strzelcy?sezon=${s.id}`}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                sezon === s.id
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900"
              }`}
            >
              {s.name}
            </Link>
          ))}
        </div>
      )}

      {/* Scorer table */}
      {rows.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white px-4 py-10 text-center text-sm text-zinc-400">
          Brak danych
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <ScorerTable rows={rows} />
        </div>
      )}
    </div>
  )
}

