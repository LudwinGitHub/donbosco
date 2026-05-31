"use server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { verifySession } from "@/lib/dal"
import { sendPushToAll } from "@/lib/push"
import { sendEmailToMany, newMatchEmail, matchResultEmail } from "@/lib/email"

export type MatchFormState =
  | { errors?: Record<string, string[]>; message?: string }
  | undefined

export type GoalInput = {
  teamId: string
  scorerId: string
  assisterId: string
  minute: string
  isOwnGoal: boolean
}

// ─── Utwórz mecz ─────────────────────────────────────────────────────────────

export async function createMatch(
  state: MatchFormState,
  formData: FormData
): Promise<MatchFormState> {
  const session = await verifySession()
  if (session.role !== "ORGANIZER") return { message: "Brak uprawnień." }

  const seasonId = formData.get("seasonId") as string
  const homeTeamId = formData.get("homeTeamId") as string
  const awayTeamId = formData.get("awayTeamId") as string
  const date = formData.get("date") as string
  const time = formData.get("time") as string
  const venue = ((formData.get("venue") as string) || "").trim() || null
  const roundRaw = formData.get("round") as string
  const round = roundRaw ? parseInt(roundRaw, 10) : null
  const playerLimitRaw = formData.get("playerLimit") as string
  const playerLimit = playerLimitRaw ? parseInt(playerLimitRaw, 10) : 14

  if (!homeTeamId) return { errors: { homeTeamId: ["Wybierz drużynę gospodarzy."] } }
  if (!awayTeamId) return { errors: { awayTeamId: ["Wybierz drużynę gości."] } }
  if (homeTeamId === awayTeamId) return { errors: { awayTeamId: ["Drużyny muszą być różne."] } }
  if (!date || !time) return { errors: { date: ["Podaj datę i godzinę meczu."] } }

  const scheduledAt = new Date(`${date}T${time}:00`)
  if (isNaN(scheduledAt.getTime())) return { errors: { date: ["Nieprawidłowa data."] } }

  const match = await prisma.match.create({
    data: { seasonId, homeTeamId, awayTeamId, scheduledAt, venue, round, playerLimit },
    include: { homeTeam: true, awayTeam: true },
  })

  revalidatePath("/mecze")

  const dateStr = new Date(match.scheduledAt).toLocaleDateString("pl-PL", { day: "numeric", month: "short" })
  const timeStr = new Date(match.scheduledAt).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })
  sendPushToAll({
    title: "Nowy mecz — zapisz się! ⚽",
    body:  `${match.homeTeam.name} vs ${match.awayTeam.name} · ${dateStr} o ${timeStr}`,
    url:   `/mecze/${match.id}`,
  }).catch(() => {})

  prisma.user.findMany({ where: { emailVerified: true }, select: { email: true } })
    .then((users) => {
      const { subject, html } = newMatchEmail(match)
      return sendEmailToMany(users.map((u) => u.email), subject, html)
    })
    .catch(() => {})

  redirect(`/mecze?toast=${encodeURIComponent("Mecz zaplanowany")}`)
}

// ─── Wpisz wyniki ─────────────────────────────────────────────────────────────

export async function saveMatchResult(
  state: MatchFormState,
  formData: FormData
): Promise<MatchFormState> {
  const session = await verifySession()
  if (session.role !== "ORGANIZER") return { message: "Brak uprawnień." }

  const matchId = formData.get("matchId") as string
  const homeScore = parseInt(formData.get("homeScore") as string, 10)
  const awayScore = parseInt(formData.get("awayScore") as string, 10)
  const goalsJson = formData.get("goals") as string

  if (isNaN(homeScore) || homeScore < 0)
    return { errors: { homeScore: ["Podaj poprawny wynik."] } }
  if (isNaN(awayScore) || awayScore < 0)
    return { errors: { awayScore: ["Podaj poprawny wynik."] } }

  let goals: GoalInput[] = []
  try {
    goals = JSON.parse(goalsJson || "[]")
  } catch {
    return { message: "Błąd danych bramek." }
  }

  const match = await prisma.match.findUnique({
    where:   { id: matchId },
    include: { homeTeam: true, awayTeam: true },
  })
  if (!match) return { message: "Mecz nie istnieje." }

  await prisma.match.update({
    where: { id: matchId },
    data: { homeScore, awayScore, status: "PLAYED", playedAt: new Date() },
  })

  await prisma.goal.deleteMany({ where: { matchId } })

  const validGoals = goals.filter((g) => g.teamId && g.scorerId)
  if (validGoals.length > 0) {
    await prisma.goal.createMany({
      data: validGoals.map((g) => ({
        matchId,
        teamId: g.teamId,
        scorerId: g.scorerId,
        assisterId: g.assisterId || null,
        minute: g.minute ? parseInt(g.minute, 10) : null,
        isOwnGoal: g.isOwnGoal,
      })),
    })
  }

  // Stwórz płatności dla graczy w składzie z powiązanym kontem
  const MATCH_COST = 25
  const lineup = await prisma.matchLineup.findMany({
    where:   { matchId },
    include: { player: { select: { userId: true } } },
  })
  const userIds = [...new Set(
    lineup.map((l) => l.player.userId).filter((id): id is string => id !== null)
  )]
  if (userIds.length > 0) {
    await prisma.matchPayment.createMany({
      data:            userIds.map((userId) => ({ matchId, userId, amount: MATCH_COST })),
      skipDuplicates:  true,
    })
  }

  revalidatePath("/mecze")
  revalidatePath(`/mecze/${matchId}`)
  revalidatePath("/")
  revalidatePath("/moj-profil")

  sendPushToAll({
    title: "Wyniki meczu",
    body:  `${match.homeTeam.name} ${homeScore}:${awayScore} ${match.awayTeam.name}`,
    url:   `/mecze/${matchId}`,
  }).catch(() => {})

  // Email z wynikami do zapisanych graczy
  prisma.matchRegistration.findMany({
    where:   { matchId, status: "CONFIRMED" },
    include: { user: { select: { email: true, emailVerified: true } } },
  }).then(async (registrations) => {
    const emails = registrations
      .filter((r) => r.user.emailVerified)
      .map((r) => r.user.email)
    if (emails.length === 0) return

    const allGoals = await prisma.goal.findMany({
      where:   { matchId },
      include: { scorer: true, assister: true },
      orderBy: { minute: "asc" },
    })
    const goalData = allGoals.map((g) => ({
      scorer:   `${g.scorer.firstName} ${g.scorer.lastName}`,
      assister: g.assister ? `${g.assister.firstName} ${g.assister.lastName}` : null,
      minute:   g.minute,
      isOwnGoal: g.isOwnGoal,
      isHome:   g.isOwnGoal ? g.teamId !== match.homeTeamId : g.teamId === match.homeTeamId,
    }))
    const { subject, html } = matchResultEmail(
      { ...match, homeScore, awayScore },
      goalData,
    )
    return sendEmailToMany(emails, subject, html)
  }).catch(() => {})

  redirect(`/mecze/${matchId}?toast=${encodeURIComponent("Wyniki zapisane")}`)
}

