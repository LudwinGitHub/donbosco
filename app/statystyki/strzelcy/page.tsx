import Link from "next/link"
import { getFullScorerRanking, type ScorerRankingRow } from "@/lib/stats"
import { getActiveSeason, getAllSeasons } from "@/lib/standings"

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
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                <th className="px-4 py-3 text-right w-8">#</th>
                <th className="px-4 py-3 text-left">Gracz</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">Drużyna</th>
                <th className="px-4 py-3 text-center w-14" title="Gole">G</th>
                <th className="px-4 py-3 text-center w-14" title="Asysty">A</th>
                <th className="px-4 py-3 text-center w-14 hidden sm:table-cell" title="Mecze">M</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {rows.map((r, i) => (
                <ScorerRow key={r.playerId} row={r} rank={i + 1} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Components ───────────────────────────────────────────────────────────────

function ScorerRow({ row: r, rank }: { row: ScorerRankingRow; rank: number }) {
  const isTop3 = rank <= 3

  return (
    <tr
      className={`hover:bg-zinc-50 transition-colors ${isTop3 ? "border-l-2" : ""}`}
      style={isTop3 ? { borderLeftColor: rank === 1 ? "#ca8a04" : rank === 2 ? "#71717a" : "#b45309" } : undefined}
    >
      <td className="px-4 py-3 text-right text-xs text-zinc-300">{rank}</td>
      <td className="px-4 py-3">
        <Link href={`/gracze/${r.playerId}`} className="font-medium text-zinc-900 hover:underline">
          {r.firstName} {r.lastName}
        </Link>
        {r.nickname && (
          <p className="text-xs text-zinc-400">{r.nickname}</p>
        )}
      </td>
      <td className="px-4 py-3 hidden sm:table-cell">
        {r.teamName ? (
          <div className="flex items-center gap-1.5">
            {r.teamColor && (
              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: r.teamColor }} />
            )}
            <span className="text-zinc-600">{r.teamName}</span>
          </div>
        ) : (
          <span className="text-zinc-300">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-center font-bold text-zinc-900">{r.goals}</td>
      <td className="px-4 py-3 text-center text-zinc-600">{r.assists}</td>
      <td className="px-4 py-3 text-center text-zinc-400 hidden sm:table-cell">{r.matches}</td>
    </tr>
  )
}
