import Link from "next/link"
import { getHeadToHead, type HeadToHeadResult } from "@/lib/stats"
import { getActiveSeason, getAllSeasons } from "@/lib/standings"
import { prisma } from "@/lib/prisma"

export default async function H2HPage({
  searchParams,
}: {
  searchParams: Promise<{ sezon?: string; team1?: string; team2?: string }>
}) {
  const { sezon, team1, team2 } = await searchParams
  const [allSeasons, activeSeason] = await Promise.all([getAllSeasons(), getActiveSeason()])

  const selectedSeasonId = sezon ?? activeSeason?.id
  const selectedSeason = allSeasons.find((s) => s.id === selectedSeasonId) ?? activeSeason

  const teams = selectedSeason
    ? await prisma.team.findMany({
        where:   { seasonId: selectedSeason.id },
        orderBy: { name: "asc" },
      })
    : []

  let h2h: HeadToHeadResult | null = null
  let h2hError: string | null = null

  if (team1 && team2) {
    if (team1 === team2) {
      h2hError = "Wybierz dwie różne drużyny."
    } else {
      const bothExist = teams.some((t) => t.id === team1) && teams.some((t) => t.id === team2)
      if (!bothExist) {
        h2hError = "Wybrane drużyny nie należą do tego sezonu."
      } else {
        try {
          h2h = await getHeadToHead(team1, team2)
        } catch {
          h2hError = "Nie udało się załadować danych."
        }
      }
    }
  }

  const sortedSeasons = [...allSeasons].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/statystyki"
          className="mb-3 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
        >
          ← Statystyki
        </Link>
        <h1 className="text-2xl font-bold">Bezpośrednie starcia</h1>
        <p className="mt-0.5 text-sm text-zinc-500">Porównaj historię wyników między dwiema drużynami</p>
      </div>

      {/* Season tabs */}
      <div className="flex flex-wrap gap-1.5">
        {sortedSeasons.map((s) => (
          <Link
            key={s.id}
            href={`/statystyki/h2h?sezon=${s.id}`}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              selectedSeason?.id === s.id
                ? "bg-zinc-900 text-white"
                : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            {s.name.replace("Sezon ", "")}
            {s.isActive && selectedSeason?.id !== s.id && (
              <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-green-500 align-middle" />
            )}
          </Link>
        ))}
      </div>

      {/* Team picker form */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-6">
        <form method="GET" className="flex flex-col sm:flex-row items-end gap-3">
          <input type="hidden" name="sezon" value={selectedSeasonId ?? ""} />

          <div className="flex-1 w-full space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Drużyna 1
            </label>
            <select
              name="team1"
              defaultValue={team1 ?? ""}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 bg-white"
            >
              <option value="" disabled>Wybierz drużynę…</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <span className="hidden sm:block text-zinc-300 font-semibold text-lg pb-2">vs</span>

          <div className="flex-1 w-full space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Drużyna 2
            </label>
            <select
              name="team2"
              defaultValue={team2 ?? ""}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 bg-white"
            >
              <option value="" disabled>Wybierz drużynę…</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
          >
            Porównaj
          </button>
        </form>

        {teams.length === 0 && (
          <p className="mt-4 text-sm text-zinc-400">Brak drużyn w wybranym sezonie.</p>
        )}
      </div>

      {/* Error */}
      {h2hError && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {h2hError}
        </div>
      )}

      {/* H2H Results */}
      {h2h && <H2HResults h2h={h2h} team1Id={team1!} />}

      {/* Empty state when no teams selected */}
      {!team1 && !team2 && !h2hError && teams.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white px-4 py-12 text-center text-sm text-zinc-400">
          Wybierz dwie drużyny, żeby zobaczyć historię starć.
        </div>
      )}
    </div>
  )
}

