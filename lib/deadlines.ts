import { prisma } from "./prisma"
import { sendPushToUser } from "./push"
import { sendEmail } from "./email"

const TZ = "Europe/Warsaw"
const PLAYER_LIMIT = 14

export function getMatchDeadlines(scheduledAt: Date): { deadline1: Date; deadline2: Date } {
  // Get match date string in Warsaw timezone ("YYYY-MM-DD" via 'sv' locale)
  const matchDateStr = new Intl.DateTimeFormat("sv", { timeZone: TZ }).format(scheduledAt)
  const [y, m, d] = matchDateStr.split("-").map(Number)

  // Previous day: subtract 1 day safely using noon UTC
  const matchNoon = new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
  const prevNoon = new Date(matchNoon.getTime() - 24 * 60 * 60 * 1000)
  const prevDateStr = new Intl.DateTimeFormat("sv", { timeZone: TZ }).format(prevNoon)
  const [py, pm, pd] = prevDateStr.split("-").map(Number)

  // Determine Warsaw offset: probe 12:00 UTC → what hour does Warsaw show?
  const probeUtc = new Date(Date.UTC(py, pm - 1, pd, 12, 0, 0))
  const warsawHour = parseInt(
    new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "2-digit", hour12: false }).format(probeUtc),
    10
  )
  const offsetHours = warsawHour - 12 // 1 (CET/winter) or 2 (CEST/summer)

  const deadline1 = new Date(Date.UTC(py, pm - 1, pd, 12 - offsetHours, 0, 0, 0))
  const deadline2 = new Date(Date.UTC(py, pm - 1, pd, 15 - offsetHours, 0, 0, 0))

  return { deadline1, deadline2 }
}

export async function processMatchDeadlines(matchId: string): Promise<void> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      id: true, scheduledAt: true, playerLimit: true,
      phase1Processed: true, phase2Processed: true, status: true,
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
    },
  })

  if (!match || match.status !== "SCHEDULED") return

  const { deadline1, deadline2 } = getMatchDeadlines(match.scheduledAt)
  const now = new Date()

  if (now >= deadline1 && !match.phase1Processed) {
    await runDeadlinePhase(match, 1, deadline2)
  }
  if (now >= deadline2 && !match.phase2Processed) {
    await runDeadlinePhase(match, 2, null)
  }
}

async function runDeadlinePhase(
  match: { id: string; playerLimit: number; homeTeam: { name: string }; awayTeam: { name: string } },
  phase: 1 | 2,
  nextDeadline: Date | null
): Promise<void> {
  const phaseField = phase === 1 ? "phase1Processed" : "phase2Processed"

  // 1. Drop all PENDING registrations
  await prisma.matchRegistration.updateMany({
    where: { matchId: match.id, status: "PENDING" },
    data: { status: "DROPPED" },
  })

  // 2. Count free slots
  const confirmedCount = await prisma.matchRegistration.count({
    where: { matchId: match.id, status: "CONFIRMED" },
  })
  const freeSlots = Math.max(0, PLAYER_LIMIT - confirmedCount)

  // 3. Promote first N WAITLIST → PENDING (ordered by slot asc, then createdAt asc)
  const promoted: { id: string; userId: string }[] = []
  if (freeSlots > 0) {
    const toPromote = await prisma.matchRegistration.findMany({
      where: { matchId: match.id, status: "WAITLIST" },
      orderBy: [{ slot: "asc" }, { createdAt: "asc" }],
      take: freeSlots,
      select: { id: true, userId: true },
    })
    for (const reg of toPromote) {
      await prisma.matchRegistration.update({
        where: { id: reg.id },
        data: { status: "PENDING" },
      })
      promoted.push(reg)
    }
  }

  // 4. Mark phase as processed
  await prisma.match.update({
    where: { id: match.id },
    data: { [phaseField]: true },
  })

  // 5. Notify promoted users
  if (promoted.length === 0) return

  const matchName = `${match.homeTeam.name} vs ${match.awayTeam.name}`
  const deadlineStr = nextDeadline
    ? new Intl.DateTimeFormat("pl-PL", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(nextDeadline)
    : null
  const body = deadlineStr
    ? `Trafiłeś na listę grających w meczu ${matchName}! Potwierdź obecność do ${deadlineStr}.`
    : `Trafiłeś na listę grających w meczu ${matchName}! Potwierdź obecność jak najszybciej.`

  const users = await prisma.user.findMany({
    where: { id: { in: promoted.map((p) => p.userId) } },
    select: { id: true, email: true },
  })

  await Promise.allSettled([
    ...promoted.map((p) =>
      sendPushToUser(p.userId, {
        title: "🟠 Miejsce na meczu!",
        body,
        url: `/mecze/${match.id}`,
      })
    ),
    ...users.map((u) =>
      sendEmail(
        u.email,
        "Miejsce na meczu — potwierdź obecność",
        `<p>${body}</p><p><a href="${process.env.NEXT_PUBLIC_APP_URL}/mecze/${match.id}">Potwierdź tutaj →</a></p>`
      )
    ),
  ])
}
