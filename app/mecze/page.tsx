import Link from "next/link"
import { getActiveSeason, getAllSeasons } from "@/lib/standings"
import { getMatches, type MatchListItem } from "@/lib/matches"
import { getOptionalSession } from "@/lib/dal"
import { prisma } from "@/lib/prisma"
import EmptyState, { IconCalendar } from "@/app/ui/empty-state"
import AnimatedMatchList from "@/app/components/animated-match-list"

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ sezon?: string }>
}) {
  const { sezon: seasonId } = await searchParams
  const [activeSeason, allSeasons, session] = await Promise.all([
    getActiveSeason(),
    getAllSeasons(),
    getOptionalSession(),
  ])
  const isOrganizer = session?.role === "ORGANIZER"

  const season = seasonId
    ? allSeasons.find((s) => s.id === seasonId) ?? activeSeason
    : activeSeason

  if (!season) {
    return <p className="text-zinc-500">Brak sezonów w bazie.</p>
  }

  const matches = await getMatches(season.id)

  const isActiveSeason = season.id === activeSeason?.id

  const now = new Date()
  const nextMatch = [...matches]
    .filter((m) => m.status === "SCHEDULED" && new Date(m.scheduledAt) > now)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0] ?? null
  const nextMatchId = nextMatch?.id ?? null

  // Dla aktywnego sezonu pokazujemy tylko rozegrane/odwołane + następny zaplanowany
  const displayMatches = isActiveSeason
    ? [
        ...matches.filter((m) => m.status === "PLAYED" || m.status === "CANCELLED" || m.status === "POSTPONED"),
        ...(nextMatch ? [nextMatch] : []),
      ]
    : matches

  const registrationCounts = isActiveSeason
    ? await prisma.matchRegistration.groupBy({
        by: ["matchId"],
        where: {
          matchId: { in: displayMatches.map((m) => m.id) },
          status: "CONFIRMED",
        },
        _count: { matchId: true },
      })
    : []
  const countByMatchId = Object.fromEntries(
    registrationCounts.map((r) => [r.matchId, r._count.matchId])
  )

  const byRound = groupByRound(displayMatches)

  const sortedSeasons = [...allSeasons].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  )

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mecze</h1>
          <p className="text-sm text-zinc-500">{season.name}</p>
        </div>
        {isOrganizer && season.id === activeSeason?.id && (
          <Link
            href="/panel/mecze/nowy"
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 shadow-sm shadow-orange-500/30"
          >
            + Nowy mecz
          </Link>
        )}
      </div>

      {/* Season tabs */}
      <div className="flex flex-wrap gap-1.5">
        <SeasonTab
          href="/mecze"
          label={activeSeason ? activeSeason.name.replace("Sezon ", "") : "Aktualny"}
          active={!seasonId || season.id === activeSeason?.id}
          isActive
        />
        {sortedSeasons
          .filter((s) => s.id !== activeSeason?.id)
          .map((s) => (
            <SeasonTab
              key={s.id}
              href={`/mecze?sezon=${s.id}`}
              label={s.name.replace("Sezon ", "")}
              active={season.id === s.id}
            />
          ))}
      </div>

      <div>
        {byRound.length === 0 && (
          <EmptyState
            icon={<IconCalendar />}
            title="Brak meczów w tym sezonie"
            description="Organizator doda mecze przed startem rozgrywek."
          />
        )}

        {byRound.length > 0 && (
          <AnimatedMatchList
            byRound={byRound}
            countByMatchId={countByMatchId}
            nextMatchId={nextMatchId}
          />
        )}
      </div>
    </div>
  )
}

function SeasonTab({
  href,
  label,
  active,
  isActive,
}: {
  href: string
  label: string
  active: boolean
  isActive?: boolean
}) {
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
      {isActive && !active && (
        <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-green-500 align-middle" />
      )}
    </Link>
  )
}

function groupByRound(matches: MatchListItem[]) {
  const map = new Map<number | null, MatchListItem[]>()
  for (const m of matches) {
    const key = m.round
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(m)
  }
  return [...map.entries()]
    .sort(([a], [b]) => {
      if (a === null && b === null) return 0
      if (a === null) return 1
      if (b === null) return -1
      return b - a
    })
    .map(([round, matches]) => ({ round, matches }))
}



