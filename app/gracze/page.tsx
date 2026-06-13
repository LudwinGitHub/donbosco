import React from "react"
import Link from "next/link"
import { getAllSeasons } from "@/lib/standings"
import { getPlayersWithStats, getPlayerForms, type PlayerWithStats, type PlayerForm } from "@/lib/players"
import { getActiveBadges, type PlayerBadge } from "@/lib/badges"
import EmptyState, { IconUsers } from "@/app/ui/empty-state"
import BadgeChip from "@/app/ui/badge-chip"
import PlayersTable from "./players-table"

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

  const [players, badges, forms] = await Promise.all([
    getPlayersWithStats(seasonId),
    getActiveBadges(seasonId),
    getPlayerForms(),
  ])
  const currentSeason = seasons.find((s) => s.id === seasonId) ?? null

  // Convert Maps to plain objects for client component serialization
  const badgesObj = Object.fromEntries(badges) as Record<string, Array<{ type: import("@/lib/badges").BadgeType }>>
  const formsObj  = Object.fromEntries(forms)  as Record<string, import("@/lib/players").PlayerForm>

  const initialSort = (sort === "goals" || sort === "assists") ? sort : "played"

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
        <EmptyState
          icon={<IconUsers />}
          title="Brak danych dla tego sezonu"
          description="Gracze pojawią się po rozegraniu pierwszych meczów."
        />
      ) : (
        <>
          {/* 3 stat cards — all-time or season-specific */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 stagger">
            <StatCard
              label="Król strzelców" icon={<IconBall />}
              borderClass="border-t-orange-500" statColorClass="text-zinc-900"
              players={players} sortKey="goals"
              format={(p) => `${p.goals} ${goalLabel(p.goals)}`}
            />
            <StatCard
              label="Król asyst" icon={<IconTarget />}
              borderClass="border-t-orange-500" statColorClass="text-zinc-900"
              players={players} sortKey="assists"
              format={(p) => `${p.assists} ${assistLabel(p.assists)}`}
            />
            <StatCard
              label="Najwięcej meczów" icon={<IconCalendar />}
              borderClass="border-t-orange-500" statColorClass="text-zinc-900"
              players={players} sortKey="played"
              format={(p) => `${p.played} ${matchLabel(p.played)}`}
            />
          </div>

          {/* Players table — client component handles sort */}
          <PlayersTable
            players={players}
            badges={badgesObj}
            forms={formsObj}
            seasonId={seasonId}
            initialSort={initialSort}
          />
          {/* Badge legend */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">Legenda odznak</p>
            <div className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
              {BADGE_LEGEND.map(({ type, label, description }) => (
                <div key={label} className="flex items-start gap-2">
                  <span className="shrink-0 mt-0.5"><BadgeChip type={type} /></span>
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
          ? "bg-orange-500 text-white border border-orange-600 shadow-sm shadow-orange-500/30"
          : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
      }`}
    >
      {label}
    </Link>
  )
}

const BADGE_LEGEND = [
  { type: "striker"       as const, label: "Striker",       description: "Najlepszy strzelec aktywnego sezonu" },
  { type: "playmaker"     as const, label: "Playmaker",     description: "Najlepszy asystent aktywnego sezonu" },
  { type: "hero-goal"     as const, label: "Hero (gole)",   description: "Najwięcej goli w ostatnim meczu" },
  { type: "hero-assist"   as const, label: "Hero (asysty)", description: "Najwięcej asyst w ostatnim meczu" },
  { type: "hat-trick"     as const, label: "Hat-trick",     description: "3+ gole w ostatnim meczu" },
  { type: "on-fire"       as const, label: "On Fire",       description: "Gol lub asysta w każdym z ostatnich 3 wystąpień" },
  { type: "assist-streak" as const, label: "Seria asyst",   description: "Asysta w każdym z ostatnich 3 wystąpień" },
  { type: "iron-man"      as const, label: "Iron Man",      description: "Grał we wszystkich meczach sezonu (min. 5)" },
  { type: "veteran"       as const, label: "Weteran",       description: "Najwięcej występów all-time (min. 10)" },
  { type: "mvp-legend"    as const, label: "MVP Legend",    description: "Tytuł MVP zdobyty 3 lub więcej razy" },
  { type: "deadly-duo"    as const, label: "Deadly Duo",    description: "Najlepsza para strzelec+asystent sezonu (min. 2 wspólne akcje)" },
]

function StatCard({
  label,
  icon,
  borderClass,
  statColorClass,
  players,
  sortKey,
  format,
}: {
  label: string
  icon: React.ReactNode
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
        <span className="text-orange-500">{icon}</span>
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

function IconBall() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polygon points="12,6 15.5,9.5 14,14 10,14 8.5,9.5" fill="currentColor" stroke="none" />
      <line x1="12" y1="6" x2="12" y2="2" />
      <line x1="15.5" y1="9.5" x2="19" y2="8" />
      <line x1="14" y1="14" x2="17" y2="17" />
      <line x1="10" y1="14" x2="7" y2="17" />
      <line x1="8.5" y1="9.5" x2="5" y2="8" />
    </svg>
  )
}

function IconTarget() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
    </svg>
  )
}

function IconCalendar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}
