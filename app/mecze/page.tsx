import Link from "next/link"
import { getActiveSeason, getAllSeasons } from "@/lib/standings"
import { getMatches, type MatchListItem } from "@/lib/matches"
import { getOptionalSession } from "@/lib/dal"
import { prisma } from "@/lib/prisma"

const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: "Zaplanowany",
  PLAYED: "Rozegrany",
  CANCELLED: "Odwołany",
  POSTPONED: "Przełożony",
}

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

  const now = new Date()
  const nextMatchId = [...matches]
    .filter((m) => m.status === "SCHEDULED" && new Date(m.scheduledAt) > now)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0]?.id ?? null

  const registrationCounts = season.id === activeSeason?.id
    ? await prisma.matchRegistration.groupBy({
        by: ["matchId"],
        where: {
          matchId: { in: matches.map((m) => m.id) },
          status: "CONFIRMED",
        },
        _count: { matchId: true },
      })
    : []
  const countByMatchId = Object.fromEntries(
    registrationCounts.map((r) => [r.matchId, r._count.matchId])
  )

  const byRound = groupByRound(matches)

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
            className="rounded-lg bg-orange-100 border border-orange-200 px-4 py-2 text-sm font-medium text-orange-700 transition-colors hover:bg-orange-200"
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

      <>
        {byRound.length === 0 && (
          <p className="text-zinc-400">Brak zaplanowanych meczów.</p>
        )}

        {byRound.map(({ round, matches: roundMatches }) => (
          <section key={round ?? "no-round"} className="space-y-2">
            {round !== null && (
              <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Kolejka {round}
              </h2>
            )}
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white divide-y divide-zinc-100">
              {roundMatches.map((m) => (
                <MatchRow key={m.id} match={m} confirmedCount={countByMatchId[m.id] ?? 0} isNext={m.id === nextMatchId} />
              ))}
            </div>
          </section>
        ))}
      </>
    </div>
  )
}

function MatchRow({ match: m, confirmedCount, isNext }: { match: MatchListItem; confirmedCount: number; isNext: boolean }) {
  const played    = m.status === "PLAYED"
  const cancelled = m.status === "CANCELLED" || m.status === "POSTPONED"
  const isFull    = confirmedCount >= m.playerLimit

  const scoreOrTime = played ? (
    <span className="font-bold tabular-nums text-zinc-900 text-base sm:text-lg">
      {m.homeScore}:{m.awayScore}
    </span>
  ) : cancelled ? (
    <span className="text-xs font-medium text-zinc-400">{STATUS_LABEL[m.status]}</span>
  ) : (
    <span className="text-sm font-medium text-zinc-400">{formatTime(m.scheduledAt)}</span>
  )

  return (
    <Link
      href={`/mecze/${m.id}`}
      className={`relative block transition-colors group ${
        isNext ? "bg-orange-50 hover:bg-orange-100" : "hover:bg-zinc-50"
      }`}
    >
      {isNext && <span className="absolute inset-y-0 left-0 w-1 bg-orange-500" />}
      {/* Mobile layout */}
      <div className="flex sm:hidden items-center gap-3 px-4 py-3">
        <div className="shrink-0 w-14 text-center">{scoreOrTime}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-zinc-800 truncate">
              <span className="inline-block h-2 w-2 rounded-full mr-1 align-middle shrink-0" style={{ backgroundColor: m.homeTeam.color }} />
              {m.homeTeam.name}
              <span className="text-zinc-300 mx-1.5">vs</span>
              <span className="inline-block h-2 w-2 rounded-full mr-1 align-middle shrink-0" style={{ backgroundColor: m.awayTeam.color }} />
              {m.awayTeam.name}
            </p>
            {isNext && (
              <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded-full shrink-0">
                Następny
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-zinc-400">
            {formatDate(m.scheduledAt)}
            {!played && !cancelled && ` · ${confirmedCount}/${m.playerLimit}`}
          </p>
        </div>
        <span className="text-zinc-300 text-sm shrink-0">›</span>
      </div>

      {/* Desktop layout */}
      <div className="hidden sm:flex items-center gap-4 px-4 py-3">
        <div className="w-28 shrink-0 text-xs text-zinc-400">{formatDate(m.scheduledAt)}</div>
        <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
          <TeamName name={m.homeTeam.name} color={m.homeTeam.color} align="right" />
          <div className="shrink-0 w-20 text-center">{scoreOrTime}</div>
          <TeamName name={m.awayTeam.name} color={m.awayTeam.color} align="left" />
        </div>
        {isNext && (
          <span className="shrink-0 text-[10px] font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded-full">
            Następny
          </span>
        )}
        {!played && !cancelled && (
          <div className="shrink-0 text-right">
            <span className={`text-xs font-medium tabular-nums ${isFull ? "text-red-500" : "text-zinc-400"}`}>
              {confirmedCount}/{m.playerLimit}
            </span>
          </div>
        )}
        <div className="w-4 shrink-0 text-zinc-300 group-hover:text-zinc-400 text-sm">›</div>
      </div>

    </Link>
  )
}

function TeamName({
  name,
  color,
  align,
}: {
  name: string
  color: string
  align: "left" | "right"
}) {
  return (
    <div
      className={`flex items-center gap-2 flex-1 min-w-0 ${align === "right" ? "flex-row-reverse" : ""}`}
    >
      <span
        className="h-2.5 w-2.5 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className="truncate text-sm font-medium text-zinc-800">{name}</span>
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
          ? "bg-orange-100 text-orange-700 border border-orange-200"
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

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

