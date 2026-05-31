"use server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { verifySession } from "@/lib/dal"

export type TeamFormState =
  | { errors?: Record<string, string[]>; message?: string }
  | undefined

// ─── Utwórz drużynę ───────────────────────────────────────────────────────────

export async function createTeam(
  state: TeamFormState,
  formData: FormData
): Promise<TeamFormState> {
  const session = await verifySession()
  if (session.role !== "ORGANIZER") return { message: "Brak uprawnień." }

  const seasonId = (formData.get("seasonId") as string | null)?.trim() ?? ""
  const name = (formData.get("name") as string | null)?.trim() ?? ""
  const color = (formData.get("color") as string | null)?.trim() ?? ""

  const errors: Record<string, string[]> = {}
  if (!seasonId) return { message: "Brak identyfikatora sezonu." }
  if (!name) errors.name = ["Nazwa drużyny jest wymagana."]
  if (!color) errors.color = ["Kolor drużyny jest wymagany."]
  if (color && !/^#[0-9a-fA-F]{6}$/.test(color)) {
    errors.color = ["Kolor musi być w formacie hex (#rrggbb)."]
  }

  if (Object.keys(errors).length > 0) return { errors }

  await prisma.team.create({
    data: { name, color, seasonId },
  })

  revalidatePath(`/panel/sezony/${seasonId}`)
  redirect(`/panel/sezony/${seasonId}?toast=${encodeURIComponent("Drużyna dodana")}`)
}

// ─── Zaktualizuj drużynę ───────────────────────────────────────────────────────

export async function updateTeam(
  state: TeamFormState,
  formData: FormData
): Promise<TeamFormState> {
  const session = await verifySession()
  if (session.role !== "ORGANIZER") return { message: "Brak uprawnień." }

  const teamId = (formData.get("teamId") as string | null)?.trim() ?? ""
  const seasonId = (formData.get("seasonId") as string | null)?.trim() ?? ""
  const name = (formData.get("name") as string | null)?.trim() ?? ""
  const color = (formData.get("color") as string | null)?.trim() ?? ""

  const errors: Record<string, string[]> = {}
  if (!teamId) return { message: "Brak identyfikatora drużyny." }
  if (!seasonId) return { message: "Brak identyfikatora sezonu." }
  if (!name) errors.name = ["Nazwa drużyny jest wymagana."]
  if (!color) errors.color = ["Kolor drużyny jest wymagany."]
  if (color && !/^#[0-9a-fA-F]{6}$/.test(color)) {
    errors.color = ["Kolor musi być w formacie hex (#rrggbb)."]
  }

  if (Object.keys(errors).length > 0) return { errors }

  await prisma.team.update({
    where: { id: teamId },
    data: { name, color },
  })

  revalidatePath(`/panel/sezony/${seasonId}`)
  redirect(`/panel/sezony/${seasonId}?toast=${encodeURIComponent("Drużyna zaktualizowana")}`)
}

// ─── Usuń drużynę ─────────────────────────────────────────────────────────────

export async function deleteTeam(teamId: string, seasonId: string): Promise<void> {
  const session = await verifySession()
  if (session.role !== "ORGANIZER") redirect("/mecze")

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      _count: { select: { homeMatches: true, awayMatches: true } },
    },
  })

  if (!team) redirect(`/panel/sezony/${seasonId}?toast=${encodeURIComponent("Drużyna nie istnieje.")}`)

  const matchCount = team._count.homeMatches + team._count.awayMatches
  if (matchCount > 0) {
    redirect(
      `/panel/sezony/${seasonId}?toast=${encodeURIComponent("Nie można usunąć drużyny, która ma przypisane mecze.")}`
    )
  }

  await prisma.team.delete({ where: { id: teamId } })

  revalidatePath(`/panel/sezony/${seasonId}`)
  redirect(`/panel/sezony/${seasonId}?toast=${encodeURIComponent("Drużyna usunięta")}`)
}

// ─── Dodaj gracza do drużyny ──────────────────────────────────────────────────

export async function addPlayerToTeam(
  state: undefined,
  formData: FormData
): Promise<undefined> {
  const session = await verifySession()
  if (session.role !== "ORGANIZER") redirect("/mecze")

  const teamId = (formData.get("teamId") as string | null)?.trim() ?? ""
  const playerId = (formData.get("playerId") as string | null)?.trim() ?? ""
  const seasonId = (formData.get("seasonId") as string | null)?.trim() ?? ""

  if (!teamId || !playerId || !seasonId) {
    redirect(`/panel/sezony/${seasonId}`)
  }

  try {
    await prisma.teamPlayer.create({ data: { teamId, playerId } })
  } catch {
    // skip duplicate
  }

  revalidatePath(`/panel/sezony/${seasonId}`)
  redirect(`/panel/sezony/${seasonId}?toast=${encodeURIComponent("Gracz dodany do drużyny")}`)
}

// ─── Usuń gracza z drużyny ────────────────────────────────────────────────────

export async function removePlayerFromTeam(
  teamId: string,
  playerId: string,
  seasonId: string
): Promise<void> {
  const session = await verifySession()
  if (session.role !== "ORGANIZER") redirect("/mecze")

  await prisma.teamPlayer.delete({
    where: { playerId_teamId: { playerId, teamId } },
  })

  revalidatePath(`/panel/sezony/${seasonId}`)
  redirect(`/panel/sezony/${seasonId}?toast=${encodeURIComponent("Gracz usunięty z drużyny")}`)
}