function H2HResults({ h2h, team1Id }: { h2h: HeadToHeadResult; team1Id: string }) {
  const { team1, team2, draws, totalMatches, matches } = h2h

  const totalDecisive = team1.wins + team2.wins
  const team1WinPct = totalDecisive > 0 ? (team1.wins / totalDecisive) * 100 : 50
  const team2WinPct = 100 - team1WinPct

  return (
    <div className="space-y-4">
      {/* Main scoreboard */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        {/* Teams + score */}
        <div className="grid grid-cols-3 items-center gap-2 px-6 py-6">
          {/* Team 1 */}
          <div className="text-center space-y-1">
            <div className="flex justify-center">
              <span className="h-5 w-5 rounded-full" style={{ backgroundColor: team1.color }} />
            </div>
            <p className="font-bold text-zinc-900 leading-tight">{team1.name}</p>
          </div>

          {/* Wins / Draws */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="text-4xl font-black tabular-nums text-zinc-900">{team1.wins}</span>
              <span className="text-xl font-light text-zinc-300">-</span>
              <span className="text-2xl font-bold tabular-nums text-zinc-400">{draws}</span>
              <span className="text-xl font-light text-zinc-300">-</span>
              <span className="text-4xl font-black tabular-nums text-zinc-900">{team2.wins}</span>
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              {totalMatches === 0
                ? "Brak rozegranych meczów"
                : `${totalMatches} ${totalMatches === 1 ? "mecz" : totalMatches < 5 ? "mecze" : "meczów"}`}
            </p>
          </div>

          {/* Team 2 */}
          <div className="text-center space-y-1">
            <div className="flex justify-center">
              <span className="h-5 w-5 rounded-full" style={{ backgroundColor: team2.color }} />
            </div>
            <p className="font-bold text-zinc-900 leading-tight">{team2.name}</p>
          </div>
        </div>

        {/* Win ratio bar */}
        {totalDecisive > 0 && (
          <div className="px-6 pb-4">
            <div className="flex h-2 overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-l-full transition-all"
                style={{ width: `${team1WinPct}%`, backgroundColor: team1.color }}
              />
              <div
                className="h-full rounded-r-full transition-all"
                style={{ width: `${team2WinPct}%`, backgroundColor: team2.color }}
              />
            </div>
          </div>
        )}

        {/* Goals */}
        <div className="grid grid-cols-3 border-t border-zinc-100 bg-zinc-50">
          <div className="px-6 py-3 text-center">
            <p className="text-xl font-bold text-zinc-900">{team1.goals}</p>
            <p className="text-xs text-zinc-400">bramki</p>
          </div>
          <div className="px-6 py-3 text-center border-x border-zinc-100">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 mt-1.5">Bramki</p>
          </div>
          <div className="px-6 py-3 text-center">
            <p className="text-xl font-bold text-zinc-900">{team2.goals}</p>
            <p className="text-xs text-zinc-400">bramki</p>
          </div>
        </div>
      </div>

      {/* Match list */}
      {matches.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Historia meczów
          </h2>
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white divide-y divide-zinc-100">
            {matches.map((m) => {
              const isTeam1Home = m.homeTeamId === team1Id
              const t1score = isTeam1Home ? m.homeScore : m.awayScore
              const t2score = isTeam1Home ? m.awayScore : m.homeScore
              const winner =
                t1score > t2score ? "team1" : t2score > t1score ? "team2" : "draw"

              return (
                <Link
                  key={m.matchId}
                  href={`/mecze/${m.matchId}`}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-zinc-50 transition-colors group"
                >
                  {/* Date + season */}
                  <div className="shrink-0 w-24 sm:w-32">
                    <p className="text-xs text-zinc-400">{fmtDate(m.scheduledAt)}</p>
                    <p className="text-xs text-zinc-300 truncate">{m.seasonName}</p>
                  </div>

                  {/* Score */}
                  <div className="flex flex-1 items-center justify-center gap-3">
                    <span
                      className={`flex-1 text-right text-sm font-medium truncate ${
                        winner === "team1" ? "text-zinc-900 font-semibold" : "text-zinc-400"
                      }`}
                    >
                      {team1.name}
                    </span>
                    <span className="shrink-0 flex items-center gap-1 tabular-nums">
                      <span
                        className={`text-lg font-bold ${
                          winner === "team1" ? "text-zinc-900" : "text-zinc-500"
                        }`}
                      >
                        {t1score}
                      </span>
                      <span className="text-zinc-300 font-light">:</span>
                      <span
                        className={`text-lg font-bold ${
                          winner === "team2" ? "text-zinc-900" : "text-zinc-500"
                        }`}
                      >
                        {t2score}
                      </span>
                    </span>
                    <span
                      className={`flex-1 text-left text-sm font-medium truncate ${
                        winner === "team2" ? "text-zinc-900 font-semibold" : "text-zinc-400"
                      }`}
                    >
                      {team2.name}
                    </span>
                  </div>

                  <span className="shrink-0 text-zinc-300 group-hover:text-zinc-400 text-sm">›</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {totalMatches === 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white px-4 py-10 text-center text-sm text-zinc-400">
          Te drużyny nie rozegrały jeszcze ze sobą żadnego meczu.
        </div>
      )}
    </div>
  )
}

function fmtDate(date: Date) {
  return new Date(date).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}
