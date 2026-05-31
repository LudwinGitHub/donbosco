"use server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { verifySession } from "@/lib/dal"

export type SeasonFormState =
  | { errors?: Record<string, string[]>; message?: string }
  | undefined

// ─── Utwórz sezon ─────────────────────────────────────────────────────────────

export async function createSeason(
  state: SeasonFormState,
  formData: FormData
): Promise<SeasonFormState> {
  const session = await verifySession()
  if (session.role !== "ORGANIZER") return { message: "Brak uprawnień." }

  const name = (formData.get("name") as string | null)?.trim() ?? ""
  const startDateRaw = (formData.get("startDate") as string | null)?.trim() ?? ""
  const endDateRaw = (formData.get("endDate") as string | null)?.trim() ?? ""

  const errors: Record<string, string[]> = {}
  if (!name) errors.name = ["Nazwa sezonu jest wymagana."]
  if (!startDateRaw) errors.startDate = ["Data rozpoczęcia jest wymagana."]

  const startDate = startDateRaw ? new Date(startDateRaw) : null
  if (startDateRaw && startDate && isNaN(startDate.getTime())) {
    errors.startDate = ["Nieprawidłowa data rozpoczęcia."]
  }

  const endDate = endDateRaw ? new Date(endDateRaw) : null
  if (endDateRaw && endDate && isNaN(endDate.getTime())) {
    errors.endDate = ["Nieprawidłowa data zakończenia."]
  }

  if (Object.keys(errors).length > 0) return { errors }

  await prisma.season.create({
    data: {
      name,
      startDate: startDate!,
      endDate: endDate ?? undefined,
    },
  })

  revalidatePath("/")
  redirect(`/panel/sezony?toast=${encodeURIComponent("Sezon utworzony")}`)
}

// ─── Zaktualizuj sezon ─────────────────────────────────────────────────────────

export async function updateSeason(
  state: SeasonFormState,
  formData: FormData
): Promise<SeasonFormState> {
  const session = await verifySession()
  if (session.role !== "ORGANIZER") return { message: "Brak uprawnień." }

  const seasonId = (formData.get("seasonId") as string | null)?.trim() ?? ""
  const name = (formData.get("name") as string | null)?.trim() ?? ""
  const startDateRaw = (formData.get("startDate") as string | null)?.trim() ?? ""
  const endDateRaw = (formData.get("endDate") as string | null)?.trim() ?? ""

  const errors: Record<string, string[]> = {}
  if (!seasonId) return { message: "Brak identyfikatora sezonu." }
  if (!name) errors.name = ["Nazwa sezonu jest wymagana."]
  if (!startDateRaw) errors.startDate = ["Data rozpoczęcia jest wymagana."]

  const startDate = startDateRaw ? new Date(startDateRaw) : null
  if (startDateRaw && startDate && isNaN(startDate.getTime())) {
    errors.startDate = ["Nieprawidłowa data rozpoczęcia."]
  }

  const endDate = endDateRaw ? new Date(endDateRaw) : null
  if (endDateRaw && endDate && isNaN(endDate.getTime())) {
    errors.endDate = ["Nieprawidłowa data zakończenia."]
  }

  if (Object.keys(errors).length > 0) return { errors }

  await prisma.season.update({
    where: { id: seasonId },
    data: {
      name,
      startDate: startDate!,
      endDate: endDate ?? null,
    },
  })

  revalidatePath("/")
  revalidatePath(`/panel/sezony/${seasonId}`)
  redirect(`/panel/sezony/${seasonId}?toast=${encodeURIComponent("Sezon zaktualizowany")}`)
}

// ─── Aktywuj sezon ─────────────────────────────────────────────────────────────

export async function activateSeason(seasonId: string): Promise<void> {
  const session = await verifySession()
  if (session.role !== "ORGANIZER") redirect("/mecze")

  await prisma.$transaction([
    prisma.season.updateMany({ data: { isActive: false } }),
    prisma.season.update({ where: { id: seasonId }, data: { isActive: true } }),
  ])

  revalidatePath("/")
  revalidatePath("/mecze")
  redirect(`/panel/sezony?toast=${encodeURIComponent("Sezon aktywowany")}`)
}

// ─── Dezaktywuj sezon ─────────────────────────────────────────────────────────

export async function deactivateSeason(seasonId: string): Promise<void> {
  const session = await verifySession()
  if (session.role !== "ORGANIZER") redirect("/mecze")

  await prisma.season.update({
    where: { id: seasonId },
    data: { isActive: false },
  })

  revalidatePath("/")
  revalidatePath("/mecze")
  redirect(`/panel/sezony?toast=${encodeURIComponent("Sezon dezaktywowany")}`)
}
