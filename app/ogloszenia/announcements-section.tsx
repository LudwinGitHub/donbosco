"use client"
import { useActionState, useTransition, useState } from "react"
import {
  addAnnouncement,
  deleteAnnouncement,
  togglePin,
  type AnnouncementFormState,
} from "@/app/actions/announcements"

type Priority = "NORMAL" | "IMPORTANT" | "URGENT"

type Announcement = {
  id: string
  title: string
  content: string
  isPinned: boolean
  priority: Priority
  createdAt: Date
  author: { firstName: string; lastName: string }
}

const PRIORITY_CONFIG: Record<Priority, {
  card: string
  badge: string
  label: string
}> = {
  NORMAL:    { card: "border-zinc-200 bg-white",       badge: "bg-zinc-100 text-zinc-500",       label: "Normalne" },
  IMPORTANT: { card: "border-orange-200 bg-orange-50", badge: "bg-orange-100 text-orange-600",   label: "Ważne" },
  URGENT:    { card: "border-red-300 bg-red-50",       badge: "bg-red-100 text-red-600",         label: "Pilne" },
}

function fmtDate(date: Date) {
  return new Date(date).toLocaleDateString("pl-PL", {
    day: "numeric", month: "short", year: "numeric",
  })
}

export default function AnnouncementsSection({
  announcements,
  isOrganizer,
}: {
  announcements: Announcement[]
  isOrganizer: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [formKey, setFormKey] = useState(0)
  const [state, action, submitting] = useActionState<AnnouncementFormState, FormData>(
    addAnnouncement,
    undefined
  )

  const handleDelete = (id: string) => {
    if (!confirm("Usunąć ogłoszenie?")) return
    startTransition(async () => { await deleteAnnouncement(id) })
  }

  const handleTogglePin = (id: string, isPinned: boolean) => {
    startTransition(async () => { await togglePin(id, isPinned) })
  }

  return (
    <div className="space-y-4">
      {/* Form dla organizatora */}
      {isOrganizer && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Nowe ogłoszenie</p>
          <form
            key={formKey}
            action={(fd) => {
              action(fd)
              setFormKey((k) => k + 1)
            }}
            className="space-y-3"
          >
            <input
              name="title"
              placeholder="Tytuł ogłoszenia…"
              maxLength={100}
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
            />
            <textarea
              name="content"
              placeholder="Treść ogłoszenia…"
              rows={3}
              maxLength={1000}
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 resize-none"
            />
            <div className="flex flex-wrap items-center gap-3 justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <select
                  name="priority"
                  defaultValue="NORMAL"
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 bg-white"
                >
                  <option value="NORMAL">Normalne</option>
                  <option value="IMPORTANT">Ważne</option>
                  <option value="URGENT">Pilne</option>
                </select>
                <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer">
                  <input type="checkbox" name="isPinned" className="rounded" />
                  Przypnij
                </label>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? "Dodawanie…" : "Dodaj"}
              </button>
            </div>
            {state?.error && <p className="text-xs text-red-500">{state.error}</p>}
          </form>
        </div>
      )}

      {/* Lista ogłoszeń */}
      {announcements.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white px-4 py-10 text-center text-sm text-zinc-400">
          Brak ogłoszeń.
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => {
            const cfg = PRIORITY_CONFIG[a.priority]
            return (
              <div
                key={a.id}
                className={`rounded-xl border p-4 space-y-2 ${cfg.card}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {a.priority !== "NORMAL" && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                    )}
                    {a.isPinned && (
                      <span className="text-xs font-semibold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                        Przypięte
                      </span>
                    )}
                    <h3 className="font-semibold text-zinc-900">{a.title}</h3>
                  </div>
                  {isOrganizer && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleTogglePin(a.id, a.isPinned)}
                        disabled={pending}
                        className="text-xs text-zinc-400 hover:text-amber-600 transition-colors disabled:opacity-50"
                      >
                        {a.isPinned ? "Odepnij" : "Przypnij"}
                      </button>
                      <button
                        onClick={() => handleDelete(a.id)}
                        disabled={pending}
                        className="text-xs text-zinc-400 hover:text-red-500 transition-colors disabled:opacity-50"
                      >
                        Usuń
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-sm text-zinc-700 whitespace-pre-wrap">{a.content}</p>
                <p className="text-xs text-zinc-400">
                  {a.author.firstName} {a.author.lastName} · {fmtDate(a.createdAt)}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
