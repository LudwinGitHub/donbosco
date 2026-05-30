"use client"
import { useState, useEffect } from "react"
import Link from "next/link"

type VoteBannerProps = {
  scheduledAtISO:  string
  windowOpenAtISO: string
  matchName:       string
  totalVotes:      number
  maxVotes:        number
}

export default function VoteBanner({
  scheduledAtISO,
  windowOpenAtISO,
  matchName,
  totalVotes,
  maxVotes,
}: VoteBannerProps) {
  const [countdown, setCountdown] = useState("")
  const [visible,   setVisible]   = useState(false)

  useEffect(() => {
    const tick = () => {
      const now      = Date.now()
      const windowMs = new Date(windowOpenAtISO).getTime()
      const matchMs  = new Date(scheduledAtISO).getTime()
      const active   = now >= windowMs && now < matchMs && totalVotes < maxVotes
      setVisible(active)
      if (active) setCountdown(fmt(matchMs - now))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [scheduledAtISO, windowOpenAtISO, totalVotes, maxVotes])

  if (!visible) return null

  return (
    <div className="border-b border-green-200 bg-green-50">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="h-2 w-2 shrink-0 rounded-full bg-green-500 animate-pulse" />
          <span className="font-medium text-green-800">Głosowanie otwarte</span>
          <span className="hidden text-green-700 sm:inline">· {matchName}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs tabular-nums text-green-700">{countdown}</span>
          <span className="text-xs text-green-600">{totalVotes}/{maxVotes}</span>
          <Link
            href="/glosowanie"
            className="rounded-lg bg-green-700 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-green-600"
          >
            Głosuj →
          </Link>
        </div>
      </div>
    </div>
  )
}

function fmt(ms: number): string {
  if (ms <= 0) return "0:00:00"
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return `${h}:${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`
}
