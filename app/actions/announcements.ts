"use server"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { verifySession } from "@/lib/dal"

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

  await prisma.announcement.create({
    data: { title, content, isPinned, priority, authorId: session.userId },
  })
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
