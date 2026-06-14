"use client"
import { useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { confirmPresence, declinePresence } from "@/app/actions/registrations"

type RegUser = { firstName: string; lastName: string }
type Reg = { id: string; userId: string; user: RegUser }

type RegistrationSectionProps = {
  matchId: string
  playerLimit: number
  matchStatus: string
  pending: Reg[]
  confirmed: Reg[]
  waitlist: Reg[]
  dropped: Reg[]
  currentUserId: string | null
  deadline1: string | null
  deadline2: string | null
  phase1Processed: boolean
  phase2Processed: boolean
}

export default function RegistrationSection({
  matchId,
  playerLimit,
  matchStatus,
  pending,
  confirmed,
  waitlist,
  dropped,
  currentUserId,
  deadline1,
  deadline2,
  phase1Processed,
  phase2Processed,
}: RegistrationSectionProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const now = new Date()
  const d1 = deadline1 ? new Date(deadline1) : null
  const d2 = deadline2 ? new Date(deadline2) : null

  const myPending   = currentUserId ? pending.find(r => r.userId === currentUserId) : null
  const myConfirmed = currentUserId ? confirmed.find(r => r.userId === currentUserId) : null
  const myWaitlist  = currentUserId ? waitlist.find(r => r.userId === currentUserId) : null
  const myDropped   = currentUserId ? dropped.find(r => r.userId === currentUserId) : null
  const myWaitlistPosition = myWaitlist ? waitlist.findIndex(r => r.userId === currentUserId) + 1 : null

  const isOpen = matchStatus === "SCHEDULED"

  // Determine active deadline
  const activeDeadline = d1 && now < d1 ? d1 : d2 && now < d2 ? d2 : null

  const handleConfirm = () => {
    startTransition(async () => {
      await confirmPresence(matchId)
      router.refresh()
    })
  }

  const handleDecline = () => {
    startTransition(async () => {
      await declinePresence(matchId)
      router.refresh()
    })
  }

  // suppress unused warning
  void phase1Processed
  void phase2Processed

  return (
    <section className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Zapisy</h2>
          <span className="text-xs font-medium text-zinc-500">
            {confirmed.length}<span className="text-zinc-300">/{playerLimit}</span>
            {pending.length > 0 && (
              <span className="ml-1 text-amber-500">({pending.length} oczekuje)</span>
            )}
          </span>
          {waitlist.length > 0 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              +{waitlist.length} rezerwa
            </span>
          )}
        </div>

        {/* Deadline info */}
        {isOpen && activeDeadline && (
          <p className="text-xs text-zinc-400">
            Termin potwierdzenia:{" "}
            <span className="font-medium text-zinc-600">
              {activeDeadline.toLocaleDateString("pl-PL", { day: "numeric", month: "short" })}{" "}
              {activeDeadline.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </p>
        )}
      </div>

      {/* My status banner */}
      {isOpen && currentUserId && (
        <div>
          {myPending && (
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-orange-800">Potwierdź obecność</p>
                {activeDeadline && (
                  <p className="text-xs text-orange-600 mt-0.5">
                    Termin: {activeDeadline.toLocaleDateString("pl-PL", { day: "numeric", month: "long" })}{" "}
                    do {activeDeadline.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={handleConfirm}
                  disabled={isPending}
                  className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors disabled:opacity-50"
                >
                  {isPending ? "…" : "Potwierdź"}
                </button>
                <button
                  onClick={handleDecline}
                  disabled={isPending}
                  className="rounded-lg border border-orange-200 px-3 py-2 text-sm font-medium text-orange-700 hover:bg-orange-100 transition-colors disabled:opacity-50"
                >
                  Zrezygnuj
                </button>
              </div>
            </div>
          )}
          {myConfirmed && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-green-600 text-lg">✓</span>
                <p className="text-sm font-medium text-green-800">Potwierdziłeś obecność</p>
              </div>
              <button
                onClick={handleDecline}
                disabled={isPending}
                className="text-xs text-green-700 underline hover:text-green-900 disabled:opacity-50"
              >
                Zrezygnuj
              </button>
            </div>
          )}
          {myWaitlist && (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 flex items-center justify-between gap-3">
              <p className="text-sm text-zinc-600">
                Jesteś na liście rezerwowej <span className="font-semibold">(#{myWaitlistPosition})</span>
              </p>
              <button
                onClick={handleDecline}
                disabled={isPending}
                className="text-xs text-zinc-500 underline hover:text-zinc-700 disabled:opacity-50"
              >
                Usuń mnie
              </button>
            </div>
          )}
          {myDropped && (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
              <p className="text-sm text-zinc-500">Nie potwierdziłeś obecności w terminie.</p>
            </div>
          )}
          {!currentUserId && (
            <Link
              href="/logowanie"
              className="block rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-500 text-center hover:bg-zinc-50 transition-colors"
            >
              Zaloguj się, aby zobaczyć swój status
            </Link>
          )}
        </div>
      )}

      {/* Player list */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        {/* PENDING */}
        {pending.length > 0 && (
          <>
            <div className="border-b border-zinc-100 bg-amber-50 px-4 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Oczekujący na potwierdzenie</p>
            </div>
            <div className="divide-y divide-zinc-100">
              {pending.map((r, i) => (
                <PlayerRow
                  key={r.id}
                  position={confirmed.length + i + 1}
                  name={`${r.user.firstName} ${r.user.lastName}`}
                  isMe={r.userId === currentUserId}
                  badge="oczekuje"
                  badgeClass="text-amber-500"
                />
              ))}
            </div>
          </>
        )}

        {/* CONFIRMED */}
        {confirmed.length === 0 && pending.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-zinc-400">
            {isOpen ? "Lista zostanie uzupełniona automatycznie." : "Nikt się nie zapisał."}
          </p>
        ) : (
          confirmed.length > 0 && (
            <>
              {pending.length > 0 && (
                <div className="border-b border-zinc-100 bg-green-50 px-4 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-green-600">Potwierdzeni</p>
                </div>
              )}
              <div className="divide-y divide-zinc-100">
                {confirmed.map((r, i) => (
                  <PlayerRow
                    key={r.id}
                    position={i + 1}
                    name={`${r.user.firstName} ${r.user.lastName}`}
                    isMe={r.userId === currentUserId}
                    badge={null}
                    badgeClass=""
                  />
                ))}
              </div>
            </>
          )
        )}

        {/* WAITLIST */}
        {waitlist.length > 0 && (
          <>
            <div className="border-t border-zinc-200 bg-zinc-50 px-4 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Lista rezerwowa</p>
            </div>
            <div className="divide-y divide-zinc-100">
              {waitlist.map((r, i) => (
                <PlayerRow
                  key={r.id}
                  position={i + 1}
                  name={`${r.user.firstName} ${r.user.lastName}`}
                  isMe={r.userId === currentUserId}
                  badge="rezerwa"
                  badgeClass="text-zinc-400"
                />
              ))}
            </div>
          </>
        )}

        {/* DROPPED */}
        {dropped.length > 0 && (
          <>
            <div className="border-t border-zinc-200 bg-zinc-50 px-4 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Niepotwierdzeni</p>
            </div>
            <div className="divide-y divide-zinc-100">
              {dropped.map((r, i) => (
                <PlayerRow
                  key={r.id}
                  position={i + 1}
                  name={`${r.user.firstName} ${r.user.lastName}`}
                  isMe={r.userId === currentUserId}
                  badge="wypadł"
                  badgeClass="text-red-400"
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}

function PlayerRow({
  position,
  name,
  isMe,
  badge,
  badgeClass,
}: {
  position: number
  name: string
  isMe: boolean
  badge: string | null
  badgeClass: string
}) {
  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 text-sm ${isMe ? "bg-zinc-50" : ""}`}>
      <span className="w-5 shrink-0 text-xs text-zinc-400 tabular-nums">{position}.</span>
      <span className={`flex-1 ${isMe ? "font-semibold text-zinc-900" : "text-zinc-700"}`}>
        {name}
        {isMe && <span className="ml-1.5 text-xs font-normal text-zinc-400">(ty)</span>}
      </span>
      {badge && <span className={`text-xs ${badgeClass}`}>{badge}</span>}
    </div>
  )
}
