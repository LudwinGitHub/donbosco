import Link from "next/link"
import { notFound } from "next/navigation"
import { getPlayerProfile, getPlayerForms, type PlayerForm } from "@/lib/players"
import { getActiveBadges } from "@/lib/badges"
import BadgeChip from "@/app/ui/badge-chip"

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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <Link href="/gracze" className="hover:text-zinc-600 transition-colors">Gracze</Link>
        <span>›</span>
        <span className="text-zinc-600">{player.firstName} {player.lastName}</span>
      </div>

      {/* Hero */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
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
        <div className={`mt-5 grid gap-4 border-t border-zinc-100 pt-5 ${player.totalMvp > 0 ? "grid-cols-4" : "grid-cols-3"}`}>
          <StatCell label="Mecze"  value={player.totalPlayed} />
          <StatCell label="Gole"   value={player.totalGoals} />
          <StatCell label="Asysty" value={player.totalAssists} />
          {player.totalMvp > 0 && <StatCell label="MVP" value={player.totalMvp} />}
        </div>
      </div>

      {/* Per-season breakdown */}
      {player.seasons.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Statystyki sezonowe</h2>
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
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
          </div>
        </section>
      )}

      {/* Match history */}
      {player.matches.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Historia meczów</h2>
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white divide-y divide-zinc-100">
            {player.matches.map((m) => {
              const myScore  = m.isHome ? m.homeScore : m.awayScore
              const oppScore = m.isHome ? m.awayScore : m.homeScore
              const result   =
                myScore == null || oppScore == null ? null
                : myScore > oppScore ? "W"
                : myScore < oppScore ? "L"
                : "D"

              return (
                <Link
                  key={m.matchId}
                  href={`/mecze/${m.matchId}`}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-zinc-50 transition-colors"
                >
                  <div className="w-24 shrink-0 text-xs text-zinc-400">
                    {new Date(m.date).toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" })}
                  </div>

                  <div className="flex flex-1 items-center gap-2 min-w-0">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: m.opponent.color }} />
                    <span className="truncate text-sm text-zinc-700">{m.opponent.name}</span>
                  </div>

                  {result && (
                    <span className={`shrink-0 w-6 text-center text-xs font-bold ${
                      result === "W" ? "text-green-600"
                      : result === "L" ? "text-red-500"
                      : "text-zinc-400"
                    }`}>
                      {result}
                    </span>
                  )}

                  {m.homeScore != null && (
                    <span className="shrink-0 w-12 text-center text-sm font-semibold tabular-nums text-zinc-700">
                      {m.homeScore}:{m.awayScore}
                    </span>
                  )}

                  <div className="shrink-0 flex items-center gap-2 text-xs">
                    {m.goals > 0 && (
                      <span className="rounded-full bg-orange-500 px-2 py-0.5 font-semibold text-white">
                        {m.goals}G
                      </span>
                    )}
                    {m.assists > 0 && (
                      <span className="rounded-full border border-zinc-200 px-2 py-0.5 font-semibold text-zinc-600">
                        {m.assists}A
                      </span>
                    )}
                  </div>

                  <span className="text-zinc-300 text-sm">›</span>
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
      <p className="text-3xl font-bold text-zinc-900">{value}</p>
      <p className="mt-0.5 text-xs text-zinc-400">{label}</p>
    </div>
  )
}
