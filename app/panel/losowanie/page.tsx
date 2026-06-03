import { redirect } from "next/navigation"
import { verifySession } from "@/lib/dal"
import { getPlayersWithStats } from "@/lib/players"
import { prisma } from "@/lib/prisma"
import TeamPicker from "./team-picker"

export default async function LosowaniePage() {
  const session = await verifySession()
  if (session.role !== "ORGANIZER") redirect("/")

  const [players, matches] = await Promise.all([
    getPlayersWithStats(),
    prisma.match.findMany({
      where:   { status: "SCHEDULED" },
      include: { homeTeam: true, awayTeam: true },
      orderBy: { scheduledAt: "asc" },
      take:    20,
    }),
  ])

  const playerData = players.map((p) => ({
    id:        p.id,
    firstName: p.firstName,
    lastName:  p.lastName,
    nickname:  p.nickname,
    played:    p.played,
    goals:     p.goals,
    assists:   p.assists,
  }))

  const matchData = matches.map((m) => ({
    id:           m.id,
    round:        m.round,
    scheduledAt:  m.scheduledAt.toISOString(),
    homeTeamName: m.homeTeam.name,
    awayTeamName: m.awayTeam.name,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Losowanie drużyn</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Zaznacz graczy, wygeneruj dwie opcje składów i opublikuj głosowanie dla meczu.
        </p>
      </div>
      <TeamPicker players={playerData} matches={matchData} />
    </div>
  )
}
