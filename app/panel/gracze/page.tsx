import { redirect } from "next/navigation"
import { verifySession } from "@/lib/dal"
import { prisma } from "@/lib/prisma"
import PlayersAdminTable from "./players-admin-table"

export default async function AdminPlayersPage() {
  const session = await verifySession()
  if (session.role !== "ORGANIZER") redirect("/")

  const [players, unlinkedUsers] = await Promise.all([
    prisma.player.findMany({
      include: {
        matchLineups: { select: { matchId: true } },
        goalsScored:  { where: { isOwnGoal: false }, select: { id: true } },
        user:         { select: { id: true, email: true, role: true } },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    prisma.user.findMany({
      where:   { player: null },
      select:  { id: true, email: true, firstName: true, lastName: true },
      orderBy: { lastName: "asc" },
    }),
  ])

  const playersData = players.map((p) => ({
    id:          p.id,
    firstName:   p.firstName,
    lastName:    p.lastName,
    nickname:    p.nickname,
    matchCount:  p.matchLineups.length,
    goalCount:   p.goalsScored.length,
    linkedUser:  p.user ? { id: p.user.id, email: p.user.email, role: p.user.role } : null,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gracze — zarządzanie</h1>
          <p className="mt-1 text-sm text-zinc-500">{players.length} graczy w bazie</p>
        </div>
      </div>
      <PlayersAdminTable players={playersData} unlinkedUsers={unlinkedUsers} />
    </div>
  )
}
