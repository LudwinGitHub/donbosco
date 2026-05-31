"use server"
import { revalidatePath } from "next/cache"
import { verifySession } from "@/lib/dal"
import { prisma } from "@/lib/prisma"

async function requireOrganizer() {
  const session = await verifySession()
  if (session.role !== "ORGANIZER") throw new Error("Brak uprawnień.")
  return session
}

export async function markPaymentPaid(matchId: string, userId: string) {
  await requireOrganizer()
  await prisma.matchPayment.update({
    where:  { matchId_userId: { matchId, userId } },
    data:   { status: "PAID", paidAt: new Date() },
  })
  revalidatePath(`/panel/mecze/${matchId}/platnosci`)
  revalidatePath("/moj-profil")
  revalidatePath(`/mecze/${matchId}`)
}

export async function markPaymentUnpaid(matchId: string, userId: string) {
  await requireOrganizer()
  await prisma.matchPayment.update({
    where:  { matchId_userId: { matchId, userId } },
    data:   { status: "UNPAID", paidAt: null },
  })
  revalidatePath(`/panel/mecze/${matchId}/platnosci`)
  revalidatePath("/moj-profil")
  revalidatePath(`/mecze/${matchId}`)
}

export async function markPaymentExempt(matchId: string, userId: string) {
  await requireOrganizer()
  await prisma.matchPayment.update({
    where:  { matchId_userId: { matchId, userId } },
    data:   { status: "EXEMPT", paidAt: null },
  })
  revalidatePath(`/panel/mecze/${matchId}/platnosci`)
  revalidatePath("/moj-profil")
  revalidatePath(`/mecze/${matchId}`)
}

export async function updatePaymentAmount(matchId: string, userId: string, amount: number) {
  await requireOrganizer()
  if (amount < 0) throw new Error("Kwota nie może być ujemna.")
  await prisma.matchPayment.update({
    where: { matchId_userId: { matchId, userId } },
    data:  { amount },
  })
  revalidatePath(`/panel/mecze/${matchId}/platnosci`)
}
