"use server"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { verifySession } from "@/lib/dal"

export type PlayerFormState =
  | { errors?: Record<string, string[]>; message?: string; success?: boolean }
  | undefined

// ─── updatePlayer ─────────────────────────────────────────────────────────────

export async function updatePlayer(
  state: PlayerFormState,
  formData: FormData
): Promise<PlayerFormState> {
  const session = await verifySession()
  if (session.role !== "ORGANIZER") return { message: "Brak uprawnień." }

  const id = formData.get("id") as string
  const firstName = (formData.get("firstName") as string ?? "").trim()
  const lastName = (formData.get("lastName") as string ?? "").trim()
  const nickname = ((formData.get("nickname") as string) ?? "").trim() || null

  if (!id) return { message: "Brak ID gracza." }
  if (firstName.length < 2) return { errors: { firstName: ["Imię musi mieć co najmniej 2 znaki."] } }

  await prisma.player.update({ where: { id }, data: { firstName, lastName, nickname } })

  revalidatePath("/panel/gracze")
  revalidatePath("/gracze")
  return { success: true }
}

// ─── mergePlayers ─────────────────────────────────────────────────────────────

export async function mergePlayers(
  state: PlayerFormState,
  formData: FormData
): Promise<PlayerFormState> {
  const session = await verifySession()
  if (session.role !== "ORGANIZER") return { message: "Brak uprawnień." }

  const keepId = formData.get("keepId") as string
  const deleteId = formData.get("deleteId") as string

  if (!keepId || !deleteId) return { message: "Brak ID graczy." }
  if (keepId === deleteId) return { message: "Nie można scalić gracza z samym sobą." }

  await prisma.$transaction(async (tx) => {
    // TeamPlayer (@@id [playerId, teamId]) — skip conflicts, cascade handles leftovers
    const keepTeamIds = new Set(
      (await tx.teamPlayer.findMany({ where: { playerId: keepId }, select: { teamId: true } }))
        .map((t) => t.teamId)
    )
    for (const tp of await tx.teamPlayer.findMany({ where: { playerId: deleteId } })) {
      if (!keepTeamIds.has(tp.teamId)) {
        await tx.teamPlayer.update({
          where: { playerId_teamId: { playerId: deleteId, teamId: tp.teamId } },
          data: { playerId: keepId },
        })
      }
    }

    // MatchLineup (@@id [matchId, playerId]) — skip conflicts, delete leftovers manually
    const keepMatchIds = new Set(
      (await tx.matchLineup.findMany({ where: { playerId: keepId }, select: { matchId: true } }))
        .map((m) => m.matchId)
    )
    for (const ml of await tx.matchLineup.findMany({ where: { playerId: deleteId } })) {
      if (!keepMatchIds.has(ml.matchId)) {
        await tx.matchLineup.update({
          where: { matchId_playerId: { matchId: ml.matchId, playerId: deleteId } },
          data: { playerId: keepId },
        })
      }
    }
    // Delete any remaining lineups for deleteId (conflicting ones that couldn't be transferred)
    await tx.matchLineup.deleteMany({ where: { playerId: deleteId } })

    // Goals
    await tx.goal.updateMany({ where: { scorerId: deleteId }, data: { scorerId: keepId } })
    await tx.goal.updateMany({ where: { assisterId: deleteId }, data: { assisterId: keepId } })

    // Transfer userId if deleteId had one and keepId doesn't
    const delPlayer = await tx.player.findUnique({ where: { id: deleteId }, select: { userId: true } })
    const keepPlayer = await tx.player.findUnique({ where: { id: keepId }, select: { userId: true } })
    if (delPlayer?.userId && !keepPlayer?.userId) {
      await tx.player.update({ where: { id: keepId }, data: { userId: delPlayer.userId } })
    }

    await tx.player.delete({ where: { id: deleteId } })
  })

  revalidatePath("/panel/gracze")
  revalidatePath("/gracze")
  return { success: true }
}

// ─── deletePlayer ─────────────────────────────────────────────────────────────

