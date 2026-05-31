import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendPushToAll } from "@/lib/push"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get("authorization")
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  const now = new Date()
  const tomorrowStart = new Date(now)
  tomorrowStart.setDate(tomorrowStart.getDate() + 1)
  tomorrowStart.setHours(0, 0, 0, 0)

  const tomorrowEnd = new Date(tomorrowStart)
  tomorrowEnd.setHours(23, 59, 59, 999)

  const matches = await prisma.match.findMany({
    where: {
      status: "SCHEDULED",
      reminderSent: false,
      scheduledAt: { gte: tomorrowStart, lte: tomorrowEnd },
    },
    include: {
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
    },
  })

  if (matches.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  await Promise.all(
    matches.map(async (match) => {
      const timeStr = new Date(match.scheduledAt).toLocaleTimeString("pl-PL", {
        hour: "2-digit",
        minute: "2-digit",
      })

      await sendPushToAll({
        title: "Jutro mecz! ⚽",
        body:  `${match.homeTeam.name} vs ${match.awayTeam.name} · jutro o ${timeStr}`,
        url:   `/mecze/${match.id}`,
      })

      await prisma.match.update({
        where: { id: match.id },
        data:  { reminderSent: true },
      })
    })
  )

  return NextResponse.json({ sent: matches.length })
}
