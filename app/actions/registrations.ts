"use server"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { verifySession } from "@/lib/dal"
import { sendPushToUser } from "@/lib/push"

export async function signUp(matchId: string) {
  const session = await verifySession()

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { status: true, playerLimit: true },
  })
  if (!match) throw new Error("Mecz nie istnieje.")
  if (match.status !== "SCHEDULED") throw new Error("Zapisy na ten mecz są zamknięte.")

  const existing = await prisma.matchRegistration.findUnique({
    where: { matchId_userId: { matchId, userId: session.userId } },
  })
  if (existing) return

  const confirmedCount = await prisma.matchRegistration.count({
    where: { matchId, status: "CONFIRMED" },
  })
  const status = confirmedCount < match.playerLimit ? "CONFIRMED" : "WAITLIST"

  await prisma.matchRegistration.create({
    data: { matchId, userId: session.userId, status },
  })

  revalidatePath(`/mecze/${matchId}`)
}

export async function signOut(matchId: string) {
  const session = await verifySession()

  const registration = await prisma.matchRegistration.findUnique({
    where: { matchId_userId: { matchId, userId: session.userId } },
  })
  if (!registration) return

  let promotedUserId: string | null = null

  await prisma.$transaction(async (tx) => {
    await tx.matchRegistration.delete({ where: { id: registration.id } })

    if (registration.status === "CONFIRMED") {
      const firstWaiting = await tx.matchRegistration.findFirst({
        where: { matchId, status: "WAITLIST" },
        orderBy: { createdAt: "asc" },
      })
      if (firstWaiting) {
        await tx.matchRegistration.update({
          where: { id: firstWaiting.id },
          data: { status: "CONFIRMED" },
        })
        promotedUserId = firstWaiting.userId
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
        title: "Masz miejsce na meczu!",
        body: `Twoje miejsce na liście rezerwowej zostało potwierdzone — ${match.homeTeam.name} vs ${match.awayTeam.name}`,
        url: `/mecze/${matchId}`,
      }).catch(() => {})
    }
  }

  revalidatePath(`/mecze/${matchId}`)
}
