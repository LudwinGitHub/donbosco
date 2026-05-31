import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { verifySession } from "@/lib/dal"
import { prisma } from "@/lib/prisma"
import { activateSeason, deactivateSeason } from "@/app/actions/seasons"
import { deleteTeam, addPlayerToTeam, removePlayerFromTeam } from "@/app/actions/teams"
import CreateTeamForm from "./create-team-form"

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export default async function SeasonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await verifySession()
  if (session.role !== "ORGANIZER") redirect("/mecze")

  const { id } = await params

  const season = await prisma.season.findUnique({
    where: { id },
    include: {
      teams: {
        include: {
          teamPlayers: { include: { player: true } },
        },
        orderBy: { name: "asc" },
      },
    },
  })

  if (!season) notFound()

  const assignedPlayerIds = season.teams.flatMap((t) =>
    t.teamPlayers.map((tp) => tp.playerId)
  )

  const availablePlayers = await prisma.player.findMany({
    where: { id: { notIn: assignedPlayerIds } },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  })

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <Link href="/panel/sezony" className="hover:text-zinc-600 transition-colors">
          Sezony
        </Link>
        <span>›</span>
        <span>{season.name}</span>
      </div>

      {/* Season header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{season.name}</h1>
            {season.isActive && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                Aktywny
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            {formatDate(season.startDate)}
            {season.endDate ? ` – ${formatDate(season.endDate)}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          {!season.isActive ? (
            <form action={activateSeason.bind(null, season.id)}>
              <button
                type="submit"
                className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
              >
                Aktywuj
              </button>
            </form>
          ) : (
            <form action={deactivateSeason.bind(null, season.id)}>
              <button
                type="submit"
                className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
              >
                Dezaktywuj
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Teams section */}
      <div className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Drużyny
        </h2>

        {season.teams.map((team) => (
          <div
            key={team.id}
            className="rounded-xl border border-zinc-200 bg-white overflow-hidden"
          >
            {/* Team header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100 bg-zinc-50">
              <span
                className="h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: team.color }}
              />
              <span className="font-semibold flex-1">{team.name}</span>
              <span className="text-xs text-zinc-400">
                {team.teamPlayers.length} graczy
              </span>
              <form action={deleteTeam.bind(null, team.id, season.id)}>
                <button
                  type="submit"
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50"
                >
                  Usuń
                </button>
              </form>
            </div>

            {/* Players list */}
            <div className="divide-y divide-zinc-100">
              {team.teamPlayers.map((tp) => (
                <div key={tp.playerId} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="flex-1 text-sm">
                    {tp.player.firstName} {tp.player.lastName}
                  </span>
                  <form action={removePlayerFromTeam.bind(null, team.id, tp.playerId, season.id)}>
                    <button
                      type="submit"
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50"
                    >
                      Usuń
                    </button>
                  </form>
                </div>
              ))}
              {team.teamPlayers.length === 0 && (
                <p className="px-4 py-3 text-sm text-zinc-400">Brak graczy.</p>
              )}
            </div>

            {/* Add player to this team */}
            {availablePlayers.length > 0 && (
              <div className="border-t border-zinc-100 px-4 py-3">
                <form action={addPlayerToTeam.bind(null, undefined)}>
                  <input type="hidden" name="teamId" value={team.id} />
                  <input type="hidden" name="seasonId" value={season.id} />
                  <div className="flex gap-2">
                    <select
                      name="playerId"
                      className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
                    >
                      {availablePlayers.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.lastName} {p.firstName}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
                    >
                      Dodaj
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        ))}

        {season.teams.length === 0 && (
          <p className="text-sm text-zinc-400">Brak drużyn w tym sezonie.</p>
        )}

        {/* Create new team form */}
        <CreateTeamForm seasonId={season.id} />
      </div>
    </div>
  )
}
