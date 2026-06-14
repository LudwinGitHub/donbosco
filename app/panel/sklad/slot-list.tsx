"use client"
import { useTransition, useState } from "react"
import { useRouter } from "next/navigation"
import { addGroupSlot, removeGroupSlot, moveGroupSlot } from "@/app/actions/group-slots"

type Slot = { userId: string; position: number; name: string; nickname: string | null }
type AvailableUser = { id: string; name: string; nickname: string | null }

export default function SlotList({
  slots,
  availableUsers,
}: {
  slots: Slot[]
  availableUsers: AvailableUser[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [selectedUserId, setSelectedUserId] = useState("")

  function handleRemove(userId: string) {
    startTransition(async () => {
      await removeGroupSlot(userId)
      router.refresh()
    })
  }

  function handleMove(userId: string, dir: "up" | "down") {
    startTransition(async () => {
      await moveGroupSlot(userId, dir)
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {/* Slot list */}
      <div className="rounded-xl border border-zinc-200 border-t-2 border-t-orange-500 bg-white overflow-hidden divide-y divide-zinc-100">
        {slots.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-zinc-400">Brak graczy w składzie bazowym.</p>
        ) : (
          slots.map((slot, i) => (
            <div key={slot.userId} className={`flex items-center gap-3 px-4 py-3 ${slot.position === 14 ? "border-b-2 border-b-orange-200" : ""}`}>
              <span className={`w-7 shrink-0 text-right text-sm font-bold tabular-nums ${slot.position <= 14 ? "text-orange-500" : "text-zinc-300"}`}>
                {slot.position}
              </span>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-zinc-900">{slot.name}</span>
                {slot.nickname && <span className="ml-2 text-xs text-zinc-400">„{slot.nickname}"</span>}
              </div>
              {slot.position <= 14 ? (
                <span className="shrink-0 rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-orange-600">grający</span>
              ) : (
                <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500">rezerwa</span>
              )}
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => handleMove(slot.userId, "up")}
                  disabled={pending || i === 0}
                  className="rounded p-1 text-zinc-400 hover:bg-zinc-100 disabled:opacity-20"
                  title="W górę"
                >↑</button>
                <button
                  onClick={() => handleMove(slot.userId, "down")}
                  disabled={pending || i === slots.length - 1}
                  className="rounded p-1 text-zinc-400 hover:bg-zinc-100 disabled:opacity-20"
                  title="W dół"
                >↓</button>
                <button
                  onClick={() => handleRemove(slot.userId)}
                  disabled={pending}
                  className="rounded p-1 text-red-400 hover:bg-red-50 disabled:opacity-20"
                  title="Usuń"
                >×</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add user form */}
      {availableUsers.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Dodaj gracza</p>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!selectedUserId) return
              const fd = new FormData()
              fd.set("userId", selectedUserId)
              startTransition(async () => {
                await addGroupSlot(undefined, fd)
                setSelectedUserId("")
                router.refresh()
              })
            }}
            className="flex gap-2"
          >
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
            >
              <option value="">Wybierz gracza…</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}{u.nickname ? ` „${u.nickname}"` : ""}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={pending || !selectedUserId}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-40"
            >
              Dodaj
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
