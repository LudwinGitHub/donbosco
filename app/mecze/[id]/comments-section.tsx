"use client"
import { useActionState, useEffect, useTransition, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { addComment, deleteComment, type CommentFormState } from "@/app/actions/comments"

type Comment = {
  id: string
  text: string
  createdAt: Date
  userId: string
  user: { firstName: string; lastName: string }
}

type Props = {
  matchId: string
  comments: Comment[]
  currentUserId: string | null
  isOrganizer: boolean
}

function formatDate(date: Date): string {
  const now = new Date()
  const d = new Date(date)
  const diffMs = now.getTime() - d.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)

  if (diffMinutes < 60) {
    return `${diffMinutes < 1 ? 1 : diffMinutes} min temu`
  }

  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()

  if (isToday) {
    const hh = String(d.getHours()).padStart(2, "0")
    const mm = String(d.getMinutes()).padStart(2, "0")
    return `dziś ${hh}:${mm}`
  }

  return d.toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export default function CommentsSection({ matchId, comments, currentUserId, isOrganizer }: Props) {
  const router = useRouter()
  const [deletePending, startDeleteTransition] = useTransition()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [formKey, setFormKey] = useState(0)
  const [submitted, setSubmitted] = useState(false)

  const boundAdd = addComment.bind(null, matchId)
  const [state, action, pending] = useActionState<CommentFormState, FormData>(boundAdd, undefined)

  useEffect(() => {
    if (submitted && state === undefined) {
      router.refresh()
      setFormKey((k) => k + 1)
      setSubmitted(false)
    }
  }, [state, submitted, router])

  const handleDelete = (commentId: string) => {
    startDeleteTransition(async () => {
      await deleteComment(commentId, matchId)
      router.refresh()
    })
  }

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
        Komentarze {comments.length > 0 && `(${comments.length})`}
      </h2>

      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        {comments.length === 0 && !currentUserId ? (
          <p className="px-4 py-6 text-center text-sm text-zinc-400">Brak komentarzy.</p>
        ) : (
          <>
            {comments.length > 0 && (
              <div className="divide-y divide-zinc-100">
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span
                          className={`text-sm font-medium ${
                            c.userId === currentUserId ? "text-zinc-900" : "text-zinc-700"
                          }`}
                        >
                          {c.user.firstName} {c.user.lastName}
                          {c.userId === currentUserId && (
                            <span className="ml-1 text-xs font-normal text-zinc-400">(ty)</span>
                          )}
                        </span>
                        <span className="text-xs text-zinc-400">{formatDate(c.createdAt)}</span>
                      </div>
                      <p className="mt-0.5 text-sm text-zinc-700 whitespace-pre-wrap break-words">
                        {c.text}
                      </p>
                    </div>
                    {(c.userId === currentUserId || isOrganizer) && (
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={deletePending}
                        className="shrink-0 text-xs text-zinc-400 hover:text-red-500 transition-colors disabled:opacity-50"
                      >
                        Usuń
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {currentUserId && (
              <div
                className={`${comments.length > 0 ? "border-t border-zinc-100" : ""} px-4 py-3`}
              >
                <form
                  key={formKey}
                  action={(formData) => {
                    setSubmitted(true)
                    action(formData)
                  }}
                  className="space-y-2"
                >
                  <textarea
                    ref={textareaRef}
                    name="text"
                    placeholder="Napisz komentarz…"
                    rows={2}
                    maxLength={500}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 resize-none"
                  />
                  {state?.error && (
                    <p className="text-xs text-red-500">{state.error}</p>
                  )}
                  <button
                    type="submit"
                    disabled={pending}
                    className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
                  >
                    {pending ? "Wysyłanie…" : "Wyślij"}
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
