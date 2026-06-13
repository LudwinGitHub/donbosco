"use server"
import { revalidatePath } from "next/cache"
import { verifySession } from "@/lib/dal"
import { prisma } from "@/lib/prisma"

export async function updatePlayerAvatar(avatarId: number | null) {
  const session = await verifySession()

  const player = await prisma.player.findUnique({ where: { userId: session.userId } })
  if (!player) throw new Error("Nie masz powiązanego profilu gracza.")

  await prisma.player.update({
    where: { id: player.id },
    data:  { avatarId },
  })

  revalidatePath("/moj-profil")
  revalidatePath(`/gracze/${player.id}`)
  revalidatePath("/gracze")
}
