"use client"
import { useActionState, useCallback, useEffect, useRef, useState, useTransition } from "react"
import { getChatMessages, sendChatMessage, deleteChatMessage, type ChatFormState } from "@/app/actions/chat"

type Message = {
  id: string
  text: string
  createdAt: Date
  userId: string
  user: { firstName: string; lastName: string }
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
  return isToday
    ? `${hh}:${mm}`
    : d.toLocaleDateString("pl-PL", { day: "numeric", month: "short" }) + ` ${hh}:${mm}`
}

export default function ChatFab({
  currentUserId,
  isOrganizer,
}: {
  currentUserId: string | null
  isOrganizer: boolean
}) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [initialLoading, setInitialLoading] = useState(false)
  const [formKey, setFormKey] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [deletePending, startDeleteTransition] = useTransition()
  const [state, formAction, pending] = useActionState<ChatFormState, FormData>(sendChatMessage, undefined)
  const bottomRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchMessages = useCallback(async () => {
    const data = await getChatMessages()
    setMessages(data.messages as Message[])
  }, [])

  useEffect(() => {
    if (!open) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    setInitialLoading(true)
    fetchMessages().finally(() => setInitialLoading(false))
    intervalRef.current = setInterval(fetchMessages, 5000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [open, fetchMessages])

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length, open])

  useEffect(() => {
    if (submitted && state === undefined) {
      setFormKey((k) => k + 1)
      setSubmitted(false)
      fetchMessages().then(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
      })
    }
  }, [state, submitted, fetchMessages])

  const handleDelete = (id: string) => {
    startDeleteTransition(async () => {
      await deleteChatMessage(id)
      fetchMessages()
    })
  }

  return (
    <>
      {/* Okienko czatu */}
      {open && (
        <div
          className="fixed right-4 left-4 sm:left-auto sm:right-6 sm:w-96 z-[60] flex flex-col rounded-2xl border border-zinc-200 bg-white shadow-2xl overflow-hidden"
          style={{
            bottom: "calc(5rem + env(safe-area-inset-bottom, 0px))",
            height: "min(420px, calc(100dvh - 8rem - env(safe-area-inset-bottom, 0px)))",
          }}
        >
          {/* Nagłówek */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 bg-zinc-50 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-zinc-900">Czat ligowy</span>
              <span className="w-2 h-2 rounded-full bg-green-400" title="Online" />
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
              aria-label="Zamknij czat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Lista wiadomości */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {initialLoading && (
              <p className="text-center text-sm text-zinc-400 py-8">Ładowanie…</p>
            )}
            {!initialLoading && messages.length === 0 && (
              <p className="text-center text-sm text-zinc-400 py-8">
                Brak wiadomości. Napisz pierwszy!
              </p>
            )}
            {messages.map((m) => {
              const isOwn = m.userId === currentUserId
              return (
                <div key={m.id} className={`flex gap-2 ${isOwn ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] flex flex-col gap-0.5 ${isOwn ? "items-end" : "items-start"}`}>
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
                    <div className={`rounded-2xl px-3 py-2 text-sm break-words ${
                      isOwn
                        ? "bg-zinc-900 text-white rounded-tr-sm"
                        : "bg-zinc-100 text-zinc-800 rounded-tl-sm"
                    }`}>
                      {m.text}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Formularz */}
          <div className="border-t border-zinc-100 px-3 py-3 shrink-0">
            {currentUserId ? (
              <form
                key={formKey}
                action={(fd) => { setSubmitted(true); formAction(fd) }}
                className="flex gap-2"
              >
                <input
                  name="text"
                  placeholder="Napisz wiadomość…"
                  maxLength={500}
                  autoComplete="off"
                  className="flex-1 min-w-0 rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
                />
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors shrink-0"
                >
                  {pending ? "…" : "Wyślij"}
                </button>
              </form>
            ) : (
              <p className="text-center text-xs text-zinc-400">
                <a href="/logowanie" className="underline hover:text-zinc-700">Zaloguj się</a>, aby pisać na czacie.
              </p>
            )}
            {state?.error && <p className="mt-1 text-xs text-red-500">{state.error}</p>}
          </div>
        </div>
      )}

      {/* Przycisk FAB */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed right-6 z-[60] w-14 h-14 rounded-full bg-zinc-900 text-white shadow-lg hover:bg-zinc-700 active:scale-95 transition-all flex items-center justify-center"
        style={{ bottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}
        aria-label={open ? "Zamknij czat" : "Otwórz czat"}
      >
        {open ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>
    </>
  )
}
