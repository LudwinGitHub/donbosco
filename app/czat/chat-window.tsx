"use client"
import { useActionState, useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { sendChatMessage, deleteChatMessage, type ChatFormState } from "@/app/actions/chat"

type Message = {
  id: string
  text: string
  createdAt: Date
  userId: string
  user: { firstName: string; lastName: string }
}

type Props = {
  messages: Message[]
  currentUserId: string | null
  isOrganizer: boolean
}

function fmtTime(date: Date) {
  const d = new Date(date)
  const now = new Date()
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()

  const hh = String(d.getHours()).padStart(2, "0")
  const mm = String(d.getMinutes()).padStart(2, "0")
  if (isToday) return `${hh}:${mm}`
  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "short" }) + ` ${hh}:${mm}`
}

export default function ChatWindow({ messages, currentUserId, isOrganizer }: Props) {
  const router = useRouter()
  const bottomRef = useRef<HTMLDivElement>(null)
  const [formKey, setFormKey] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [deletePending, startDeleteTransition] = useTransition()
  const [state, action, pending] = useActionState<ChatFormState, FormData>(sendChatMessage, undefined)

  // Auto-refresh co 5 sekund
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 5000)
    return () => clearInterval(id)
  }, [router])

  // Scroll na dół po nowych wiadomościach
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  // Reset formularza po wysłaniu
  useEffect(() => {
    if (submitted && state === undefined) {
      setFormKey((k) => k + 1)
      setSubmitted(false)
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [state, submitted])

  const handleDelete = (id: string) => {
    startDeleteTransition(async () => {
      await deleteChatMessage(id)
      router.refresh()
    })
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden flex flex-col" style={{ height: "70vh" }}>
      {/* Lista wiadomości */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-sm text-zinc-400 py-10">
            Brak wiadomości. Napisz pierwszy!
          </p>
        )}
        {messages.map((m) => {
          const isOwn = m.userId === currentUserId
          return (
            <div key={m.id} className={`flex gap-2 ${isOwn ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] ${isOwn ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  {!isOwn && (
                    <span className="text-xs font-semibold text-zinc-700">
                      {m.user.firstName} {m.user.lastName}
                    </span>
                  )}
                  <span className="text-xs text-zinc-400">{fmtTime(m.createdAt)}</span>
                  {(isOwn || isOrganizer) && (
                    <button
                      onClick={() => handleDelete(m.id)}
                      disabled={deletePending}
                      className="text-xs text-zinc-300 hover:text-red-400 transition-colors disabled:opacity-50"
                    >
                      ×
                    </button>
                  )}
                </div>
                <div
                  className={`rounded-2xl px-3 py-2 text-sm break-words ${
                    isOwn
                      ? "bg-zinc-900 text-white rounded-tr-sm"
                      : "bg-zinc-100 text-zinc-800 rounded-tl-sm"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Formularz */}
      <div className="border-t border-zinc-100 px-4 py-3">
        {currentUserId ? (
          <form
            key={formKey}
            action={(fd) => { setSubmitted(true); action(fd) }}
            className="flex gap-2"
          >
            <input
              name="text"
              placeholder="Napisz wiadomość…"
              maxLength={500}
              autoComplete="off"
              className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
            />
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors shrink-0"
            >
              {pending ? "…" : "Wyślij"}
            </button>
          </form>
        ) : (
          <p className="text-center text-sm text-zinc-400">
            <a href="/logowanie" className="underline hover:text-zinc-700">Zaloguj się</a>, aby pisać na czacie.
          </p>
        )}
        {state?.error && <p className="mt-1 text-xs text-red-500">{state.error}</p>}
      </div>
    </div>
  )
}
