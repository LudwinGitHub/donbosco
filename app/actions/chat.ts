"use server"
import { prisma } from "@/lib/prisma"
import { verifySession, getOptionalSession } from "@/lib/dal"
import { sendPushToAllExcept } from "@/lib/push"

export type ChatFormState = { error?: string } | undefined

export async function getChatMessages() {
  const [session, messages] = await Promise.all([
    getOptionalSession(),
    prisma.chatMessage.findMany({
      orderBy: { createdAt: "asc" },
      take: 100,
      include: { user: { select: { firstName: true, lastName: true } } },
    }),
  ])
  return {
    messages,
    currentUserId: session?.userId ?? null,
    isOrganizer: session?.role === "ORGANIZER",
  }
}

export async function sendChatMessage(
  state: ChatFormState,
  formData: FormData
): Promise<ChatFormState> {
  const session = await verifySession()
  const text = ((formData.get("text") as string) ?? "").trim()
  if (!text) return { error: "Wiadomość nie może być pusta." }
  if (text.length > 500) return { error: "Wiadomość może mieć maksymalnie 500 znaków." }

  const cooldown = new Date(Date.now() - 30 * 60 * 1000)
  const [recentCount, user] = await Promise.all([
    prisma.chatMessage.count({ where: { createdAt: { gte: cooldown } } }),
    prisma.user.findUnique({ where: { id: session.userId }, select: { firstName: true } }),
  ])

  await prisma.chatMessage.create({ data: { text, userId: session.userId } })

  if (recentCount === 0) {
    await sendPushToAllExcept(session.userId, {
      title: `💬 ${user?.firstName ?? "Ktoś"} napisał na czacie`,
      body:  text.length > 80 ? text.slice(0, 77) + "…" : text,
      url:   "/",
    })
  }

  return undefined
}

export async function deleteChatMessage(id: string): Promise<void> {
  const session = await verifySession()
  const msg = await prisma.chatMessage.findUnique({ where: { id } })
  if (!msg) return
  if (msg.userId !== session.userId && session.role !== "ORGANIZER") return
  await prisma.chatMessage.delete({ where: { id } })
}
