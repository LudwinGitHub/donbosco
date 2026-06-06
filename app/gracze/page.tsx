import Link from "next/link"
import { getAllSeasons } from "@/lib/standings"
import { getPlayersWithStats, type PlayerWithStats } from "@/lib/players"
import { getActiveBadges, type PlayerBadge } from "@/lib/badges"
import BadgeChip from "@/app/ui/badge-chip"

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ sezon?: string; sort?: string }>
}) {
  const { sezon: seasonId, sort } = await searchParams

  const seasons = await getAllSeasons()
  const sortedSeasons = [...seasons].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  )

  const [players, badges] = await Promise.all([
    getPlayersWithStats(seasonId),
    getActiveBadges(seasonId),
  ])
  const currentSeason = seasons.find((s) => s.id === seasonId) ?? null

  const displayPlayers = (() => {
    if (sort === "goals")   return [...players].sort((a, b) => b.goals   - a.goals   || b.assists - a.assists || a.lastName.localeCompare(b.lastName))
    if (sort === "assists") return [...players].sort((a, b) => b.assists - a.assists || b.goals   - a.goals   || a.lastName.localeCompare(b.lastName))
    return players
  })()

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
            <StatCard
              label="Król strzelców" emoji="⚽"
              borderClass="border-t-orange-500" statColorClass="text-zinc-900"
              players={players} sortKey="goals"
              format={(p) => `${p.goals} ${goalLabel(p.goals)}`}
            />
            <StatCard
              label="Król asyst" emoji="🎯"
              borderClass="border-t-orange-500" statColorClass="text-zinc-900"
              players={players} sortKey="assists"
              format={(p) => `${p.assists} ${assistLabel(p.assists)}`}
            />
            <StatCard
              label="Najwięcej meczów" emoji="📅"
              borderClass="border-t-orange-500" statColorClass="text-zinc-900"
              players={players} sortKey="played"
              format={(p) => `${p.played} ${matchLabel(p.played)}`}
            />
          </div>

          {/* Players table */}
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  <th className="px-4 py-3 text-right w-8">#</th>
                  <th className="px-4 py-3 text-left">Gracz</th>
                  {seasonId && <th className="px-4 py-3 text-left hidden sm:table-cell">Drużyna</th>}
                  <SortHeader label="M" title="Mecze"  sortKey="played"  currentSort={sort} seasonId={seasonId} />
                  <SortHeader label="G" title="Gole"   sortKey="goals"   currentSort={sort} seasonId={seasonId} />
                  <SortHeader label="A" title="Asysty" sortKey="assists" currentSort={sort} seasonId={seasonId} />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {displayPlayers.map((p, i) => (
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
          {/* Badge legend */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">Legenda odznak</p>
            <div className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
              {BADGE_LEGEND.map(({ emoji, label, description }) => (
                <div key={label} className="flex items-start gap-2">
                  <span className="shrink-0 text-sm leading-5">{emoji}</span>
                  <p className="text-xs text-zinc-500 leading-5">
                    <span className="font-semibold text-zinc-700">{label}</span>
                    {" — "}{description}
                  </p>
                </div>
              ))}
            </div>
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
          ? "bg-orange-100 text-orange-700 border border-orange-200"
          : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
      }`}
    >
      {label}
    </Link>
  )
}

const BADGE_LEGEND = [
  { emoji: "⚽", label: "Striker",       description: "Najlepszy strzelec aktywnego sezonu" },
  { emoji: "🎯", label: "Playmaker",     description: "Najlepszy asystent aktywnego sezonu" },
  { emoji: "🔥", label: "Hero (gole)",   description: "Najwięcej goli w ostatnim meczu" },
  { emoji: "💫", label: "Hero (asysty)", description: "Najwięcej asyst w ostatnim meczu" },
  { emoji: "🎩", label: "Hat-trick",     description: "3+ gole w ostatnim meczu" },
  { emoji: "🔥", label: "On Fire",       description: "Gol lub asysta w każdym z ostatnich 3 wystąpień" },
  { emoji: "🎯", label: "Seria asyst",   description: "Asysta w każdym z ostatnich 3 wystąpień" },
  { emoji: "🦾", label: "Iron Man",      description: "Grał we wszystkich meczach sezonu (min. 5)" },
  { emoji: "🎖", label: "Weteran",       description: "Najwięcej występów all-time (min. 10)" },
  { emoji: "⭐", label: "MVP Legend",    description: "Tytuł MVP zdobyty 3 lub więcej razy" },
  { emoji: "🤝", label: "Deadly Duo",    description: "Najlepsza para strzelec+asystent sezonu (min. 2 wspólne akcje)" },
]

function StatCard({
  label,
  emoji,
  borderClass,
  statColorClass,
  players,
  sortKey,
  format,
}: {
  label: string
  emoji: string
  borderClass: string
  statColorClass: string
  players: PlayerWithStats[]
  sortKey: "goals" | "assists" | "played"
  format: (p: PlayerWithStats) => string
}) {
  const leader = [...players].sort((a, b) => b[sortKey] - a[sortKey])[0]
  if (!leader || leader[sortKey] === 0) return null

  return (
    <Link
      href={`/gracze/${leader.id}`}
      className={`block rounded-xl border border-zinc-200 border-t-2 bg-white p-4 transition-colors hover:bg-zinc-50 ${borderClass}`}
    >
      <div className="flex items-start justify-between gap-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">{label}</p>
        <span className="text-lg leading-none">{emoji}</span>
      </div>
      <p className="mt-2 truncate font-bold text-zinc-900 leading-tight">
        {leader.firstName} {leader.lastName}
      </p>
      {leader.nickname && (
        <p className="truncate text-xs text-zinc-400">„{leader.nickname}"</p>
      )}
      {leader.team ? (
        <div className="mt-1 flex items-center gap-1.5">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: leader.team.color }} />
          <span className="truncate text-xs text-zinc-500">{leader.team.name}</span>
        </div>
      ) : (
        <div className="mt-1 h-4" />
      )}
      <p className={`mt-2 text-2xl font-black ${statColorClass}`}>{format(leader)}</p>
    </Link>
  )
}

function SortHeader({
  label, title, sortKey, currentSort, seasonId,
}: {
  label: string; title: string; sortKey: string; currentSort?: string; seasonId?: string
}) {
  const isActive = currentSort === sortKey || (!currentSort && sortKey === "played")
  const params = new URLSearchParams()
  if (seasonId) params.set("sezon", seasonId)
  params.set("sort", sortKey)
  return (
    <th className="px-4 py-3 text-center w-14" title={title}>
      <Link
        href={`/gracze?${params.toString()}`}
        className={`inline-flex items-center gap-0.5 transition-colors ${
          isActive ? "text-orange-600 font-semibold" : "hover:text-zinc-600"
        }`}
      >
        {label}
        {isActive && <span className="text-[9px]">▼</span>}
      </Link>
    </th>
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
