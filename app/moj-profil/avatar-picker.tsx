"use client"
import { useOptimistic, useTransition } from "react"
import { AVATARS, AvatarCircle } from "@/app/ui/avatars"
import { updatePlayerAvatar } from "@/app/actions/update-avatar"
import { toast } from "sonner"

export default function AvatarPicker({ current }: { current: number | null }) {
  const [pending, startTransition] = useTransition()
  const [selected, setSelected] = useOptimistic(current)

  function pick(id: number) {
    const next = selected === id ? null : id
    startTransition(async () => {
      setSelected(next)
      try {
        await updatePlayerAvatar(next)
      } catch {
        toast.error("Nie udało się zapisać awatara.")
      }
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Awatar</p>
        {selected && (
          <button
            onClick={() => pick(selected)}
            disabled={pending}
            className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            Usuń awatar
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-3">
        {AVATARS.map((av) => {
          const active = selected === av.id
          return (
            <button
              key={av.id}
              onClick={() => pick(av.id)}
              disabled={pending}
              title={av.name}
              className={`group flex flex-col items-center gap-1.5 rounded-xl p-1.5 sm:p-2 transition-all ${
                active
                  ? "bg-orange-50 ring-2 ring-orange-500"
                  : "hover:bg-zinc-50 ring-1 ring-transparent hover:ring-zinc-200"
              }`}
            >
              <AvatarCircle avatarId={av.id} sizeClass="h-11 w-11" iconSize={22} />
              <span className={`text-[10px] font-medium leading-none ${active ? "text-orange-600" : "text-zinc-400"}`}>
                {av.name}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
