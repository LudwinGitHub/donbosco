import { processMatchDeadlines } from "@/lib/deadlines"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const secret = req.headers.get("x-cron-secret")
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const matches = await prisma.match.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: { gt: now },
      OR: [{ phase1Processed: false }, { phase2Processed: false }],
    },
    select: { id: true },
  })

  await Promise.allSettled(matches.map((m) => processMatchDeadlines(m.id)))

  return Response.json({ ok: true, processed: matches.length })
}
