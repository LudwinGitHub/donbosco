import Link from "next/link"
import {
  getMatchHighlights,
  getTopSingleMatchScorers,
  getSeasonOverviews,
  getFullScorerRanking,
  getTeamStats,
  type MatchHighlight,
  type PlayerMatchRecord,
  type SeasonOverview,
  type ScorerRankingRow,
  type TeamStatsRow,
} from "@/lib/stats"
import { getActiveSeason } from "@/lib/standings"

export default async function StatystykiPage() {
  const activeSeason = await getActiveSeason()

  const [{ highestScoring, biggestWin }, topScorers, seasons, allTimeScorerRanking, teamStats] = await Promise.all([
    getMatchHighlights(),
    getTopSingleMatchScorers(5),
    getSeasonOverviews(),
    getFullScorerRanking(),
    activeSeason ? getTeamStats(activeSeason.id) : Promise.resolve([]),
  ])

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Statystyki</h1>
          <p className="mt-0.5 text-sm text-zinc-500">Rekordy i podsumowania wszystkich sezonów</p>
        </div>
        <Link
          href="/statystyki/h2h"
          className="shrink-0 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
        >
          Bezpośrednie starcia →
        </Link>
      </div>

      {/* All-time scorer ranking */}
      {allTimeScorerRanking.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Klasyfikacja strzelców</h2>
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
                {allTimeScorerRanking.slice(0, 5).map((r, i) => (
                  <TopScorerRow key={r.playerId} row={r} rank={i + 1} />
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-right">
            <Link href="/statystyki/strzelcy" className="text-sm text-zinc-500 hover:text-zinc-700 hover:underline">
              Zobacz pełną klasyfikację →
            </Link>
          </div>
        </section>
      )}

      {/* Match records */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Rekordy meczu</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <MatchRecordCard
            title="Najbardziej bramkowy mecz"
            matches={highestScoring}
            valueLabel={(v) => `${v} bramek`}
          />
          <MatchRecordCard
            title="Największa różnica bramek"
            matches={biggestWin}
            valueLabel={(v) => `+${v}`}
          />
        </div>
      </section>

      {/* Player records */}
      {topScorers.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Rekord strzelecki (w jednym meczu)</h2>
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  <th className="px-4 py-3 text-right w-8">#</th>
                  <th className="px-4 py-3 text-left">Gracz</th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">Mecz</th>
                  <th className="px-4 py-3 text-center w-16" title="Gole">G</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {topScorers.map((r, i) => (
                  <PlayerRecordRow key={`${r.playerId}-${r.matchId}`} record={r} rank={i + 1} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Season overview */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Podsumowanie sezonów</h2>
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                <th className="px-4 py-3 text-left">Sezon</th>
                <th className="px-4 py-3 text-center w-14" title="Mecze">M</th>
                <th className="px-4 py-3 text-center w-16 hidden sm:table-cell" title="Bramki">Br</th>
                <th className="px-4 py-3 text-center w-20 hidden sm:table-cell" title="Średnia bramek">Śr/mecz</th>
                <th className="px-4 py-3 text-left">Mistrz sezonu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {seasons.map((s) => (
                <SeasonRow key={s.seasonId} season={s} />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Team stats (active season) */}
      {activeSeason && teamStats.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Statystyki drużyn — {activeSeason.name}
          </h2>
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  <th className="px-4 py-3 text-left">Drużyna</th>
                  <th className="px-4 py-3 text-center w-28 hidden sm:table-cell">Śr. goli zdobytych</th>
                  <th className="px-4 py-3 text-center w-28 hidden sm:table-cell">Śr. straconych</th>
                  <th className="px-4 py-3 text-center w-28">Śr. goli</th>
                  <th className="px-4 py-3 text-center w-24">Czyste konta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {teamStats.map((t) => (
                  <TeamStatsRow key={t.teamId} row={t} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}

// ─── Components ───────────────────────────────────────────────────────────────

function MatchRecordCard({
  title,
  matches,
  valueLabel,
}: {
  title: string
  matches: MatchHighlight[]
  valueLabel: (v: number) => string
}) {
  if (matches.length === 0) return null
  const [top, ...rest] = matches

  return (
    <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b border-zinc-100">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{title}</p>
        <Link href={`/mecze/${top.matchId}`} className="mt-2 block group">
          <div className="flex items-center gap-2">
            <TeamBadge name={top.homeTeamName} color={top.homeTeamColor} align="left" />
            <span className="shrink-0 text-lg font-bold tabular-nums text-zinc-900">
              {top.homeScore}:{top.awayScore}
            </span>
            <TeamBadge name={top.awayTeamName} color={top.awayTeamColor} align="right" />
          </div>
          <div className="mt-1 flex items-center justify-between">
            <p className="text-xs text-zinc-400">
              {top.seasonName}{top.round != null ? ` · k${top.round}` : ""} ·{" "}
              {new Date(top.scheduledAt).toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" })}
            </p>
            <span className="text-sm font-bold text-zinc-900">{valueLabel(top.value)}</span>
          </div>
        </Link>
      </div>
      {rest.length > 0 && (
        <div className="divide-y divide-zinc-50">
          {rest.map((m) => (
            <Link key={m.matchId} href={`/mecze/${m.matchId}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 transition-colors">
              <div className="flex flex-1 items-center gap-1.5 min-w-0 text-xs text-zinc-600">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: m.homeTeamColor }} />
                <span className="truncate">{m.homeTeamName}</span>
                <span className="font-semibold tabular-nums shrink-0 mx-0.5">{m.homeScore}:{m.awayScore}</span>
                <span className="truncate">{m.awayTeamName}</span>
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: m.awayTeamColor }} />
              </div>
              <span className="shrink-0 text-xs font-bold text-zinc-500">{valueLabel(m.value)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function TeamBadge({ name, color, align }: { name: string; color: string; align: "left" | "right" }) {
  return (
    <div className={`flex flex-1 items-center gap-1.5 min-w-0 ${align === "right" ? "flex-row-reverse" : ""}`}>
      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className="text-sm font-medium text-zinc-800 truncate">{name}</span>
    </div>
  )
}

function PlayerRecordRow({ record: r, rank }: { record: PlayerMatchRecord; rank: number }) {
  return (
    <tr className="hover:bg-zinc-50 transition-colors">
      <td className="px-4 py-3 text-right text-xs text-zinc-300">{rank}</td>
      <td className="px-4 py-3">
        <Link href={`/gracze/${r.playerId}`} className="font-medium text-zinc-900 hover:underline">
          {r.firstName} {r.lastName}
        </Link>
      </td>
      <td className="px-4 py-3 hidden sm:table-cell">
        <Link href={`/mecze/${r.matchId}`} className="text-zinc-500 hover:text-zinc-700 hover:underline">
          vs {r.vsTeam} ·{" "}
          {new Date(r.scheduledAt).toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" })}
          <span className="ml-1 text-xs text-zinc-400">({r.seasonName})</span>
        </Link>
      </td>
      <td className="px-4 py-3 text-center font-bold text-zinc-900">{r.goals}</td>
    </tr>
  )
}

function SeasonRow({ season: s }: { season: SeasonOverview }) {
  return (
    <tr className="hover:bg-zinc-50 transition-colors">
      <td className="px-4 py-3 font-medium text-zinc-800">{s.seasonName}</td>
      <td className="px-4 py-3 text-center text-zinc-600">{s.played}</td>
      <td className="px-4 py-3 text-center text-zinc-600 hidden sm:table-cell">{s.totalGoals}</td>
      <td className="px-4 py-3 text-center text-zinc-600 hidden sm:table-cell">{s.avgGoals}</td>
      <td className="px-4 py-3">
        {s.champion ? (
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: s.championColor! }} />
            <span className="text-zinc-800">{s.champion}</span>
            {s.champPoints != null && (
              <span className="text-xs text-zinc-400">{s.champPoints} pkt</span>
            )}
          </div>
        ) : (
          <span className="text-zinc-300">—</span>
        )}
      </td>
    </tr>
  )
}

function TopScorerRow({ row: r, rank }: { row: ScorerRankingRow; rank: number }) {
  return (
    <tr className="hover:bg-zinc-50 transition-colors">
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

function TeamStatsRow({ row: t }: { row: TeamStatsRow }) {
  return (
    <tr className="hover:bg-zinc-50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: t.teamColor }} />
          <span className="font-medium text-zinc-800">{t.teamName}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-center text-zinc-600 hidden sm:table-cell">{t.avgGoalsScored}</td>
      <td className="px-4 py-3 text-center text-zinc-600 hidden sm:table-cell">{t.avgGoalsConceded}</td>
      <td className="px-4 py-3 text-center text-zinc-600 sm:hidden">
        {t.avgGoalsScored} / {t.avgGoalsConceded}
      </td>
      <td className="px-4 py-3 text-center font-medium text-zinc-700">{t.cleanSheets}</td>
    </tr>
  )
}
