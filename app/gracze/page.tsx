import Link from "next/link"
import { getAllSeasons } from "@/lib/standings"
import { getPlayersWithStats, type PlayerWithStats } from "@/lib/players"
import { getActiveBadges, type PlayerBadge } from "@/lib/badges"
import BadgeChip from "@/app/ui/badge-chip"

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ sezon?: string }>
}) {
  const { sezon: seasonId } = await searchParams

  const seasons = await getAllSeasons()
  const sortedSeasons = [...seasons].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  )

  const [players, badges] = await Promise.all([
    getPlayersWithStats(seasonId),
    getActiveBadges(seasonId),
  ])
  const currentSeason = seasons.find((s) => s.id === seasonId) ?? null

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Gracze</h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          {currentSeason ? currentSeason.name : "Wszystkie sezony"}
        </p>
      </div>

      {/* Season selector */}
      <div className="flex flex-wrap gap-1.5">
        <SeasonTab href="/gracze" label="Wszystkie" active={!seasonId} />
        {sortedSeasons.map((s) => (
          <SeasonTab
            key={s.id}
            href={`/gracze?sezon=${s.id}`}
            label={s.name.replace("Sezon ", "")}
            active={s.id === seasonId}
          />
        ))}
      </div>

      {players.length === 0 ? (
        <p className="text-zinc-400">Brak danych dla tego sezonu.</p>
      ) : (
        <>
          {/* 3 stat cards — all-time or season-specific */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Król strzelców"   players={players} sortKey="goals"   format={(p) => `${p.goals} ${goalLabel(p.goals)}`} />
            <StatCard label="Król asyst"        players={players} sortKey="assists" format={(p) => `${p.assists} ${assistLabel(p.assists)}`} />
            <StatCard label="Najwięcej meczów"  players={players} sortKey="played"  format={(p) => `${p.played} ${matchLabel(p.played)}`} />
          </div>

          {/* Player table */}
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  <th className="px-4 py-3 text-right w-8">#</th>
                  <th className="px-4 py-3 text-left">Gracz</th>
                  {seasonId && <th className="px-4 py-3 text-left hidden sm:table-cell">Drużyna</th>}
                  <th className="px-4 py-3 text-center w-14" title="Mecze">M</th>
                  <th className="px-4 py-3 text-center w-14" title="Gole">G</th>
                  <th className="px-4 py-3 text-center w-14" title="Asysty">A</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {players.map((p, i) => (
                  <tr key={p.id} className="transition-colors hover:bg-zinc-50">
                    <td className="px-4 py-3 text-right text-xs text-zinc-300">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Link href={`/gracze/${p.id}`} className="font-medium text-zinc-900 hover:underline">
                          {p.firstName} {p.lastName}
                        </Link>
                        {p.nickname && (
                          <span className="text-xs text-zinc-400">„{p.nickname}"</span>
                        )}
                        {(badges.get(p.id) ?? []).map((b, i) => (
                          <BadgeChip key={i} type={b.type} />
                        ))}
                      </div>
                    </td>
                    {seasonId && (
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {p.team ? (
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: p.team.color }}
                            />
                            <span className="text-zinc-600">{p.team.name}</span>
                          </div>
                        ) : (
                          <span className="text-zinc-300">—</span>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3 text-center text-zinc-600">{p.played}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={p.goals > 0 ? "font-semibold text-zinc-900" : "text-zinc-400"}>
                        {p.goals}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={p.assists > 0 ? "font-semibold text-zinc-900" : "text-zinc-400"}>
                        {p.assists}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function SeasonTab({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-zinc-900 text-white"
          : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
      }`}
    >
      {label}
    </Link>
  )
}

function StatCard({
  label,
  players,
  sortKey,
  format,
}: {
  label: string
  players: PlayerWithStats[]
  sortKey: "goals" | "assists" | "played"
  format: (p: PlayerWithStats) => string
}) {
  const leader = [...players].sort((a, b) => b[sortKey] - a[sortKey])[0]
  if (!leader || leader[sortKey] === 0) return null

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-1 font-semibold text-zinc-900 leading-tight">
        {leader.firstName} {leader.lastName}
        {leader.nickname && (
          <span className="ml-1 text-xs font-normal text-zinc-400">„{leader.nickname}"</span>
        )}
      </p>
      {leader.team && (
        <div className="mt-0.5 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: leader.team.color }} />
          <span className="text-xs text-zinc-500">{leader.team.name}</span>
        </div>
      )}
      <p className="mt-2 text-2xl font-bold text-zinc-900">{format(leader)}</p>
    </div>
  )
}

function goalLabel(n: number) {
  if (n === 1) return "gol"
  if (n >= 2 && n <= 4) return "gole"
  return "goli"
}
function assistLabel(n: number) {
  if (n === 1) return "asysta"
  if (n >= 2 && n <= 4) return "asysty"
  return "asyst"
}
function matchLabel(n: number) {
  if (n === 1) return "mecz"
  if (n >= 2 && n <= 4) return "mecze"
  return "meczów"
}
