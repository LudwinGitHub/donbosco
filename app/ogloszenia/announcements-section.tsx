"use client"
import { useActionState, useOptimistic, useTransition, useState } from "react"
import {
  addAnnouncement,
  deleteAnnouncement,
  togglePin,
  toggleReaction,
  castPollVote,
  type AnnouncementFormState,
} from "@/app/actions/announcements"

type Priority = "NORMAL" | "IMPORTANT" | "URGENT"
type ReactionType = "LIKE" | "HEART" | "ANGRY"

type Reaction = { type: ReactionType; userId: string }
type PollVote = { option: string; userId: string }

type Announcement = {
  id: string
  title: string
  content: string
  isPinned: boolean
  priority: Priority
  createdAt: Date
  author: { firstName: string; lastName: string }
  reactions: Reaction[]
  pollQuestion: string | null
  pollOptA: string | null
  pollOptB: string | null
  pollOptC: string | null
  pollOptD: string | null
  pollVotes: PollVote[]
}

const PRIORITY_CONFIG: Record<Priority, { card: string; badge: string; label: string }> = {
  NORMAL:    { card: "border-zinc-200 bg-white border-l-4 border-l-orange-300", badge: "bg-orange-50 text-orange-600",  label: "Normalne" },
  IMPORTANT: { card: "border-zinc-200 bg-white border-l-4 border-l-orange-500", badge: "bg-orange-100 text-orange-700", label: "Ważne" },
  URGENT:    { card: "border-zinc-200 bg-white border-l-4 border-l-red-500",    badge: "bg-red-100 text-red-600",       label: "Pilne" },
}

const REACTIONS: { type: ReactionType; emoji: string }[] = [
  { type: "LIKE",  emoji: "👍" },
  { type: "HEART", emoji: "❤️" },
  { type: "ANGRY", emoji: "😡" },
]

const POLL_OPTIONS = ["A", "B", "C", "D"] as const

function fmtDate(date: Date) {
  return new Date(date).toLocaleDateString("pl-PL", {
    day: "numeric", month: "short", year: "numeric",
  })
}

// ── Poll section ──────────────────────────────────────────────────────────────

function PollSection({
  a,
  currentUserId,
}: {
  a: Announcement
  currentUserId: string | null
}) {
  const opts: Record<string, string | null> = {
    A: a.pollOptA, B: a.pollOptB, C: a.pollOptC, D: a.pollOptD,
  }
  const activeOpts = POLL_OPTIONS.filter((o) => opts[o])

  const myVote = currentUserId
    ? (a.pollVotes.find((v) => v.userId === currentUserId)?.option ?? null)
    : null

  type OptimisticState = { myVote: string | null; votes: Record<string, number> }

  const initialVotes = Object.fromEntries(
    activeOpts.map((o) => [o, a.pollVotes.filter((v) => v.option === o).length])
  ) as Record<string, number>

  const [optimistic, setOptimistic] = useOptimistic<OptimisticState, string | null>(
    { myVote, votes: initialVotes },
    (state, newOpt) => {
      const votes = { ...state.votes }
      if (state.myVote) votes[state.myVote] = (votes[state.myVote] ?? 1) - 1
      if (newOpt)       votes[newOpt] = (votes[newOpt] ?? 0) + 1
      return { myVote: newOpt, votes }
    }
  )

  const [, startVote] = useTransition()

  const totalVotes = activeOpts.reduce((s, o) => s + (optimistic.votes[o] ?? 0), 0)

  const handleVote = (opt: string) => {
    if (!currentUserId) return
    const newOpt = optimistic.myVote === opt ? null : opt
    startVote(async () => {
      setOptimistic(newOpt)
      await castPollVote(a.id, opt as "A" | "B" | "C" | "D")
    })
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 space-y-2">
      <p className="text-sm font-semibold text-zinc-800">{a.pollQuestion}</p>
      <div className="space-y-1.5">
        {activeOpts.map((opt) => {
          const count = optimistic.votes[opt] ?? 0
          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
          const isActive = optimistic.myVote === opt
          return (
            <button
              key={opt}
              onClick={() => handleVote(opt)}
              disabled={!currentUserId}
              title={!currentUserId ? "Zaloguj się, aby głosować" : undefined}
              className={`relative w-full flex items-center gap-2 rounded-lg border px-3 py-2.5 min-h-[44px] text-left text-sm transition-all overflow-hidden
                ${isActive
                  ? "border-orange-400 bg-orange-50 font-semibold text-orange-700"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
                }
                disabled:cursor-default`}
            >
              {/* Progress bar behind */}
              <span
                className={`absolute inset-y-0 left-0 transition-all ${isActive ? "bg-orange-100" : "bg-zinc-100"}`}
                style={{ width: `${pct}%` }}
              />
              <span className="relative shrink-0 w-5 h-5 flex items-center justify-center rounded-full border text-[11px] font-bold
                border-current">{opt}</span>
              <span className="relative flex-1 truncate">{opts[opt]}</span>
              <span className="relative shrink-0 text-xs text-zinc-400 tabular-nums">{pct}%</span>
            </button>
          )
        })}
      </div>
      <p className="text-[11px] text-zinc-400">
        {totalVotes} {totalVotes === 1 ? "głos" : totalVotes >= 2 && totalVotes <= 4 ? "głosy" : "głosów"}
        {myVote && " · Twój głos: " + myVote}
      </p>
    </div>
  )
}

// ── Per-card component with optimistic reactions ──────────────────────────────

