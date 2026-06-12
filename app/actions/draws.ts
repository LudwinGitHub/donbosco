"use server"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { verifySession, getOptionalSession } from "@/lib/dal"
import type { BalancedTeams } from "@/lib/team-balancer"

const VOTE_WINDOW_OPEN_MS  = 3.5 * 60 * 60 * 1000  // opens 3.5h before match (17:00 for 20:30)
const VOTE_WINDOW_CLOSE_MS = 0.5 * 60 * 60 * 1000  // closes 30min before match (20:00 for 20:30)

export async function saveMatchDraw(
  matchId: string,
  optionA: BalancedTeams,
  optionB: BalancedTeams
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await verifySession()
    if (session.role !== "ORGANIZER") return { success: false, error: "Brak uprawnień" }

    const data = {
      optionATeam1:   optionA.teamA.map((p) => p.id),
      optionATeam2:   optionA.teamB.map((p) => p.id),
      optionARating1: optionA.ratingA,
      optionARating2: optionA.ratingB,
      optionBTeam1:   optionB.teamA.map((p) => p.id),
      optionBTeam2:   optionB.teamB.map((p) => p.id),
      optionBRating1: optionB.ratingA,
      optionBRating2: optionB.ratingB,
    }

    await prisma.$transaction(async (tx) => {
      const existing = await tx.matchDraw.findUnique({ where: { matchId } })
      if (existing) {
        await tx.drawVote.deleteMany({ where: { matchId } })
        await tx.matchDraw.update({ where: { matchId }, data })
      } else {
        await tx.matchDraw.create({ data: { matchId, ...data } })
      }
    })

    revalidatePath(`/mecze/${matchId}`)
    revalidatePath("/glosowanie")
    return { success: true }
  } catch {
    return { success: false, error: "Błąd zapisu" }
  }
}

export async function castDrawVote(
  matchId: string,
  choice: "A" | "B" | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getOptionalSession()
    if (!session) return { success: false, error: "Musisz być zalogowany" }

    const draw = await prisma.matchDraw.findUnique({
      where:   { matchId },
      include: {
        match:  { select: { scheduledAt: true, status: true } },
        _count: { select: { votes: true } },
      },
    })
    if (!draw) return { success: false, error: "Brak losowania dla tego meczu" }

    const now          = new Date()
    const scheduledAt  = draw.match.scheduledAt
    const windowOpen   = new Date(scheduledAt.getTime() - VOTE_WINDOW_OPEN_MS)
    const windowClose  = new Date(scheduledAt.getTime() - VOTE_WINDOW_CLOSE_MS)

    if (now < windowOpen)   return { success: false, error: "Głosowanie jeszcze nie otwarte" }
    if (now >= windowClose) return { success: false, error: "Głosowanie zakończone" }

    const existing = await prisma.drawVote.findUnique({
      where: { matchId_userId: { matchId, userId: session.userId } },
    })

    if (!existing && choice !== null && draw._count.votes >= 14) {
      return { success: false, error: "Osiągnięto limit 14 głosów" }
    }

    if (choice === null || (existing && existing.choice === choice)) {
      if (existing) {
        await prisma.drawVote.delete({
          where: { matchId_userId: { matchId, userId: session.userId } },
        })
      }
    } else {
      await prisma.drawVote.upsert({
        where:  { matchId_userId: { matchId, userId: session.userId } },
        create: { matchId, userId: session.userId, choice },
        update: { choice },
      })
    }

    revalidatePath(`/mecze/${matchId}`)
    revalidatePath("/glosowanie")
    return { success: true }
  } catch {
    return { success: false, error: "Błąd zapisu głosu" }
  }
}
