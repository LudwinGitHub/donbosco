import React from "react"
import Link from "next/link"
import { getActiveSeason, getAllSeasons, getStandings, type StandingRow } from "@/lib/standings"
import { getPlayersWithStats } from "@/lib/players"
import { getOptionalSession } from "@/lib/dal"
import { prisma } from "@/lib/prisma"
import CountUp from "@/app/ui/count-up"
import StandingsTable from "@/app/components/standings-table"

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ sezon?: string; sort?: string }>
}) {
  const { sezon: seasonId, sort } = await searchParams
  const [activeSeason, allSeasons, session, latestAnnouncements] = await Promise.all([
    getActiveSeason(),
    getAllSeasons(),
    getOptionalSession(),
    prisma.announcement.findMany({
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      take: 3,
      select: { id: true, title: true, priority: true, isPinned: true },
    }),
  ])

  const now = new Date()

  const [lastMatch, nextMatch, activeRows, activePlayers] = activeSeason
    ? await Promise.all([
        prisma.match.findFirst({
          where:   { seasonId: activeSeason.id, status: "PLAYED" },
          orderBy: { scheduledAt: "desc" },
          include: { homeTeam: true, awayTeam: true, mvpPlayer: { select: { id: true, firstName: true, lastName: true } } },
        }),
        prisma.match.findFirst({
          where:   { seasonId: activeSeason.id, status: "SCHEDULED", scheduledAt: { gt: now } },
          orderBy: { scheduledAt: "asc" },
          include: { homeTeam: true, awayTeam: true },
        }),
        getStandings(activeSeason.id),
        getPlayersWithStats(activeSeason.id),
      ])
    : ([null, null, [], []] as const)

  const myNextReg = nextMatch && session?.userId
    ? await prisma.matchRegistration.findFirst({
        where: { matchId: nextMatch.id, userId: session.userId },
        select: { id: true, status: true },
      })
    : null
  const showRegPrompt = nextMatch && session?.userId && (!myNextReg || myNextReg.status === "PENDING")

  const season = seasonId
    ? allSeasons.find((s) => s.id === seasonId) ?? activeSeason
    : activeSeason

  const baseRows =
    season && activeSeason && season.id !== activeSeason.id
      ? await getStandings(season.id)
      : activeRows

  const rows = (() => {
    if (sort === "w")  return [...baseRows].sort((a, b) => b.won - a.won || b.points - a.points || b.goalDiff - a.goalDiff)
    if (sort === "rb") return [...baseRows].sort((a, b) => b.goalDiff - a.goalDiff || b.points - a.points)
    if (sort === "br") return [...baseRows].sort((a, b) => b.goalsFor - a.goalsFor || b.points - a.points)
    return baseRows as StandingRow[]
  })()

  const sortedSeasons = [...allSeasons].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  )

  const tableLeader = activeRows[0] ?? null
  const topScorer =
    activePlayers.length > 0
      ? [...activePlayers].sort((a, b) => b.goals - a.goals || a.lastName.localeCompare(b.lastName))[0]
      : null

  return (
    <div className="space-y-6">

      {/* ── Dashboard ── */}
      {activeSeason && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 stagger">
          {/* Last match */}
          <div className="flex flex-col rounded-xl border border-zinc-200 bg-white p-4 col-span-2 sm:col-span-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Ostatni mecz{lastMatch?.round != null ? ` · k${lastMatch.round}` : ""}
            </p>
            {lastMatch ? (
              <Link href={`/mecze/${lastMatch.id}`} className="mt-3 flex flex-1 flex-col group">
                <div className="flex items-center gap-2">
                  <div className="flex flex-1 items-center gap-1.5 min-w-0">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: lastMatch.homeTeam.color }} />
                    <span className="text-sm font-medium text-zinc-800 truncate">{lastMatch.homeTeam.name}</span>
                  </div>
                  <span className="text-xl font-bold tabular-nums text-zinc-900 shrink-0 px-1">
                    {lastMatch.homeScore}:{lastMatch.awayScore}
                  </span>
                  <div className="flex flex-1 items-center gap-1.5 justify-end min-w-0">
                    <span className="text-sm font-medium text-zinc-800 truncate text-right">{lastMatch.awayTeam.name}</span>
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: lastMatch.awayTeam.color }} />
                  </div>
                </div>
                {lastMatch.mvpPlayer && (
                  <p className="mt-1.5 text-xs text-zinc-500">
                    ⭐ MVP: <span className="font-medium text-zinc-700">{lastMatch.mvpPlayer.firstName} {lastMatch.mvpPlayer.lastName}</span>
                  </p>
                )}
                <p className="mt-auto pt-2 text-xs text-zinc-400 group-hover:text-zinc-600 transition-colors">
                  {fmtDate(lastMatch.scheduledAt)} →
                </p>
              </Link>
            ) : (
              <p className="mt-3 text-sm text-zinc-400">Brak rozegranych meczów.</p>
            )}
          </div>

          {/* Next match */}
          <div className="flex flex-col rounded-xl border border-zinc-200 bg-white p-4 col-span-2 sm:col-span-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Następny mecz{nextMatch?.round != null ? ` · k${nextMatch.round}` : ""}
            </p>
            {nextMatch ? (
              <Link href={`/mecze/${nextMatch.id}`} className="mt-3 flex flex-1 flex-col group">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-1 items-center gap-1.5 min-w-0">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: nextMatch.homeTeam.color }} />
                    <span className="text-sm font-medium text-zinc-800 truncate">{nextMatch.homeTeam.name}</span>
                  </div>
                  <span className="text-xs font-medium text-zinc-400 shrink-0">vs</span>
                  <div className="flex flex-1 items-center gap-1.5 justify-end min-w-0">
                    <span className="text-sm font-medium text-zinc-800 truncate text-right">{nextMatch.awayTeam.name}</span>
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: nextMatch.awayTeam.color }} />
                  </div>
                </div>
                <p className="mt-auto pt-2 text-xs text-zinc-400 group-hover:text-zinc-600 transition-colors">
                  {fmtDate(nextMatch.scheduledAt)}, {fmtTime(nextMatch.scheduledAt)} →
                </p>
              </Link>
            ) : (
              <p className="mt-3 text-sm text-zinc-400">Brak zaplanowanych meczów.</p>
            )}
          </div>

          {/* Table leader */}
          <div className="flex flex-col rounded-xl border border-zinc-200 border-t-2 border-t-orange-500 bg-white p-4">
            <div className="flex items-start justify-between gap-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Lider tabeli</p>
              <span className="text-orange-500"><IconTrophy /></span>
            </div>
            {tableLeader ? (
              <>
                <p className="mt-2 truncate font-bold text-zinc-900 leading-tight">{tableLeader.teamName}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: tableLeader.teamColor }} />
                  <span className="text-xs text-zinc-500">{tableLeader.played} meczów</span>
                </div>
                <div className="mt-auto pt-2 flex items-baseline gap-1.5">
                  <CountUp value={tableLeader.points} className="text-2xl font-black text-zinc-900" />
                  <span className="text-xs text-zinc-400">pkt</span>
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm text-zinc-400">Brak danych.</p>
            )}
          </div>

          {/* Top scorer */}
          {topScorer && topScorer.goals > 0 ? (
            <Link href={`/gracze/${topScorer.id}`} className="flex flex-col rounded-xl border border-zinc-200 border-t-2 border-t-orange-500 bg-white p-4 transition-colors hover:bg-zinc-50">
              <div className="flex items-start justify-between gap-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Król strzelców</p>
                <span className="text-orange-500"><IconBall /></span>
              </div>
              <p className="mt-2 truncate font-bold text-zinc-900 leading-tight">
                {topScorer.firstName} {topScorer.lastName}
              </p>
              {topScorer.nickname && (
                <p className="truncate text-xs text-zinc-400">„{topScorer.nickname}"</p>
              )}
              {topScorer.team ? (
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: topScorer.team.color }} />
                  <span className="truncate text-xs text-zinc-500">{topScorer.team.name}</span>
                </div>
              ) : (
                <div className="mt-1 h-4" />
              )}
              <div className="mt-auto pt-2 flex items-baseline gap-1.5">
                <CountUp value={topScorer.goals} className="text-2xl font-black text-zinc-900" />
                <span className="text-xs text-zinc-400">{goalLabel(topScorer.goals)}</span>
                {topScorer.assists > 0 && (
                  <span className="text-xs text-zinc-400">· <CountUp value={topScorer.assists} /> asyst</span>
                )}
              </div>
            </Link>
          ) : (
            <div className="flex flex-col rounded-xl border border-zinc-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Król strzelców</p>
              <p className="mt-3 text-sm text-zinc-400">Brak danych.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Ogłoszenia ── */}
      {latestAnnouncements.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Ogłoszenia</h2>
            <Link href="/ogloszenia" className="text-xs text-zinc-500 hover:text-zinc-800 transition-colors">
              Zobacz wszystkie →
            </Link>
          </div>
          <div className="space-y-2 stagger">
            {latestAnnouncements.map((a) => {
              const borderCls =
                a.priority === "URGENT"    ? "border-l-red-500" :
                a.priority === "IMPORTANT" ? "border-l-orange-500" :
                "border-l-orange-300"
              const badgeCls =
                a.priority === "URGENT"    ? "text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full" :
                a.priority === "IMPORTANT" ? "text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full" :
                null
              const badgeLabel = a.priority === "URGENT" ? "Pilne" : a.priority === "IMPORTANT" ? "Ważne" : null
              return (
                <Link
                  key={a.id}
                  href="/ogloszenia"
                  className={`block rounded-xl border border-zinc-200 border-l-4 bg-white px-4 py-3 transition-colors hover:bg-zinc-50 ${borderCls}`}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    {badgeCls && <span className={badgeCls}>{badgeLabel}</span>}
                    {a.isPinned && (
                      <span className="text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">Przypięte</span>
                    )}
                    <p className="text-sm font-semibold text-zinc-900">{a.title}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Registration reminder ── */}
      {showRegPrompt && nextMatch && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-orange-200 bg-orange-50 border-l-4 border-l-orange-500 px-4 py-3 text-sm">
          <p className="text-orange-800 font-medium">
            {myNextReg?.status === "PENDING"
              ? <>Potwierdź obecność na mecz: <span className="font-semibold">{fmtDate(nextMatch.scheduledAt)}, {fmtTime(nextMatch.scheduledAt)}</span></>
              : <>Nie jesteś zapisany na następny mecz: <span className="font-semibold">{fmtDate(nextMatch.scheduledAt)}, {fmtTime(nextMatch.scheduledAt)}</span></>
            }
          </p>
          <Link
            href={`/mecze/${nextMatch.id}`}
            className="shrink-0 font-semibold text-orange-700 hover:underline"
          >
            {myNextReg?.status === "PENDING" ? "Potwierdź się →" : "Sprawdź mecz →"}
          </Link>
        </div>
      )}

      {/* ── Standings table ── */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold">Tabela ligowa</h2>
          {season && <p className="text-sm text-zinc-500">{season.name}</p>}
        </div>

        {!season ? (
          <p className="text-zinc-500">Brak sezonów w bazie.</p>
        ) : (
          <>
            {/* Season tabs */}
            <div className="flex flex-wrap gap-1.5">
              <SeasonTab
                href="/"
                label={activeSeason ? activeSeason.name.replace("Sezon ", "") : "Aktualny"}
                active={!seasonId || season.id === activeSeason?.id}
                isActive
              />
              {sortedSeasons
                .filter((s) => s.id !== activeSeason?.id)
                .map((s) => (
                  <SeasonTab
                    key={s.id}
                    href={`/?sezon=${s.id}`}
                    label={s.name.replace("Sezon ", "")}
                    active={season.id === s.id}
                  />
                ))}
            </div>

            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
              <StandingsTable rows={rows} currentUserId={session?.userId ?? null} />
            </div>

            <p className="hidden sm:block text-xs text-zinc-400">
              M — mecze · W — wygrane · R — remisy · P — porażki · Br — bramki · RB — różnica bramek · Pkt — punkty
            </p>
          </>
        )}
      </div>
    </div>
  )
}


function SeasonTab({
  href, label, active, isActive,
}: {
  href: string; label: string; active: boolean; isActive?: boolean
}) {
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-3 sm:py-1.5 text-sm font-medium transition-colors ${
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

function StandingsSortHeader({
  label, title, sortKey, currentSort, seasonId, className = "",
}: {
  label: string; title: string; sortKey: string; currentSort?: string; seasonId?: string; className?: string
}) {
  const isActive = currentSort === sortKey || (!currentSort && sortKey === "pkt")
  const params = new URLSearchParams()
  if (seasonId) params.set("sezon", seasonId)
  params.set("sort", sortKey)
  return (
    <th className={`px-4 py-3 text-center w-10 ${className}`} title={title}>
      <Link
        href={`/?${params.toString()}`}
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

function fmtDate(date: Date) {
  return new Date(date).toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" })
}

function fmtTime(date: Date) {
  return new Date(date).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })
}

function IconTrophy() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21h8M12 17v4M17 3H7v8a5 5 0 0 0 10 0V3z" />
      <path d="M7 4H4a2 2 0 0 0-2 2v1a4 4 0 0 0 4 4h1" />
      <path d="M17 4h3a2 2 0 0 1 2 2v1a4 4 0 0 1-4 4h-1" />
    </svg>
  )
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
