"use client"
import { useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signUp, signOut } from "@/app/actions/registrations"

type RegUser = { firstName: string; lastName: string }

type RegistrationSectionProps = {
  matchId: string
  playerLimit: number
  matchStatus: string
  confirmed: Array<{ id: string; userId: string; user: RegUser }>
  waitlist: Array<{ id: string; userId: string; user: RegUser }>
  currentUserId: string | null
}

export default function RegistrationSection({
  matchId,
  playerLimit,
  matchStatus,
  confirmed,
  waitlist,
  currentUserId,
}: RegistrationSectionProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const myConfirmed = currentUserId
    ? confirmed.find((r) => r.userId === currentUserId)
    : null
  const myWaitlist = currentUserId
    ? waitlist.find((r) => r.userId === currentUserId)
    : null
  const myWaitlistPosition = myWaitlist
    ? waitlist.findIndex((r) => r.userId === currentUserId) + 1
    : null

  const isOpen = matchStatus === "SCHEDULED"

  const handleSignUp = () => {
    startTransition(async () => {
      await signUp(matchId)
      router.refresh()
    })
  }

  const handleSignOut = () => {
    startTransition(async () => {
      await signOut(matchId)
      router.refresh()
    })
  }

  return (
    <section className="space-y-3">
      {/* Nagłówek */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Zapisy</h2>
          <span className="text-xs font-medium text-zinc-500">
            {confirmed.length}
            <span className="text-zinc-300">/{playerLimit}</span>
          </span>
          {waitlist.length > 0 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              +{waitlist.length} rezerwowych
            </span>
          )}
        </div>

        {/* Przycisk akcji */}
        {isOpen && (
          <div>
            {!currentUserId ? (
              <Link
                href="/logowanie"
                className="rounded-md px-3 py-1.5 text-xs font-medium text-zinc-500 border border-zinc-200 hover:bg-zinc-50 transition-colors"
              >
                Zaloguj się, żeby się zapisać
              </Link>
            ) : myConfirmed ? (
              <button
                onClick={handleSignOut}
                disabled={pending}
                className="rounded-md px-3 py-1.5 text-xs font-medium text-red-500 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {pending ? "…" : "Wypisz się"}
              </button>
            ) : myWaitlist ? (
              <button
                onClick={handleSignOut}
                disabled={pending}
                className="rounded-md px-3 py-1.5 text-xs font-medium text-amber-600 border border-amber-200 hover:bg-amber-50 transition-colors disabled:opacity-50"
              >
                {pending ? "…" : `Wypisz się z rezerwowej (#${myWaitlistPosition})`}
              </button>
            ) : (
              <button
                onClick={handleSignUp}
                disabled={pending}
                className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 transition-colors disabled:opacity-50"
              >
                {pending
                  ? "…"
                  : confirmed.length >= playerLimit
                    ? "Dopisz na rezerwową"
                    : "Zapisz się"}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        {/* Potwierdzeni */}
        {confirmed.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-zinc-400">
            {isOpen ? "Brak zapisanych graczy. Bądź pierwszy!" : "Nikt się nie zapisał."}
          </p>
        ) : (
          <div className="divide-y divide-zinc-100">
            {confirmed.map((r, i) => (
              <PlayerRow
                key={r.id}
                position={i + 1}
                name={`${r.user.firstName} ${r.user.lastName}`}
                isMe={r.userId === currentUserId}
                badge={null}
              />
            ))}
          </div>
        )}

        {/* Lista rezerwowa */}
        {waitlist.length > 0 && (
          <>
            <div className="border-t border-zinc-200 bg-amber-50 px-4 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">
                Lista rezerwowa
              </p>
            </div>
            <div className="divide-y divide-zinc-100">
              {waitlist.map((r, i) => (
                <PlayerRow
                  key={r.id}
                  position={i + 1}
                  name={`${r.user.firstName} ${r.user.lastName}`}
                  isMe={r.userId === currentUserId}
                  badge="rezerwowy"
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
}: {
  position: number
  name: string
  isMe: boolean
  badge: string | null
}) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-2.5 text-sm ${isMe ? "bg-zinc-50" : ""}`}
    >
      <span className="w-5 shrink-0 text-xs text-zinc-400 tabular-nums">{position}.</span>
      <span className={`flex-1 ${isMe ? "font-semibold text-zinc-900" : "text-zinc-700"}`}>
        {name}
        {isMe && <span className="ml-1.5 text-xs font-normal text-zinc-400">(ty)</span>}
      </span>
      {badge && (
        <span className="text-xs text-amber-500">{badge}</span>
      )}
    </div>
  )
}
