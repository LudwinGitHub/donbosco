import React from "react"
import Link from "next/link"
import { getActiveSeason, getAllSeasons, getStandings, type FormResult } from "@/lib/standings"
import { getPlayersWithStats, type PlayerWithStats } from "@/lib/players"
import { getOptionalSession } from "@/lib/dal"
import { prisma } from "@/lib/prisma"

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
      include: { pollVotes: { select: { option: true } } },
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

  const showRegPrompt = nextMatch && session?.userId
    ? !(await prisma.matchRegistration.findFirst({
        where: { matchId: nextMatch.id, userId: session.userId },
        select: { id: true },
      }))
    : false

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
    return baseRows
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
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
                  <span className="text-2xl font-black text-zinc-900">{tableLeader.points}</span>
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
                <span className="text-2xl font-black text-zinc-900">{topScorer.goals}</span>
                <span className="text-xs text-zinc-400">{goalLabel(topScorer.goals)}</span>
                {topScorer.assists > 0 && (
                  <span className="text-xs text-zinc-400">· {topScorer.assists} asyst</span>
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
          <div className="space-y-2">
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
              const pollOpts = [
                { opt: "A", label: a.pollOptA },
                { opt: "B", label: a.pollOptB },
                ...(a.pollOptC ? [{ opt: "C", label: a.pollOptC }] : []),
                ...(a.pollOptD ? [{ opt: "D", label: a.pollOptD }] : []),
              ].filter((o) => o.label)
              const hasPoll = !!a.pollQuestion && pollOpts.length >= 2
              const totalVotes = a.pollVotes.length
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
                  <p className="mt-1 text-sm text-zinc-600 line-clamp-2">{a.content}</p>
                  {hasPoll && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-semibold text-zinc-600">📊 {a.pollQuestion}</p>
                      {pollOpts.map(({ opt, label }) => {
                        const votes = a.pollVotes.filter((v) => v.option === opt).length
                        const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0
                        return (
                          <div key={opt} className="relative flex items-center gap-2 rounded-md overflow-hidden bg-zinc-100 px-2 py-1 text-xs">
                            <span className="absolute inset-y-0 left-0 bg-orange-100" style={{ width: `${pct}%` }} />
                            <span className="relative font-bold text-orange-500 shrink-0 w-3">{opt}</span>
                            <span className="relative flex-1 truncate text-zinc-700">{label}</span>
                            <span className="relative shrink-0 text-zinc-400 tabular-nums">{pct}%</span>
                          </div>
                        )
                      })}
                      <p className="text-[11px] text-zinc-400">{totalVotes} {voteLabel(totalVotes)} · Zagłosuj →</p>
                    </div>
                  )}
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
            Nie jesteś zapisany na następny mecz:{" "}
            <span className="font-semibold">{fmtDate(nextMatch.scheduledAt)}, {fmtTime(nextMatch.scheduledAt)}</span>
          </p>
          <Link
            href={`/mecze/${nextMatch.id}`}
            className="shrink-0 font-semibold text-orange-700 hover:underline"
          >
            Zapisz się →
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
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    <th className="px-4 py-3 text-left w-8">#</th>
                    <th className="px-4 py-3 text-left">Drużyna</th>
                    <th className="px-4 py-3 text-center w-10 hidden sm:table-cell" title="Mecze">M</th>
                    <StandingsSortHeader label="W" title="Wygrane"        sortKey="w"   currentSort={sort} seasonId={seasonId} />
                    <th className="px-4 py-3 text-center w-10 hidden sm:table-cell" title="Remisy">R</th>
                    <th className="px-4 py-3 text-center w-10 hidden sm:table-cell" title="Porażki">P</th>
                    <StandingsSortHeader label="Br" title="Bramki"        sortKey="br"  currentSort={sort} seasonId={seasonId} className="hidden sm:table-cell" />
                    <StandingsSortHeader label="RB" title="Różnica bramek" sortKey="rb" currentSort={sort} seasonId={seasonId} className="hidden sm:table-cell" />
                    <StandingsSortHeader label="Pkt" title="Punkty"       sortKey="pkt" currentSort={sort} seasonId={seasonId} className="font-bold text-zinc-600" />
                    <th className="px-4 py-3 text-center" title="Forma (ostatnie 5 meczów)">Forma</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {rows.map((row, i) => (
                    <tr key={row.teamId} className="transition-colors hover:bg-zinc-50">
                      <td className="px-4 py-3 text-zinc-400 font-medium">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: row.teamColor }} />
                          <Link href={`/druzyny/${row.teamId}`} className="font-medium text-zinc-900 hover:underline">
                            {row.teamName}
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-zinc-600 hidden sm:table-cell">{row.played}</td>
                      <td className="px-4 py-3 text-center text-zinc-600 hidden sm:table-cell">{row.won}</td>
                      <td className="px-4 py-3 text-center text-zinc-600 hidden sm:table-cell">{row.drawn}</td>
                      <td className="px-4 py-3 text-center text-zinc-600 hidden sm:table-cell">{row.lost}</td>
                      <td className="px-4 py-3 text-center text-zinc-600 hidden sm:table-cell">{row.goalsFor}:{row.goalsAgainst}</td>
                      <td className="px-4 py-3 text-center hidden sm:table-cell">
                        <span className={row.goalDiff > 0 ? "text-green-600" : row.goalDiff < 0 ? "text-red-500" : "text-zinc-400"}>
                          {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-zinc-900">{row.points}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {row.form.map((r, i) => <FormDot key={i} result={r} />)}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-4 py-8 text-center text-zinc-400">
                        Brak rozegranych meczów w tym sezonie.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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

function FormDot({ result }: { result: FormResult }) {
  const styles: Record<FormResult, string> = { W: "bg-green-500", D: "bg-zinc-300", L: "bg-red-400" }
  const titles: Record<FormResult, string> = { W: "Wygrana", D: "Remis", L: "Porażka" }
  return <span title={titles[result]} className={`h-2.5 w-2.5 rounded-full ${styles[result]}`} />
}

function SeasonTab({
  href, label, active, isActive,
}: {
  href: string; label: string; active: boolean; isActive?: boolean
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

function voteLabel(n: number) {
  if (n === 1) return "głos"
  if (n >= 2 && n <= 4) return "głosy"
  return "głosów"
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