function AnnouncementCard({
  a,
  currentUserId,
  isOrganizer,
  onDelete,
  onTogglePin,
  disabled,
}: {
  a: Announcement
  currentUserId: string | null
  isOrganizer: boolean
  onDelete: (id: string) => void
  onTogglePin: (id: string, isPinned: boolean) => void
  disabled: boolean
}) {
  const cfg = PRIORITY_CONFIG[a.priority]

  const myCurrentReaction = currentUserId
    ? (a.reactions.find((r) => r.userId === currentUserId)?.type ?? null)
    : null

  const initialCounts = {
    LIKE:  a.reactions.filter((r) => r.type === "LIKE").length,
    HEART: a.reactions.filter((r) => r.type === "HEART").length,
    ANGRY: a.reactions.filter((r) => r.type === "ANGRY").length,
  }

  type OptimisticState = { myReaction: ReactionType | null; counts: typeof initialCounts }

  const [optimistic, setOptimistic] = useOptimistic<OptimisticState, ReactionType | null>(
    { myReaction: myCurrentReaction, counts: initialCounts },
    (state, newType) => {
      const counts = { ...state.counts }
      if (state.myReaction) counts[state.myReaction]--
      if (newType)          counts[newType]++
      return { myReaction: newType, counts }
    }
  )

  const [, startReaction] = useTransition()

  const handleReaction = (type: ReactionType) => {
    if (!currentUserId) return
    const newType = optimistic.myReaction === type ? null : type
    startReaction(async () => {
      setOptimistic(newType)
      await toggleReaction(a.id, type)
    })
  }

  const hasPoll = !!a.pollQuestion && !!a.pollOptA && !!a.pollOptB

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${cfg.card}`}>
      {/* Nagłówek */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {a.priority !== "NORMAL" && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
              {cfg.label}
            </span>
          )}
          {a.isPinned && (
            <span className="text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
              Przypięte
            </span>
          )}
          <h3 className="font-semibold text-zinc-900">{a.title}</h3>
        </div>
        {isOrganizer && (
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => onTogglePin(a.id, a.isPinned)}
              disabled={disabled}
              className="min-h-[44px] px-2 text-xs text-zinc-400 hover:text-amber-600 transition-colors disabled:opacity-50"
            >
              {a.isPinned ? "Odepnij" : "Przypnij"}
            </button>
            <button
              onClick={() => onDelete(a.id)}
              disabled={disabled}
              className="min-h-[44px] px-2 text-xs text-zinc-400 hover:text-red-500 transition-colors disabled:opacity-50"
            >
              Usuń
            </button>
          </div>
        )}
      </div>

      {/* Treść */}
      <p className="text-sm text-zinc-700 whitespace-pre-wrap">{a.content}</p>

      {/* Ankieta */}
      {hasPoll && <PollSection a={a} currentUserId={currentUserId} />}

      {/* Stopka: meta + reakcje */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs text-zinc-400">
          {a.author.firstName} {a.author.lastName} · {fmtDate(a.createdAt)}
        </p>

        <div className="flex items-center gap-1">
          {REACTIONS.map(({ type, emoji }) => {
            const count = optimistic.counts[type]
            const isActive = optimistic.myReaction === type
            return (
              <button
                key={type}
                onClick={() => handleReaction(type)}
                disabled={!currentUserId}
                title={!currentUserId ? "Zaloguj się, aby reagować" : undefined}
                className={`flex items-center gap-1 px-2 py-2 min-h-[44px] rounded-lg text-xs font-medium transition-all
                  ${isActive
                    ? "bg-zinc-900 text-white"
                    : count > 0
                      ? "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                      : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                  }
                  disabled:cursor-default`}
              >
                <span>{emoji}</span>
                {count > 0 && <span>{count}</span>}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Poll form fields ──────────────────────────────────────────────────────────

function PollFields() {
  return (
    <div className="space-y-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Ankieta</p>
      <input
        name="pollQuestion"
        placeholder="Pytanie ankiety…"
        className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
      />
      <div className="grid grid-cols-2 gap-2">
        {(["A", "B", "C", "D"] as const).map((opt, i) => (
          <input
            key={opt}
            name={`pollOpt${opt}`}
            placeholder={`Opcja ${opt}${i >= 2 ? " (opcjonalna)" : ""}`}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
          />
        ))}
      </div>
    </div>
  )
}

// ── Main section ──────────────────────────────────────────────────────────────

export default function AnnouncementsSection({
  announcements,
  currentUserId,
  isOrganizer,
}: {
  announcements: Announcement[]
  currentUserId: string | null
  isOrganizer: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [formKey, setFormKey] = useState(0)
  const [showPoll, setShowPoll] = useState(false)
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
      {/* Formularz organizatora */}
      {isOrganizer && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Nowe ogłoszenie</p>
          <form
            key={formKey}
            action={(fd) => { action(fd); setFormKey((k) => k + 1); setShowPoll(false) }}
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

            {/* Hidden hasPoll checkbox — driven by state */}
            <input type="hidden" name="hasPoll" value={showPoll ? "on" : "off"} />

            {showPoll && <PollFields />}

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
                <button
                  type="button"
                  onClick={() => setShowPoll((v) => !v)}
                  className={`text-sm px-2.5 py-1 rounded-lg border transition-colors ${
                    showPoll
                      ? "border-orange-400 bg-orange-50 text-orange-700 font-semibold"
                      : "border-zinc-300 text-zinc-500 hover:bg-zinc-50"
                  }`}
                >
                  📊 Ankieta
                </button>
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

      {/* Lista */}
      {announcements.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white px-4 py-10 text-center text-sm text-zinc-400">
          Brak ogłoszeń.
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <AnnouncementCard
              key={a.id}
              a={a}
              currentUserId={currentUserId}
              isOrganizer={isOrganizer}
              onDelete={handleDelete}
              onTogglePin={handleTogglePin}
              disabled={pending}
            />
          ))}
        </div>
      )}
    </div>
  )
}
