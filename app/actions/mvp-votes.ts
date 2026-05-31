"use server"
import { revalidatePath } from "next/cache"
import { verifySession } from "@/lib/dal"
import { prisma } from "@/lib/prisma"

export async function castMvpVote(matchId: string, nomineeId: string) {
  const session = await verifySession()

  const match = await prisma.match.findUnique({ where: { id: matchId } })
  if (!match || match.status !== "PLAYED") throw new Error("Mecz nie jest zakończony.")

  // Voter must have been in the lineup
  const voterInLineup = await prisma.matchLineup.findFirst({
    where: { matchId, player: { userId: session.userId } },
  })
  if (!voterInLineup) throw new Error("Nie brałeś udziału w tym meczu.")

  // Nominee must have been in the lineup
  const nomineeInLineup = await prisma.matchLineup.findFirst({
    where: { matchId, playerId: nomineeId },
  })
  if (!nomineeInLineup) throw new Error("Wskazany gracz nie grał w tym meczu.")

  // Can't vote for yourself
  if (voterInLineup.playerId === nomineeId) throw new Error("Nie możesz głosować na siebie.")

  await prisma.matchMvpVote.upsert({
    where:  { matchId_voterId: { matchId, voterId: session.userId } },
    create: { matchId, voterId: session.userId, nomineeId },
    update: { nomineeId },
  })

  revalidatePath(`/mecze/${matchId}`)
}

export async function removeMvpVote(matchId: string) {
  const session = await verifySession()
  await prisma.matchMvpVote.deleteMany({
    where: { matchId, voterId: session.userId },
  })
  revalidatePath(`/mecze/${matchId}`)
}
