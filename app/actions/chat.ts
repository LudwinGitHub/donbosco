"use server"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { verifySession } from "@/lib/dal"

export type ChatFormState = { error?: string } | undefined

export async function sendChatMessage(
  state: ChatFormState,
  formData: FormData
): Promise<ChatFormState> {
  const session = await verifySession()
  const text = ((formData.get("text") as string) ?? "").trim()
  if (!text) return { error: "Wiadomość nie może być pusta." }
  if (text.length > 500) return { error: "Wiadomość może mieć maksymalnie 500 znaków." }

  await prisma.chatMessage.create({
    data: { text, userId: session.userId },
  })
  revalidatePath("/czat")
  return undefined
}

export async function deleteChatMessage(id: string): Promise<void> {
  const session = await verifySession()
  const msg = await prisma.chatMessage.findUnique({ where: { id } })
  if (!msg) return
  if (msg.userId !== session.userId && session.role !== "ORGANIZER") return
  await prisma.chatMessage.delete({ where: { id } })
  revalidatePath("/czat")
}
