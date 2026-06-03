"use server"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { verifySession } from "@/lib/dal"
import { sendPushToAll } from "@/lib/push"
import { sendEmailToMany, urgentAnnouncementEmail } from "@/lib/email"

export type AnnouncementFormState = { error?: string } | undefined

export async function addAnnouncement(
  state: AnnouncementFormState,
  formData: FormData
): Promise<AnnouncementFormState> {
  const session = await verifySession()
  if (session.role !== "ORGANIZER") return { error: "Brak uprawnień." }

  const title    = ((formData.get("title")    as string) ?? "").trim()
  const content  = ((formData.get("content")  as string) ?? "").trim()
  const isPinned = formData.get("isPinned") === "on"
  const rawPriority = formData.get("priority") as string
  const priority = ["NORMAL", "IMPORTANT", "URGENT"].includes(rawPriority)
    ? (rawPriority as "NORMAL" | "IMPORTANT" | "URGENT")
    : "NORMAL"

  if (!title)   return { error: "Tytuł nie może być pusty." }
  if (!content) return { error: "Treść nie może być pusta." }
  if (title.length > 100)    return { error: "Tytuł może mieć maksymalnie 100 znaków." }
  if (content.length > 1000) return { error: "Treść może mieć maksymalnie 1000 znaków." }

  try {
    await prisma.announcement.create({
      data: { title, content, isPinned, priority, authorId: session.userId },
    })
  } catch (e) {
    console.error("[addAnnouncement]", e)
    return { error: "Błąd zapisu do bazy danych." }
  }

  const pushTitle =
    priority === "URGENT"    ? "🚨 Pilne ogłoszenie" :
    priority === "IMPORTANT" ? "⚠️ Ważne ogłoszenie"  :
                               "📢 Nowe ogłoszenie"

  void sendPushToAll({ title: pushTitle, body: title, url: "/ogloszenia" })

  if (priority === "URGENT") {
    const users = await prisma.user.findMany({ select: { email: true } })
    const emails = users.map((u) => u.email)
    const { subject, html } = urgentAnnouncementEmail({ title, content })
    void sendEmailToMany(emails, subject, html)
  }

  revalidatePath("/")
  revalidatePath("/ogloszenia")
  return undefined
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const session = await verifySession()
  if (session.role !== "ORGANIZER") return
  await prisma.announcement.delete({ where: { id } })
  revalidatePath("/")
  revalidatePath("/ogloszenia")
}

export async function togglePin(id: string, isPinned: boolean): Promise<void> {
  const session = await verifySession()
  if (session.role !== "ORGANIZER") return
  await prisma.announcement.update({ where: { id }, data: { isPinned: !isPinned } })
  revalidatePath("/")
  revalidatePath("/ogloszenia")
}

export async function toggleReaction(
  announcementId: string,
  type: "LIKE" | "HEART" | "ANGRY"
): Promise<void> {
  const session = await verifySession()

  const existing = await prisma.announcementReaction.findUnique({
    where: { announcementId_userId: { announcementId, userId: session.userId } },
  })

  if (existing) {
    if (existing.type === type) {
      await prisma.announcementReaction.delete({ where: { id: existing.id } })
    } else {
      await prisma.announcementReaction.update({ where: { id: existing.id }, data: { type } })
    }
  } else {
    await prisma.announcementReaction.create({
      data: { announcementId, userId: session.userId, type },
    })
  }

  revalidatePath("/")
  revalidatePath("/ogloszenia")
}
