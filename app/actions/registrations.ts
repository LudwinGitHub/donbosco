"use server"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { verifySession } from "@/lib/dal"
import { sendPushToUser } from "@/lib/push"

export async function confirmPresence(matchId: string) {
  const session = await verifySession()

  const reg = await prisma.matchRegistration.findUnique({
    where: { matchId_userId: { matchId, userId: session.userId } },
  })
  if (!reg) throw new Error("Nie jesteś na liście tego meczu.")
  if (reg.status !== "PENDING") return

  await prisma.matchRegistration.update({
    where: { id: reg.id },
    data: { status: "CONFIRMED", confirmedAt: new Date() },
  })

  revalidatePath(`/mecze/${matchId}`)
}

export async function declinePresence(matchId: string) {
  const session = await verifySession()

  const reg = await prisma.matchRegistration.findUnique({
    where: { matchId_userId: { matchId, userId: session.userId } },
  })
  if (!reg) return

  let promotedUserId: string | null = null

  await prisma.$transaction(async (tx) => {
    await tx.matchRegistration.delete({ where: { id: reg.id } })

    if (reg.status === "CONFIRMED" || reg.status === "PENDING") {
      const match = await tx.match.findUnique({
        where: { id: matchId },
        select: { playerLimit: true },
      })
      const confirmedCount = await tx.matchRegistration.count({
        where: { matchId, status: "CONFIRMED" },
      })
      if (match && confirmedCount < match.playerLimit) {
        const firstWaiting = await tx.matchRegistration.findFirst({
          where: { matchId, status: "WAITLIST" },
          orderBy: [{ slot: "asc" }, { createdAt: "asc" }],
        })
        if (firstWaiting) {
          await tx.matchRegistration.update({
            where: { id: firstWaiting.id },
            data: { status: "PENDING" },
          })
          promotedUserId = firstWaiting.userId
        }
      }
    }
  })

  if (promotedUserId) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { homeTeam: true, awayTeam: true },
    })
    if (match) {
      sendPushToUser(promotedUserId, {
        title: "🟠 Miejsce na meczu!",
        body: `Trafiłeś na listę w meczu ${match.homeTeam.name} vs ${match.awayTeam.name}. Potwierdź obecność!`,
        url: `/mecze/${matchId}`,
      }).catch(() => {})
    }
  }

  revalidatePath(`/mecze/${matchId}`)
}

export async function populateMatchFromGroupSlots(matchId: string): Promise<{ message?: string }> {
  const session = await verifySession()
  if (session.role !== "ORGANIZER") return { message: "Brak uprawnień." }

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { status: true, playerLimit: true },
  })
  if (!match || match.status !== "SCHEDULED") return { message: "Mecz nie jest zaplanowany." }

  const groupSlots = await prisma.matchGroupSlot.findMany({ orderBy: { position: "asc" } })
  if (groupSlots.length === 0) return { message: "Lista bazowa jest pusta. Dodaj graczy w /panel/sklad." }

  await prisma.matchRegistration.createMany({
    data: groupSlots.map((slot) => ({
      matchId,
      userId: slot.userId,
      status: slot.position <= match.playerLimit ? "PENDING" : "WAITLIST",
      slot: slot.position,
    })),
    skipDuplicates: true,
  })

  revalidatePath(`/mecze/${matchId}`)
  return {}
}

// Kept for organizer manual use
export async function signUp(matchId: string) {
  const session = await verifySession()
  if (session.role !== "ORGANIZER") return

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { status: true, playerLimit: true },
  })
  if (!match || match.status !== "SCHEDULED") return

  const existing = await prisma.matchRegistration.findUnique({
    where: { matchId_userId: { matchId, userId: session.userId } },
  })
  if (existing) return

  const confirmedCount = await prisma.matchRegistration.count({
    where: { matchId, status: "CONFIRMED" },
  })
  const status = confirmedCount < match.playerLimit ? "PENDING" : "WAITLIST"

  await prisma.matchRegistration.create({
    data: { matchId, userId: session.userId, status },
  })

  revalidatePath(`/mecze/${matchId}`)
}
