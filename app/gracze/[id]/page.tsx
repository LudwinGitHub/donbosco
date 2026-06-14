import Link from "next/link"
import { notFound } from "next/navigation"
import { getPlayerProfile, getPlayerForms, getFavoritePartner, type PlayerForm } from "@/lib/players"
import { getActiveBadges } from "@/lib/badges"
import BadgeChip from "@/app/ui/badge-chip"
import SeasonChart from "@/app/moj-profil/season-chart"
import CountUp from "@/app/ui/count-up"

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [player, forms, badges] = await Promise.all([getPlayerProfile(id), getPlayerForms(), getActiveBadges()])
  if (!player) notFound()
  const form = forms.get(id)
  const playerBadges = badges.get(id) ?? []

  const favoritePartner = await getFavoritePartner(id)

  const bestMatch = player.matches.length > 0
    ? [...player.matches].sort((a, b) => b.goals - a.goals || b.assists - a.assists)[0]
    : null
  const hasBestMatch = bestMatch && (bestMatch.goals > 0 || bestMatch.assists > 0)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <Link href="/gracze" className="hover:text-zinc-600 transition-colors">Gracze</Link>
        <span>›</span>
        <span className="text-zinc-600">{player.firstName} {player.lastName}</span>
      </div>

      {/* Hero */}
      <div className="rounded-xl border border-zinc-200 border-t-2 border-t-orange-500 bg-white p-6">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold text-zinc-900">
            {player.firstName} {player.lastName}
          </h1>
          <FormArrow form={form} />
          {playerBadges.map((b, i) => (
            <BadgeChip key={i} type={b.type} />
          ))}
        </div>
        {player.nickname && (
          <p className="mt-0.5 text-sm text-zinc-400">„{player.nickname}"</p>
        )}
        <div className={`mt-5 grid gap-4 border-t border-zinc-100 pt-5 ${player.totalMvp > 0 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
          <StatCell label="Mecze"  value={player.totalPlayed} />
          <StatCell label="Gole"   value={player.totalGoals} />
          <StatCell label="Asysty" value={player.totalAssists} />
          {player.totalMvp > 0 && <StatCell label="MVP" value={player.totalMvp} />}
        </div>
      </div>

      {/* Highlights: best match + favorite partner */}
      {(hasBestMatch || favoritePartner) && (
        <div className="grid grid-cols-2 gap-3">
          {hasBestMatch && bestMatch && (
            <Link
              href={`/mecze/${bestMatch.matchId}`}
              className="flex flex-col rounded-xl border border-zinc-200 border-t-2 border-t-orange-500 bg-white p-4 transition-colors hover:bg-zinc-50"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Najlepszy mecz</p>
              <div className="mt-2 flex items-center gap-1.5 min-w-0">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: bestMatch.opponent.color }} />
                <span className="truncate text-sm font-semibold text-zinc-900">{bestMatch.opponent.name}</span>
              </div>
              <p className="mt-0.5 text-xs text-zinc-400">
                {new Date(bestMatch.date).toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" })}
              </p>
              <div className="mt-auto pt-3 flex items-baseline gap-2">
                {bestMatch.goals > 0 && (
                  <span className="text-2xl font-black text-zinc-900">
                    <CountUp value={bestMatch.goals} />
                    <span className="ml-1 text-sm font-semibold text-orange-500">{goalLabel(bestMatch.goals)}</span>
                  </span>
                )}
                {bestMatch.assists > 0 && (
                  <span className="text-sm text-zinc-400">{bestMatch.assists}A</span>
                )}
              </div>
            </Link>
          )}

          {favoritePartner && (
            <Link
              href={`/gracze/${favoritePartner.id}`}
              className="flex flex-col rounded-xl border border-zinc-200 border-t-2 border-t-zinc-300 bg-white p-4 transition-colors hover:bg-zinc-50"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Deadly Duo</p>
              <p className="mt-2 truncate text-sm font-semibold text-zinc-900 leading-tight">
                {favoritePartner.firstName} {favoritePartner.lastName}
              </p>
              <div className="mt-auto pt-3">
                <span className="text-2xl font-black text-zinc-900">
                  <CountUp value={favoritePartner.count} />
                  <span className="ml-1 text-sm font-semibold text-zinc-400">{actionLabel(favoritePartner.count)}</span>
                </span>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* Per-season breakdown */}
      {player.seasons.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Statystyki sezonowe</h2>
          <div className="overflow-hidden rounded-xl border border-zinc-200 border-t-2 border-t-orange-500 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  <th className="px-4 py-3 text-left">Sezon</th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">Drużyna</th>
                  <th className="px-4 py-3 text-center w-14" title="Mecze">M</th>
                  <th className="px-4 py-3 text-center w-14" title="Gole">G</th>
                  <th className="px-4 py-3 text-center w-14" title="Asysty">A</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {player.seasons.map(({ season, team, played, goals, assists }) => (
                  <tr key={season.id} className="transition-colors hover:bg-zinc-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/gracze?sezon=${season.id}`}
                        className="font-medium text-zinc-700 hover:text-zinc-900 hover:underline"
                      >
                        {season.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {team ? (
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: team.color }} />
                          <span className="text-zinc-600">{team.name}</span>
                        </div>
                      ) : (
                        <span className="text-zinc-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-zinc-600">{played}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={goals > 0 ? "font-semibold text-zinc-900" : "text-zinc-400"}>{goals}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={assists > 0 ? "font-semibold text-zinc-900" : "text-zinc-400"}>{assists}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {player.seasons.length >= 2 && (
              <div className="border-t border-zinc-100 p-4">
                <SeasonChart
                  data={[...player.seasons].reverse().map(({ season, goals, assists, played }) => ({
                    seasonName: season.name,
                    goals,
                    assists,
                    played,
                  }))}
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Match history */}
      {player.matches.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Historia meczów</h2>
          <div className="overflow-hidden rounded-xl border border-zinc-200 border-t-2 border-t-orange-500 bg-white divide-y divide-zinc-100">
            {player.matches.map((m) => {
              const myScore  = m.isHome ? m.homeScore : m.awayScore
              const oppScore = m.isHome ? m.awayScore : m.homeScore
              const result   =
                myScore == null || oppScore == null ? null
                : myScore > oppScore ? "W"
                : myScore < oppScore ? "L"
                : "D"
              const resultCls = result === "W" ? "text-green-600" : result === "L" ? "text-red-500" : "text-zinc-400"
              const date = new Date(m.date).toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" })

              return (
                <Link
                  key={m.matchId}
                  href={`/mecze/${m.matchId}`}
                  className="block px-4 py-3 hover:bg-zinc-50 transition-colors"
                >
                  {/* Desktop: single-line layout */}
                  <div className="hidden sm:flex sm:items-center sm:gap-4">
                    <div className="w-24 shrink-0 text-xs text-zinc-400">{date}</div>
                    <div className="flex flex-1 items-center gap-2 min-w-0">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: m.opponent.color }} />
                      <span className="truncate text-sm text-zinc-700">{m.opponent.name}</span>
                    </div>
                    {result && <span className={`shrink-0 w-6 text-center text-xs font-bold ${resultCls}`}>{result}</span>}
                    {m.homeScore != null && (
                      <span className="shrink-0 w-12 text-center text-sm font-semibold tabular-nums text-zinc-700">
                        {m.homeScore}:{m.awayScore}
                      </span>
                    )}
                    <div className="shrink-0 flex items-center gap-1.5 text-xs">
                      {m.goals > 0 && <span className="rounded-full bg-orange-500 px-2 py-0.5 font-semibold text-white">{m.goals}G</span>}
                      {m.assists > 0 && <span className="rounded-full border border-zinc-200 px-2 py-0.5 font-semibold text-zinc-600">{m.assists}A</span>}
                    </div>
                    <span className="text-zinc-300 text-sm">›</span>
                  </div>

                  {/* Mobile: 2-line layout */}
                  <div className="sm:hidden">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: m.opponent.color }} />
                      <span className="flex-1 truncate text-sm font-medium text-zinc-700">{m.opponent.name}</span>
                      {result && (
                        <span className={`shrink-0 text-xs font-bold tabular-nums ${resultCls}`}>
                          {m.homeScore != null ? `${m.homeScore}:${m.awayScore}` : result}
                        </span>
                      )}
                      <span className="text-zinc-300 text-sm">›</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 pl-4">
                      <span className="text-[11px] text-zinc-400">{date}</span>
                      {m.goals > 0 && <span className="rounded-full bg-orange-500 px-1.5 py-px text-[11px] font-semibold text-white">{m.goals}G</span>}
                      {m.assists > 0 && <span className="rounded-full border border-zinc-200 px-1.5 py-px text-[11px] font-semibold text-zinc-600">{m.assists}A</span>}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

function FormArrow({ form }: { form: PlayerForm | undefined }) {
  if (!form) return null
  if (form === "up")   return <span className="text-xl font-black leading-none text-orange-500" title="Forma w górę">▲</span>
  if (form === "down") return <span className="text-xl font-black leading-none text-red-500" title="Forma w dół">▼</span>
  return <span className="text-xl font-black leading-none text-zinc-400" title="Forma stabilna">—</span>
}

function StatCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="text-3xl font-bold text-zinc-900"><CountUp value={value} /></p>
      <p className="mt-0.5 text-xs text-zinc-400">{label}</p>
    </div>
  )
}

function goalLabel(n: number) {
  if (n === 1) return "gol"
  if (n >= 2 && n <= 4) return "gole"
  return "goli"
}

function actionLabel(n: number) {
  if (n === 1) return "akcja"
  if (n >= 2 && n <= 4) return "akcje"
  return "akcji"
}