export async function deletePlayer(
  state: PlayerFormState,
  formData: FormData
): Promise<PlayerFormState> {
  const session = await verifySession()
  if (session.role !== "ORGANIZER") return { message: "Brak uprawnień." }

  const id = formData.get("id") as string
  if (!id) return { message: "Brak ID gracza." }

  await prisma.$transaction(async (tx) => {
    // Asysty — zeruj referencję zamiast kasować bramkę
    await tx.goal.updateMany({ where: { assisterId: id }, data: { assisterId: null } })
    // Bramki strzelone przez tego gracza
    await tx.goal.deleteMany({ where: { scorerId: id } })
    // Składy meczowe
    await tx.matchLineup.deleteMany({ where: { playerId: id } })
    // Przypisania do drużyn (cascade, ale explicit dla pewności)
    await tx.teamPlayer.deleteMany({ where: { playerId: id } })
    await tx.player.delete({ where: { id } })
  })

  revalidatePath("/panel/gracze")
  revalidatePath("/gracze")
  return { success: true }
}

// ─── linkPlayerToUser (organizer) ─────────────────────────────────────────────

export async function linkPlayerToUser(
  state: PlayerFormState,
  formData: FormData
): Promise<PlayerFormState> {
  const session = await verifySession()
  if (session.role !== "ORGANIZER") return { message: "Brak uprawnień." }

  const playerId = formData.get("playerId") as string
  const userId = (formData.get("userId") as string) || null

  if (!playerId) return { message: "Brak ID gracza." }

  // Clear any other player that already holds this userId
  if (userId) {
    await prisma.player.updateMany({ where: { userId, NOT: { id: playerId } }, data: { userId: null } })
  }

  await prisma.player.update({ where: { id: playerId }, data: { userId } })

  revalidatePath("/panel/gracze")
  return { success: true }
}

// ─── claimPlayerProfile (logged-in user) ──────────────────────────────────────

export async function claimPlayerProfile(
  state: PlayerFormState,
  formData: FormData
): Promise<PlayerFormState> {
  const session = await verifySession()

  const playerId = formData.get("playerId") as string
  if (!playerId) return { message: "Brak ID gracza." }

  const [player, existing] = await Promise.all([
    prisma.player.findUnique({ where: { id: playerId }, select: { userId: true } }),
    prisma.player.findUnique({ where: { userId: session.userId } }),
  ])

  if (!player) return { message: "Gracz nie istnieje." }
  if (player.userId !== null) return { message: "Ten profil gracza jest już przypisany do innego konta." }
  if (existing) return { message: "Twoje konto jest już powiązane z profilem gracza." }

  await prisma.player.update({ where: { id: playerId }, data: { userId: session.userId } })

  revalidatePath("/moj-profil")
  return { success: true }
}

// ─── deleteUserAccount (organizer) ────────────────────────────────────────────

export async function deleteUserAccount(
  state: PlayerFormState,
  formData: FormData
): Promise<PlayerFormState> {
  const session = await verifySession()
  if (session.role !== "ORGANIZER") return { message: "Brak uprawnień." }

  const userId = formData.get("userId") as string
  if (!userId) return { message: "Brak ID użytkownika." }
  if (userId === session.userId) return { message: "Nie można usunąć własnego konta." }

  await prisma.user.delete({ where: { id: userId } })
  // Player.userId → null automatycznie (onDelete: SetNull)

  revalidatePath("/panel/gracze")
  return { success: true }
}

export async function setUserRole(
  state: PlayerFormState,
  formData: FormData
): Promise<PlayerFormState> {
  const session = await verifySession()
  if (session.role !== "ORGANIZER") return { message: "Brak uprawnień." }

  const userId = formData.get("userId") as string
  const role   = formData.get("role") as string
  if (!userId || !role) return { message: "Brak danych." }
  if (role !== "PLAYER" && role !== "ORGANIZER") return { message: "Nieprawidłowa rola." }
  if (userId === session.userId) return { message: "Nie można zmieniać własnej roli." }

  await prisma.user.update({ where: { id: userId }, data: { role } })

  revalidatePath("/panel/gracze")
  return { success: true }
}
