"use server"
import { revalidatePath } from "next/cache"
import { verifySession } from "@/lib/dal"
import { prisma } from "@/lib/prisma"
import { sendPushToUser } from "@/lib/push"
import { sendEmail, paymentConfirmedEmail } from "@/lib/email"

async function requireOrganizer() {
  const session = await verifySession()
  if (session.role !== "ORGANIZER") throw new Error("Brak uprawnień.")
  return session
}

export async function markPaymentPaid(matchId: string, userId: string) {
  await requireOrganizer()

  const payment = await prisma.matchPayment.update({
    where:   { matchId_userId: { matchId, userId } },
    data:    { status: "PAID", paidAt: new Date() },
    include: { match: { include: { homeTeam: true, awayTeam: true } } },
  })

  sendPushToUser(userId, {
    title: "Płatność potwierdzona ✓",
    body:  `${payment.match.homeTeam.name} vs ${payment.match.awayTeam.name} — wpłata ${payment.amount} zł przyjęta`,
    url:   "/moj-profil?tab=platnosci",
  }).catch(() => {})

  prisma.user.findUnique({
    where:  { id: userId },
    select: { email: true, emailVerified: true },
  }).then((user) => {
    if (!user?.emailVerified) return
    const { subject, html } = paymentConfirmedEmail({
      homeTeam: payment.match.homeTeam.name,
      awayTeam: payment.match.awayTeam.name,
      amount:   payment.amount.toNumber(),
    })
    return sendEmail(user.email, subject, html)
  }).catch(() => {})

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