// ─── Usuń mecz ────────────────────────────────────────────────────────────────

export async function deleteMatch(matchId: string): Promise<void> {
  const session = await verifySession()
  if (session.role !== "ORGANIZER") return

  await prisma.match.delete({ where: { id: matchId } })

  revalidatePath("/mecze")
  revalidatePath("/")
  redirect(`/mecze?toast=${encodeURIComponent("Mecz usunięty")}`)
}

// ─── Edytuj mecz ─────────────────────────────────────────────────────────────

export async function editMatch(
  state: MatchFormState,
  formData: FormData
): Promise<MatchFormState> {
  const session = await verifySession()
  if (session.role !== "ORGANIZER") return { message: "Brak uprawnień." }

  const matchId = formData.get("matchId") as string
  const date = formData.get("date") as string
  const time = formData.get("time") as string
  const venue = ((formData.get("venue") as string) || "").trim() || null
  const roundRaw = formData.get("round") as string
  const round = roundRaw ? parseInt(roundRaw, 10) : null
  const playerLimitRaw = formData.get("playerLimit") as string
  const playerLimit = playerLimitRaw ? parseInt(playerLimitRaw, 10) : 14
  const status = formData.get("status") as "SCHEDULED" | "CANCELLED" | "POSTPONED"

  if (!date || !time) return { errors: { date: ["Podaj datę i godzinę meczu."] } }
  if (!["SCHEDULED", "CANCELLED", "POSTPONED"].includes(status))
    return { errors: { status: ["Nieprawidłowy status."] } }

  const scheduledAt = new Date(`${date}T${time}:00`)
  if (isNaN(scheduledAt.getTime())) return { errors: { date: ["Nieprawidłowa data."] } }

  const existing = await prisma.match.findUnique({
    where: { id: matchId },
    include: { homeTeam: true, awayTeam: true },
  })
  if (!existing) return { message: "Mecz nie istnieje." }

  await prisma.match.update({
    where: { id: matchId },
    data: { scheduledAt, venue, round, playerLimit, status },
  })

  revalidatePath("/mecze")
  revalidatePath(`/mecze/${matchId}`)
  revalidatePath("/")

  // Push notification when match is cancelled or postponed
  if (status !== existing.status && (status === "CANCELLED" || status === "POSTPONED")) {
    const label = status === "CANCELLED" ? "Mecz odwołany" : "Mecz przełożony"
    const dateStr = new Date(scheduledAt).toLocaleDateString("pl-PL", { day: "numeric", month: "short" })
    sendPushToAll({
      title: label,
      body: `${existing.homeTeam.name} vs ${existing.awayTeam.name} — ${dateStr}`,
      url: `/mecze/${matchId}`,
    }).catch(() => {})
  }

  redirect(`/mecze/${matchId}?toast=${encodeURIComponent("Mecz zaktualizowany")}`)
}

// ─── Edytuj skład ─────────────────────────────────────────────────────────────

export type LineupEntryInput = {
  playerId: string
  teamId:   string
}

export async function updateMatchLineup(
  state: MatchFormState,
  formData: FormData
): Promise<MatchFormState> {
  const session = await verifySession()
  if (session.role !== "ORGANIZER") return { message: "Brak uprawnień." }

  const matchId    = formData.get("matchId") as string
  const entriesRaw = formData.get("entries") as string

  let entries: LineupEntryInput[] = []
  try {
    entries = JSON.parse(entriesRaw || "[]")
  } catch {
    return { message: "Błąd danych składu." }
  }

  const match = await prisma.match.findUnique({
    where:   { id: matchId },
    include: { homeTeam: true, awayTeam: true },
  })
  if (!match) return { message: "Mecz nie istnieje." }

  await prisma.$transaction(async (tx) => {
    await tx.matchLineup.deleteMany({ where: { matchId } })
    if (entries.length > 0) {
      await tx.matchLineup.createMany({
        data: entries.map((e) => ({ matchId, playerId: e.playerId, teamId: e.teamId })),
        skipDuplicates: true,
      })
    }
  })

  revalidatePath(`/mecze/${matchId}`)

  sendPushToAll({
    title: "Skład ogłoszony",
    body:  `${match.homeTeam.name} vs ${match.awayTeam.name}`,
    url:   `/mecze/${matchId}`,
  }).catch(() => {})

  redirect(`/mecze/${matchId}?toast=${encodeURIComponent("Skład zaktualizowany")}`)
}
