import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getStandings, type FormResult } from "@/lib/standings"
import { getPlayersWithStats } from "@/lib/players"

export default async function TeamPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const team = await prisma.team.findUnique({
    where: { id },
    include: { season: { select: { id: true, name: true } } },
  })

  if (!team) notFound()

  const [standings, allPlayers, matches] = await Promise.all([
    getStandings(team.seasonId),
    getPlayersWithStats(team.seasonId),
    prisma.match.findMany({
      where: {
        seasonId: team.seasonId,
        status: "PLAYED",
        OR: [{ homeTeamId: id }, { awayTeamId: id }],
      },
      include: {
        homeTeam: { select: { id: true, name: true, color: true } },
        awayTeam: { select: { id: true, name: true, color: true } },
      },
      orderBy: { scheduledAt: "desc" },
    }),
  ])

  const standingRow = standings.find(r => r.teamId === id) ?? null
  const position    = standingRow ? standings.indexOf(standingRow) + 1 : null

  const teamPlayers = allPlayers
    .filter(p => p.team?.id === id)
    .sort((a, b) => b.goals - a.goals || b.assists - a.assists || b.played - a.played)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <span className="h-4 w-4 rounded-full shrink-0 border border-zinc-200" style={{ backgroundColor: team.color }} />
          <h1 className="text-2xl font-bold">{team.name}</h1>
        </div>
        <p className="mt-0.5 text-sm text-zinc-500">{team.season.name}</p>
      </div>

      {/* Standing stats */}
      {standingRow && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Miejsce"     value={`${position}.`} />
          <StatCard label="Punkty"      value={String(standingRow.points)} highlight />
          <StatCard label="Bilans W/R/P" value={`${standingRow.won}/${standingRow.drawn}/${standingRow.lost}`} />
          <StatCard label="Bramki"      value={`${standingRow.goalsFor}:${standingRow.goalsAgainst}`} />
        </div>
      )}

      {/* Form */}
      {standingRow && standingRow.form.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Forma</span>
          <div className="flex gap-1.5">
            {standingRow.form.map((r, i) => <FormDot key={i} result={r} />)}
          </div>
        </div>
      )}

      {/* Players table */}
      {teamPlayers.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-100 bg-zinc-50 px-4 py-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Skład · {teamPlayers.length} zawodników
            </h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                <th className="px-4 py-2 text-right w-8">#</th>
                <th className="px-4 py-2 text-left">Zawodnik</th>
                <th className="px-4 py-2 text-center w-14" title="Mecze">M</th>
                <th className="px-4 py-2 text-center w-14" title="Gole">G</th>
                <th className="px-4 py-2 text-center w-14" title="Asysty">A</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {teamPlayers.map((p, i) => (
                <tr key={p.id} className="transition-colors hover:bg-zinc-50">
                  <td className="px-4 py-2.5 text-right text-xs text-zinc-300">{i + 1}</td>
                  <td className="px-4 py-2.5">
                    <Link href={`/gracze/${p.id}`} className="font-medium text-zinc-900 hover:underline">
                      {p.firstName} {p.lastName}
                    </Link>
                    {p.nickname && (
                      <span className="ml-1 text-xs text-zinc-400">„{p.nickname}"</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-center text-zinc-600">{p.played}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={p.goals > 0 ? "font-semibold text-zinc-900" : "text-zinc-400"}>
                      {p.goals}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={p.assists > 0 ? "font-semibold text-zinc-900" : "text-zinc-400"}>
                      {p.assists}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Matches */}
      {matches.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-100 bg-zinc-50 px-4 py-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Mecze · {matches.length}
            </h2>
          </div>
          <div className="divide-y divide-zinc-100">
            {matches.map(m => {
              const isHome = m.homeTeamId === id
              const hs  = m.homeScore ?? 0
              const as_ = m.awayScore ?? 0
              const result = isHome
                ? (hs > as_ ? "W" : hs < as_ ? "P" : "R")
                : (as_ > hs ? "W" : as_ < hs ? "P" : "R")
              const resultCls =
                result === "W" ? "bg-green-100 text-green-700" :
                result === "P" ? "bg-red-100 text-red-600" :
                "bg-zinc-100 text-zinc-500"
              return (
                <Link
                  key={m.id}
                  href={`/mecze/${m.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-zinc-50"
                >
                  <span className={`w-5 shrink-0 rounded text-center text-[11px] font-bold leading-5 ${resultCls}`}>
                    {result}
                  </span>
                  <div className="flex flex-1 items-center gap-2 min-w-0">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: m.homeTeam.color }} />
                    <span className={`truncate text-sm ${m.homeTeamId === id ? "font-semibold text-zinc-900" : "text-zinc-600"}`}>
                      {m.homeTeam.name}
                    </span>
                  </div>
                  <span className="shrink-0 text-sm font-bold tabular-nums">
                    {m.homeScore}:{m.awayScore}
                  </span>
                  <div className="flex flex-1 items-center gap-2 justify-end min-w-0">
                    <span className={`truncate text-right text-sm ${m.awayTeamId === id ? "font-semibold text-zinc-900" : "text-zinc-600"}`}>
                      {m.awayTeam.name}
                    </span>
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: m.awayTeam.color }} />
                  </div>
                  <span className="shrink-0 text-xs text-zinc-400">{fmtDate(m.scheduledAt)}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      <Link href="/" className="inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-900">
        ← Tabela ligowa
      </Link>
    </div>
  )
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{label}</p>
      <p className={`mt-1 text-2xl font-black ${highlight ? "text-orange-500" : "text-zinc-900"}`}>{value}</p>
    </div>
  )
}

function FormDot({ result }: { result: FormResult }) {
  const styles: Record<FormResult, string> = { W: "bg-green-500", D: "bg-zinc-300", L: "bg-red-400" }
  const titles: Record<FormResult, string> = { W: "Wygrana", D: "Remis", L: "Porażka" }
  return <span title={titles[result]} className={`h-2.5 w-2.5 rounded-full ${styles[result]}`} />
}

function fmtDate(date: Date) {
  return new Date(date).toLocaleDateString("pl-PL", { day: "numeric", month: "short" })
}
