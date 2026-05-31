"use server"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { verifySession } from "@/lib/dal"

export type CommentFormState = { error?: string } | undefined

export async function addComment(
  matchId: string,
  state: CommentFormState,
  formData: FormData
): Promise<CommentFormState> {
  const session = await verifySession()
  const text = ((formData.get("text") as string) ?? "").trim()
  if (!text) return { error: "Treść komentarza nie może być pusta." }
  if (text.length > 500) return { error: "Komentarz może mieć maksymalnie 500 znaków." }

  await prisma.matchComment.create({
    data: { matchId, userId: session.userId, text },
  })
  revalidatePath(`/mecze/${matchId}`)
  return undefined
}

export async function deleteComment(commentId: string, matchId: string): Promise<void> {
  const session = await verifySession()
  const comment = await prisma.matchComment.findUnique({ where: { id: commentId } })
  if (!comment) return
  if (comment.userId !== session.userId && session.role !== "ORGANIZER") return
  await prisma.matchComment.delete({ where: { id: commentId } })
  revalidatePath(`/mecze/${matchId}`)
}
