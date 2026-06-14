"use server"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { verifySession } from "@/lib/dal"

export type GroupSlotState = { message?: string; success?: boolean } | undefined

export async function addGroupSlot(
  state: GroupSlotState,
  formData: FormData
): Promise<GroupSlotState> {
  const session = await verifySession()
  if (session.role !== "ORGANIZER") return { message: "Brak uprawnień." }

  const userId = formData.get("userId") as string
  if (!userId) return { message: "Wybierz gracza." }

  const existing = await prisma.matchGroupSlot.findUnique({ where: { userId } })
  if (existing) return { message: "Gracz jest już na liście." }

  const maxPos = await prisma.matchGroupSlot.aggregate({ _max: { position: true } })
  const position = (maxPos._max.position ?? 0) + 1

  await prisma.matchGroupSlot.create({ data: { userId, position } })

  revalidatePath("/panel/sklad")
  return { success: true }
}

export async function removeGroupSlot(userId: string): Promise<void> {
  const session = await verifySession()
  if (session.role !== "ORGANIZER") return

  const slot = await prisma.matchGroupSlot.findUnique({ where: { userId } })
  if (!slot) return

  await prisma.matchGroupSlot.delete({ where: { userId } })

  // Reorder remaining slots
  const remaining = await prisma.matchGroupSlot.findMany({
    where: { position: { gt: slot.position } },
    orderBy: { position: "asc" },
  })
  for (let i = 0; i < remaining.length; i++) {
    await prisma.matchGroupSlot.update({
      where: { id: remaining[i].id },
      data: { position: slot.position + i },
    })
  }

  revalidatePath("/panel/sklad")
}

export async function moveGroupSlot(userId: string, direction: "up" | "down"): Promise<void> {
  const session = await verifySession()
  if (session.role !== "ORGANIZER") return

  const slot = await prisma.matchGroupSlot.findUnique({ where: { userId } })
  if (!slot) return

  const neighbor = await prisma.matchGroupSlot.findFirst({
    where: {
      position: direction === "up" ? { lt: slot.position } : { gt: slot.position },
    },
    orderBy: { position: direction === "up" ? "desc" : "asc" },
  })
  if (!neighbor) return

  // Swap positions
  await prisma.$transaction([
    prisma.matchGroupSlot.update({ where: { id: slot.id }, data: { position: neighbor.position } }),
    prisma.matchGroupSlot.update({ where: { id: neighbor.id }, data: { position: slot.position } }),
  ])

  revalidatePath("/panel/sklad")
}
