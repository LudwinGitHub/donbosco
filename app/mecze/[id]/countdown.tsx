"use client"
import { useEffect, useState } from "react"

export default function Countdown({ scheduledAt }: { scheduledAt: string }) {
  const [display, setDisplay] = useState<string | null>(null)

  useEffect(() => {
    const target = new Date(scheduledAt).getTime()

    const update = () => {
      const diff = target - Date.now()
      if (diff <= 0) {
        setDisplay(null)
        return
      }
      const totalSeconds = Math.floor(diff / 1000)
      const days = Math.floor(totalSeconds / 86400)
      const hours = Math.floor((totalSeconds % 86400) / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      const seconds = totalSeconds % 60

      if (days >= 2) {
        setDisplay(`Za ${days} ${days === 1 ? "dzień" : "dni"}`)
      } else {
        const pad = (n: number) => String(n).padStart(2, "0")
        setDisplay(`Za ${days > 0 ? `${days}d ` : ""}${pad(hours)}:${pad(minutes)}:${pad(seconds)}`)
      }
    }

    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [scheduledAt])

  if (!display) return null

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-mono font-medium text-amber-700">
      ⏱ {display}
    </span>
  )
}
