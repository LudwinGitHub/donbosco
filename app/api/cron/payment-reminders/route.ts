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

  // Find matches played yesterday with UNPAID payments
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const start = new Date(yesterday)
  start.setHours(0, 0, 0, 0)
  const end = new Date(yesterday)
  end.setHours(23, 59, 59, 999)

  const unpaid = await prisma.matchPayment.findMany({
    where: {
      status: "UNPAID",
      match: {
        status:   "PLAYED",
        playedAt: { gte: start, lte: end },
      },
    },
    include: {
      match: { include: { homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } } } },
    },
  })

  if (unpaid.length === 0) return NextResponse.json({ sent: 0 })

  await Promise.allSettled(
    unpaid.map((p) =>
      sendPushToUser(p.userId, {
        title: "Pamiętaj o płatności za mecz 💳",
        body:  `${p.match.homeTeam.name} vs ${p.match.awayTeam.name} — ${p.amount} zł · BLIK: 600 068 826`,
        url:   `/mecze/${p.matchId}`,
      })
    )
  )

  return NextResponse.json({ sent: unpaid.length })
}
