import Link from "next/link"
import { verifySession } from "@/lib/dal"
import { prisma } from "@/lib/prisma"
import ClaimPlayerSection from "./claim-player-section"
import ChangePasswordSection from "./change-password-form"
import { createVerificationToken } from "@/app/actions/auth"

export default async function MyProfilePage() {
  const session = await verifySession()

  const now = new Date()

  const [user, myRegistrations] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        player: {
          include: {
            matchLineups:  { select: { matchId: true } },
            goalsScored:   { where: { isOwnGoal: false }, select: { id: true } },
            goalsAssisted: { select: { id: true } },
          },
        },
      },
    }),
    prisma.matchRegistration.findMany({
      where: { userId: session.userId },
      include: {
        match: {
          select: {
            id: true,
            scheduledAt: true,
            status: true,
            round: true,
            playerLimit: true,
            homeTeam: { select: { name: true, color: true } },
            awayTeam: { select: { name: true, color: true } },
            _count: { select: { registrations: true } },
          },
        },
      },
      orderBy: { match: { scheduledAt: "asc" } },
    }),
  ])

  if (!user) return <p className="text-zinc-500">Użytkownik nie istnieje.</p>

  let verificationUrl: string | undefined
  if (!user.emailVerified) {
    const token = await createVerificationToken(user.id)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    verificationUrl = `${appUrl}/weryfikacja?token=${token}`
  }

  const upcomingRegs = myRegistrations.filter(
    (r) => r.match.status === "SCHEDULED" && r.match.scheduledAt > now
  )
  const pastRegs = myRegistrations.filter(
    (r) => r.match.status !== "SCHEDULED" || r.match.scheduledAt <= now
  )

  const registrationsSection = (
    <div className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Moje zapisy</h2>

      {myRegistrations.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white px-4 py-8 text-center text-sm text-zinc-400">
          Nie jesteś zapisany na żaden mecz.{" "}
          <Link href="/mecze" className="font-medium text-zinc-600 hover:underline">
            Sprawdź nadchodzące mecze →
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden divide-y divide-zinc-100">
          {upcomingRegs.length > 0 && (
            <>
              <div className="bg-zinc-50 px-4 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Nadchodzące</p>
              </div>
              {upcomingRegs.map((r) => (
                <RegistrationRow key={r.id} reg={r} />
              ))}
            </>
          )}
          {pastRegs.length > 0 && (
            <>
              <div className="bg-zinc-50 px-4 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Historia</p>
              </div>
              {pastRegs.slice(0, 5).map((r) => (
                <RegistrationRow key={r.id} reg={r} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )

  if (user.player) {
    const p = user.player
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Mój profil</h1>
          <p className="mt-1 text-sm text-zinc-500">{user.email}</p>
        </div>

        {!user.emailVerified && verificationUrl && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
            <p className="text-sm font-semibold text-amber-800">Zweryfikuj swój adres email</p>
            <p className="text-xs text-amber-700">Kliknij poniższy link, aby aktywować konto. Link wygasa po 24 godzinach.</p>
            <a
              href={verificationUrl}
              className="block truncate text-xs font-mono text-amber-900 underline break-all"
            >
              {verificationUrl}
            </a>
          </div>
        )}

        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Profil gracza</p>
            <p className="mt-1 text-xl font-bold text-zinc-900">
              {p.firstName} {p.lastName}
              {p.nickname && (
                <span className="ml-2 text-base font-normal text-zinc-400">„{p.nickname}"</span>
              )}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t border-zinc-100 pt-4">
            <StatCell label="Mecze"  value={p.matchLineups.length} />
            <StatCell label="Gole"   value={p.goalsScored.length} />
            <StatCell label="Asysty" value={p.goalsAssisted.length} />
          </div>
        </div>

        {registrationsSection}

        <ChangePasswordSection />
      </div>
    )
  }

  const unlinkedPlayers = await prisma.player.findMany({
    where:   { userId: null },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select:  { id: true, firstName: true, lastName: true, nickname: true },
  })

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mój profil</h1>
        <p className="mt-1 text-sm text-zinc-500">{user.email}</p>
      </div>

      {!user.emailVerified && verificationUrl && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
          <p className="text-sm font-semibold text-amber-800">Zweryfikuj swój adres email</p>
          <p className="text-xs text-amber-700">Kliknij poniższy link, aby aktywować konto. Link wygasa po 24 godzinach.</p>
          <a
            href={verificationUrl}
            className="block truncate text-xs font-mono text-amber-900 underline break-all"
          >
            {verificationUrl}
          </a>
        </div>
      )}

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
        Nie masz jeszcze powiązanego profilu gracza. Znajdź się na liście poniżej, żeby zobaczyć swoje statystyki.
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <ClaimPlayerSection players={unlinkedPlayers} />
      </div>

      {registrationsSection}

      <ChangePasswordSection />
    </div>
  )
}

type RegEntry = {
  id: string
  status: string
  match: {
    id: string
    scheduledAt: Date
    status: string
    round: number | null
    playerLimit: number
    homeTeam: { name: string; color: string }
    awayTeam: { name: string; color: string }
    _count: { registrations: number }
  }
}

function RegistrationRow({ reg }: { reg: RegEntry }) {
  const { match } = reg
  const isWaitlist = reg.status === "WAITLIST"
  const date = new Date(match.scheduledAt).toLocaleDateString("pl-PL", {
    day: "numeric", month: "short", year: "numeric",
  })

  return (
    <Link
      href={`/mecze/${match.id}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors"
    >
      <div className="flex flex-1 flex-col gap-0.5">
        <span className="text-sm font-medium text-zinc-800">
          {match.homeTeam.name} vs {match.awayTeam.name}
        </span>
        <span className="text-xs text-zinc-400">
          {match.round !== null ? `Kolejka ${match.round} · ` : ""}{date}
        </span>
      </div>
      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isWaitlist
          ? "bg-amber-100 text-amber-700"
          : "bg-green-100 text-green-700"
      }`}>
        {isWaitlist ? "rezerwowy" : "zapisany"}
      </span>
      <span className="text-zinc-300 text-sm">›</span>
    </Link>
  )
}

function StatCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold text-zinc-900">{value}</p>
      <p className="mt-0.5 text-xs text-zinc-400">{label}</p>
    </div>
  )
}
