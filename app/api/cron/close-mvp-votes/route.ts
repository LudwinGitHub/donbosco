import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendPushToUser } from "@/lib/push"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get("authorization")
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  const deadline = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)

  const matches = await prisma.match.findMany({
    where: {
      status:       "PLAYED",
      mvpPlayerId:  null,
      playedAt:     { lte: deadline },
    },
    select: {
      id: true,
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
      mvpVotes: {
        select: { nomineeId: true, voter: { select: { id: true } } },
      },
    },
  })

  let closed = 0

  for (const match of matches) {
    const voteCounts = new Map<string, number>()
    for (const v of match.mvpVotes) {
      voteCounts.set(v.nomineeId, (voteCounts.get(v.nomineeId) ?? 0) + 1)
    }

    let winnerId: string | null = null
    let maxVotes = 0
    for (const [nomineeId, count] of voteCounts) {
      if (count > maxVotes) { maxVotes = count; winnerId = nomineeId }
    }

    if (!winnerId || maxVotes <= 1) continue

    const winner = await prisma.player.findUnique({
      where: { id: winnerId },
      select: { id: true, firstName: true, lastName: true, userId: true },
    })
    if (!winner) continue

    await prisma.match.update({
      where: { id: match.id },
      data:  { mvpPlayerId: winner.id },
    })

    if (winner.userId) {
      sendPushToUser(winner.userId, {
        title: "Zostałeś MVP meczu! ⭐",
        body:  `${match.homeTeam.name} vs ${match.awayTeam.name} — gratulacje!`,
        url:   `/mecze/${match.id}`,
      }).catch(() => {})
    }

    closed++
  }

  return NextResponse.json({ closed })
}
