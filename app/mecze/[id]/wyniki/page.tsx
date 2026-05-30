import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { verifySession } from "@/lib/dal"
import { prisma } from "@/lib/prisma"
import { type GoalInput } from "@/app/actions/matches"
import ResultsForm from "./results-form"

export default async function MatchResultsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await verifySession()
  if (session.role !== "ORGANIZER") redirect("/logowanie")

  const { id } = await params

  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      homeTeam: true,
      awayTeam: true,
      goals: { orderBy: { minute: "asc" } },
    },
  })

  if (!match) notFound()

  const [homePlayers, awayPlayers] = await Promise.all([
    prisma.teamPlayer.findMany({
      where: { teamId: match.homeTeamId },
      include: { player: true },
      orderBy: { player: { lastName: "asc" } },
    }),
    prisma.teamPlayer.findMany({
      where: { teamId: match.awayTeamId },
      include: { player: true },
      orderBy: { player: { lastName: "asc" } },
    }),
  ])

  const homeTeam = {
    ...match.homeTeam,
    players: homePlayers.map((tp) => tp.player),
  }
  const awayTeam = {
    ...match.awayTeam,
    players: awayPlayers.map((tp) => tp.player),
  }

  const initialGoals: GoalInput[] = match.goals.map((g) => ({
    teamId: g.teamId,
    scorerId: g.scorerId,
    assisterId: g.assisterId ?? "",
    minute: g.minute != null ? String(g.minute) : "",
    isOwnGoal: g.isOwnGoal,
  }))

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <Link href="/mecze" className="hover:text-zinc-600 transition-colors">
          Mecze
        </Link>
        <span>›</span>
        <Link href={`/mecze/${id}`} className="hover:text-zinc-600 transition-colors">
          {match.homeTeam.name} vs {match.awayTeam.name}
        </Link>
        <span>›</span>
        <span>Wyniki</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Wpisz wyniki</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {new Date(match.scheduledAt).toLocaleDateString("pl-PL", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
          {match.round != null && ` · Kolejka ${match.round}`}
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <ResultsForm
          matchId={id}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          initialHomeScore={match.homeScore}
          initialAwayScore={match.awayScore}
          initialGoals={initialGoals}
        />
      </div>
    </div>
  )
}
