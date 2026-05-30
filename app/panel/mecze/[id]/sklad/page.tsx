import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { verifySession } from "@/lib/dal"
import { prisma } from "@/lib/prisma"
import LineupForm from "./lineup-form"

export default async function SquadEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await verifySession()
  if (session.role !== "ORGANIZER") redirect("/logowanie")

  const { id } = await params

  const match = await prisma.match.findUnique({
    where:   { id },
    include: { homeTeam: true, awayTeam: true },
  })
  if (!match) notFound()

  const [homeTeamPlayers, awayTeamPlayers, currentLineup] = await Promise.all([
    prisma.teamPlayer.findMany({
      where:   { teamId: match.homeTeamId },
      include: { player: true },
      orderBy: { player: { lastName: "asc" } },
    }),
    prisma.teamPlayer.findMany({
      where:   { teamId: match.awayTeamId },
      include: { player: true },
      orderBy: { player: { lastName: "asc" } },
    }),
    prisma.matchLineup.findMany({
      where:   { matchId: id },
      include: { player: true },
    }),
  ])

  // Build player lists, merging teamPlayers with anyone already in the lineup
  const homeLineupSet = new Set(
    currentLineup.filter((l) => l.teamId === match.homeTeamId).map((l) => l.playerId)
  )
  const awayLineupSet = new Set(
    currentLineup.filter((l) => l.teamId === match.awayTeamId).map((l) => l.playerId)
  )

  const homePlayerMap = new Map(homeTeamPlayers.map((tp) => [tp.playerId, tp.player]))
  const awayPlayerMap = new Map(awayTeamPlayers.map((tp) => [tp.playerId, tp.player]))

  // Add lineup players that aren't in teamPlayers (legacy/orphaned)
  for (const l of currentLineup) {
    if (l.teamId === match.homeTeamId && !homePlayerMap.has(l.playerId)) {
      homePlayerMap.set(l.playerId, l.player)
    }
    if (l.teamId === match.awayTeamId && !awayPlayerMap.has(l.playerId)) {
      awayPlayerMap.set(l.playerId, l.player)
    }
  }

  const sortByName = (a: { lastName: string }, b: { lastName: string }) =>
    a.lastName.localeCompare(b.lastName, "pl")

  const homePlayers = [...homePlayerMap.values()].sort(sortByName)
  const awayPlayers = [...awayPlayerMap.values()].sort(sortByName)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <Link href="/mecze" className="hover:text-zinc-600 transition-colors">Mecze</Link>
        <span>›</span>
        <Link href={`/mecze/${id}`} className="hover:text-zinc-600 transition-colors">
          {match.homeTeam.name} vs {match.awayTeam.name}
        </Link>
        <span>›</span>
        <span>Skład</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Edytuj skład</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {new Date(match.scheduledAt).toLocaleDateString("pl-PL", {
            day: "numeric", month: "long", year: "numeric",
          })}
          {match.round != null && ` · Kolejka ${match.round}`}
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <LineupForm
          matchId={id}
          homeTeam={match.homeTeam}
          awayTeam={match.awayTeam}
          homePlayers={homePlayers}
          awayPlayers={awayPlayers}
          initialHomeLineup={homeLineupSet}
          initialAwayLineup={awayLineupSet}
        />
      </div>
    </div>
  )
}
