import Link from "next/link"
import { getActiveSeason, getAllSeasons, getStandings, type FormResult } from "@/lib/standings"
import { getPlayersWithStats, type PlayerWithStats } from "@/lib/players"
import { getOptionalSession } from "@/lib/dal"
import { prisma } from "@/lib/prisma"

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ sezon?: string }>
}) {
  const { sezon: seasonId } = await searchParams
  const [activeSeason, allSeasons, session, latestAnnouncements] = await Promise.all([
    getActiveSeason(),
    getAllSeasons(),
    getOptionalSession(),
    prisma.announcement.findMany({
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      take: 3,
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

  const rows =
    season && activeSeason && season.id !== activeSeason.id
      ? await getStandings(season.id)
      : activeRows

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
          <div className="rounded-xl border border-zinc-200 bg-white p-4 col-span-2 sm:col-span-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Ostatni mecz{lastMatch?.round != null ? ` · k${lastMatch.round}` : ""}
            </p>
            {lastMatch ? (
              <Link href={`/mecze/${lastMatch.id}`} className="mt-3 block group">
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
                <p className="mt-1.5 text-xs text-zinc-400 group-hover:text-zinc-600 transition-colors">
                  {fmtDate(lastMatch.scheduledAt)} →
                </p>
              </Link>
            ) : (
              <p className="mt-3 text-sm text-zinc-400">Brak rozegranych meczów.</p>
            )}
          </div>

          {/* Next match */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 col-span-2 sm:col-span-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Następny mecz{nextMatch?.round != null ? ` · k${nextMatch.round}` : ""}
            </p>
            {nextMatch ? (
              <Link href={`/mecze/${nextMatch.id}`} className="mt-3 block group">
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
                <p className="mt-2 text-xs text-zinc-400 group-hover:text-zinc-600 transition-colors">
                  {fmtDate(nextMatch.scheduledAt)}, {fmtTime(nextMatch.scheduledAt)} →
                </p>
              </Link>
            ) : (
              <p className="mt-3 text-sm text-zinc-400">Brak zaplanowanych meczów.</p>
            )}
          </div>

          {/* Table leader */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Lider tabeli</p>
            {tableLeader ? (
              <div className="mt-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: tableLeader.teamColor }} />
                  <span className="font-semibold text-zinc-900 leading-tight">{tableLeader.teamName}</span>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-zinc-900">{tableLeader.points}</span>
                  <span className="text-xs text-zinc-400">pkt · {tableLeader.played} meczów</span>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-zinc-400">Brak danych.</p>
            )}
          </div>

          {/* Top scorer */}
          {topScorer && topScorer.goals > 0 ? (
            <Link href={`/gracze/${topScorer.id}`} className="block rounded-xl border border-zinc-200 border-t-2 border-t-amber-400 bg-white p-4 transition-colors hover:bg-zinc-50">
              <div className="flex items-start justify-between gap-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Król strzelców</p>
                <span className="text-lg leading-none">⚽</span>
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
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-amber-500">{topScorer.goals}</span>
                <span className="text-xs text-zinc-400">{goalLabel(topScorer.goals)}</span>
                {topScorer.assists > 0 && (
                  <span className="text-xs text-zinc-400">· {topScorer.assists} asyst</span>
                )}
              </div>
            </Link>
          ) : (
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
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
              const cardCls =
                a.priority === "URGENT"    ? "border-red-300 bg-red-50" :
                a.priority === "IMPORTANT" ? "border-orange-200 bg-orange-50" :
                "border-zinc-200 bg-white"
              const badgeCls =
                a.priority === "URGENT"    ? "text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full" :
                a.priority === "IMPORTANT" ? "text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full" :
                null
              const badgeLabel =
                a.priority === "URGENT" ? "Pilne" :
                a.priority === "IMPORTANT" ? "Ważne" : null
              return (
                <div key={a.id} className={`rounded-xl border px-4 py-3 ${cardCls}`}>
                  <div className="flex items-center gap-2 flex-wrap">
                    {badgeCls && <span className={badgeCls}>{badgeLabel}</span>}
                    {a.isPinned && (
                      <span className="text-xs font-semibold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">Przypięte</span>
                    )}
                    <p className="text-sm font-semibold text-zinc-900">{a.title}</p>
                  </div>
                  <p className="mt-1 text-sm text-zinc-600 line-clamp-2">{a.content}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Registration reminder ── */}
      {showRegPrompt && nextMatch && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
          <p className="text-amber-800 font-medium">
            Nie jesteś zapisany na następny mecz:{" "}
            <span className="font-semibold">{fmtDate(nextMatch.scheduledAt)}, {fmtTime(nextMatch.scheduledAt)}</span>
          </p>
          <Link
            href={`/mecze/${nextMatch.id}`}
            className="shrink-0 font-semibold text-amber-900 hover:underline"
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
                    <th className="px-4 py-3 text-center w-10 hidden sm:table-cell" title="Wygrane">W</th>
                    <th className="px-4 py-3 text-center w-10 hidden sm:table-cell" title="Remisy">R</th>
                    <th className="px-4 py-3 text-center w-10 hidden sm:table-cell" title="Porażki">P</th>
                    <th className="px-4 py-3 text-center w-14 hidden sm:table-cell" title="Bramki">Br</th>
                    <th className="px-4 py-3 text-center w-10 hidden sm:table-cell" title="Różnica bramek">RB</th>
                    <th className="px-4 py-3 text-center w-10 font-bold text-zinc-600" title="Punkty">Pkt</th>
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
                          <span className="font-medium text-zinc-900">{row.teamName}</span>
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
        active ? "bg-zinc-900 text-white" : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
      }`}
    >
      {label}
      {isActive && !active && (
        <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-green-500 align-middle" />
      )}
    </Link>
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
