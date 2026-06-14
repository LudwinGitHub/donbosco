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

  const now   = new Date()
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000)

  const pending = await prisma.matchRegistration.findMany({
    where: {
      status: "PENDING",
      match:  { status: "SCHEDULED", scheduledAt: { gte: now, lte: in48h } },
    },
    include: {
      match: {
        include: {
          homeTeam: { select: { name: true } },
          awayTeam: { select: { name: true } },
        },
      },
    },
  })

  if (pending.length === 0) return NextResponse.json({ sent: 0 })

  await Promise.allSettled(
    pending.map((reg) =>
      sendPushToUser(reg.userId, {
        title: "⚠️ Potwierdź obecność na meczu!",
        body:  `${reg.match.homeTeam.name} vs ${reg.match.awayTeam.name} — potwierdź jak najszybciej`,
        url:   `/mecze/${reg.matchId}`,
      })
    )
  )

  return NextResponse.json({ sent: pending.length })
}
