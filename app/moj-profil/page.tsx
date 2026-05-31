import Link from "next/link"
import { verifySession } from "@/lib/dal"
import { prisma } from "@/lib/prisma"
import ClaimPlayerSection from "./claim-player-section"
import ChangePasswordSection from "./change-password-form"
import { createVerificationToken } from "@/app/actions/auth"

export default async function MyProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const session = await verifySession()
  const { tab } = await searchParams

  const now = new Date()

  const [user, myRegistrations, myPayments] = await Promise.all([
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
    prisma.matchPayment.findMany({
      where: { userId: session.userId },
      include: {
        match: {
          include: {
            homeTeam: { select: { name: true, color: true } },
            awayTeam: { select: { name: true, color: true } },
          },
        },
      },
      orderBy: { match: { scheduledAt: "desc" } },
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

  const paymentsSection = (
    <div className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Płatności</h2>

      {myPayments.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white px-4 py-8 text-center text-sm text-zinc-400">
          Brak płatności.
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden divide-y divide-zinc-100">
          {myPayments.map((payment) => {
            const matchDate = new Date(payment.match.scheduledAt).toLocaleDateString("pl-PL", {
              day: "numeric", month: "short", year: "numeric",
            })
            const firstName = user.player?.firstName ?? user.email.split("@")[0]
            const lastName = user.player?.lastName ?? ""
            const paymentTitle = `MECZ-${payment.matchId.slice(0, 8).toUpperCase()}-${firstName}${lastName ? `-${lastName}` : ""}`
            const amount = payment.amount.toNumber()

            return (
              <div key={payment.id} className="px-4 py-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-800">
                      {payment.match.homeTeam.name} vs {payment.match.awayTeam.name}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">{matchDate}</p>
                  </div>
                  <PaymentBadge status={payment.status} />
                </div>

                {payment.status === "UNPAID" && (
                  <div className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-3 space-y-1 text-xs text-amber-900">
                    <p><span className="font-semibold">Do zapłaty:</span> {amount} zł</p>
                    <p><span className="font-semibold">BLIK:</span> 600 068 826</p>
                    <p><span className="font-semibold">Odbiorca:</span> Don Bosco Premier League</p>
                    <p><span className="font-semibold">Tytuł:</span> <span className="font-mono">{paymentTitle}</span></p>
                  </div>
                )}

                {payment.status === "PAID" && payment.paidAt && (
                  <p className="text-xs text-zinc-400">
                    Opłacono:{" "}
                    {new Date(payment.paidAt).toLocaleDateString("pl-PL", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  const emailVerificationBanner = !user.emailVerified && verificationUrl ? (
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
  ) : null

  const tabNav = (
    <div className="flex gap-1.5 border-b border-zinc-100 pb-4">
      <TabLink href="/moj-profil" active={!tab}>Profil</TabLink>
      <TabLink href="/moj-profil?tab=historia" active={tab === "historia"}>Historia meczów</TabLink>
      <TabLink href="/moj-profil?tab=platnosci" active={tab === "platnosci"}>Płatności</TabLink>
    </div>
  )

  if (user.player) {
    const p = user.player

    type MatchHistoryEntry = {
      matchId: string
      playerId: string
      teamId: string
      match: {
        id: string
        scheduledAt: Date
        homeScore: number | null
        awayScore: number | null
        round: number | null
        homeTeam: { name: string; color: string }
        awayTeam: { name: string; color: string }
        goals: { id: string; isOwnGoal: boolean }[]
        assists: { id: string }[]
      }
      team: { name: string; color: string }
    }

    let matchHistory: MatchHistoryEntry[] = []

    if (tab === "historia") {
      const rawLineups = await prisma.matchLineup.findMany({
        where: { player: { userId: session.userId } },
        include: {
          match: {
            include: {
              homeTeam: { select: { name: true, color: true } },
              awayTeam: { select: { name: true, color: true } },
              goals: {
                where: { scorerId: p.id },
                select: { id: true, isOwnGoal: true },
              },
            },
          },
          team: { select: { name: true, color: true } },
        },
        orderBy: { match: { scheduledAt: "desc" } },
      })

      const assistsByMatch = await prisma.goal.findMany({
        where: { assisterId: p.id },
        select: { id: true, matchId: true },
      })
      const assistsMap = new Map<string, { id: string }[]>()
      for (const a of assistsByMatch) {
        const arr = assistsMap.get(a.matchId) ?? []
        arr.push({ id: a.id })
        assistsMap.set(a.matchId, arr)
      }

      matchHistory = rawLineups.map((lu) => ({
        matchId: lu.matchId,
        playerId: lu.playerId,
        teamId: lu.teamId,
        match: {
          ...lu.match,
          assists: assistsMap.get(lu.match.id) ?? [],
        },
        team: lu.team,
      }))
    }

    return (
      <div className="mx-auto max-w-lg space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Mój profil</h1>
          <p className="mt-1 text-sm text-zinc-500">{user.email}</p>
        </div>

        {emailVerificationBanner}

        {tabNav}

        {!tab && (
          <>
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
          </>
        )}

        {tab === "historia" && (
          <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Historia meczów</h2>

            {matchHistory.length === 0 ? (
              <div className="rounded-xl border border-zinc-200 bg-white px-4 py-8 text-center text-sm text-zinc-400">
                Nie rozegrałeś jeszcze żadnego meczu.
              </div>
            ) : (
              <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden divide-y divide-zinc-100">
                {matchHistory.map((lu) => {
                  const { match } = lu
                  const date = new Date(match.scheduledAt).toLocaleDateString("pl-PL", {
                    day: "numeric", month: "short", year: "numeric",
                  })
                  const goalsCount = match.goals.filter((g) => !g.isOwnGoal).length
                  const ownGoalsCount = match.goals.filter((g) => g.isOwnGoal).length
                  const assistsCount = match.assists.length
                  const score =
                    match.homeScore !== null && match.awayScore !== null
                      ? `${match.homeScore}:${match.awayScore}`
                      : "—"

                  return (
                    <div key={match.id} className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: lu.team.color ?? "#71717a" }}
                        />
                        <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium text-zinc-800 truncate">
                              {match.homeTeam.name} vs {match.awayTeam.name}
                            </span>
                            <span className="shrink-0 text-sm font-bold text-zinc-700">{score}</span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-zinc-400">
                              {match.round !== null ? `Kolejka ${match.round} · ` : ""}{lu.team.name} · {date}
                            </span>
                            <span className="text-xs text-zinc-500 shrink-0">
                              {goalsCount > 0 && `⚽ ${goalsCount}G`}
                              {goalsCount > 0 && assistsCount > 0 && "  "}
                              {assistsCount > 0 && `🅰 ${assistsCount}A`}
                              {ownGoalsCount > 0 && ` (${ownGoalsCount} sam.)`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {tab === "platnosci" && paymentsSection}
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

      {emailVerificationBanner}

      {tabNav}

      {!tab && (
        <>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Nie masz jeszcze powiązanego profilu gracza. Znajdź się na liście poniżej, żeby zobaczyć swoje statystyki.
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <ClaimPlayerSection players={unlinkedPlayers} />
          </div>

          {registrationsSection}

          <ChangePasswordSection />
        </>
      )}

      {tab === "historia" && (
        <div className="rounded-xl border border-zinc-200 bg-white px-4 py-8 text-center text-sm text-zinc-400">
          Powiąż profil gracza, żeby zobaczyć historię meczów.
        </div>
      )}

      {tab === "platnosci" && paymentsSection}
    </div>
  )
}

function TabLink({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-zinc-900 text-white"
          : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
      }`}
    >
      {children}
    </Link>
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

function PaymentBadge({ status }: { status: string }) {
  if (status === "PAID") {
    return (
      <span className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-700">
        Opłacone
      </span>
    )
  }
  if (status === "EXEMPT") {
    return (
      <span className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium bg-zinc-100 text-zinc-500">
        Zwolniony
      </span>
    )
  }
  return (
    <span className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-700">
      Do zapłaty
    </span>
  )
}
