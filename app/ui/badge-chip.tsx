'use client'

import { useState } from 'react'
import type { BadgeType } from "@/lib/badges"

const BADGE_CONFIG: Record<BadgeType, { emoji: string; label: string; className: string }> = {
  "striker":       { emoji: "⚽", label: "Striker",       className: "bg-amber-100 text-amber-800 border-amber-200" },
  "playmaker":     { emoji: "🎯", label: "Playmaker",      className: "bg-blue-100 text-blue-800 border-blue-200" },
  "hero-goal":     { emoji: "🔥", label: "Hero (gole)",    className: "bg-orange-100 text-orange-800 border-orange-200" },
  "hero-assist":   { emoji: "💫", label: "Hero (asysty)",  className: "bg-purple-100 text-purple-800 border-purple-200" },
  "hat-trick":     { emoji: "🎩", label: "Hat-trick",      className: "bg-red-100 text-red-800 border-red-200" },
  "on-fire":       { emoji: "🔥", label: "On Fire",        className: "bg-rose-100 text-rose-800 border-rose-200" },
  "assist-streak": { emoji: "🎯", label: "Seria asyst",    className: "bg-sky-100 text-sky-800 border-sky-200" },
  "iron-man":      { emoji: "🦾", label: "Iron Man",       className: "bg-slate-100 text-slate-700 border-slate-200" },
  "veteran":       { emoji: "🎖", label: "Weteran",        className: "bg-zinc-100 text-zinc-600 border-zinc-200" },
  "mvp-legend":    { emoji: "⭐", label: "MVP Legend",     className: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  "deadly-duo":    { emoji: "🤝", label: "Deadly Duo",     className: "bg-pink-100 text-pink-800 border-pink-200" },
}

export default function BadgeChip({ type }: { type: BadgeType }) {
  const cfg = BADGE_CONFIG[type]
  const [open, setOpen] = useState(false)

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={(e) => { e.stopPropagation(); setOpen(o => !o) }}
    >
      <span
        className={`inline-flex cursor-pointer select-none items-center rounded-full border px-1.5 py-0.5 text-[11px] leading-none ${cfg.className}`}
      >
        {cfg.emoji}
      </span>
      {open && (
        <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-zinc-900 px-2 py-1 text-[11px] font-medium text-white">
          {cfg.emoji} {cfg.label}
          <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-zinc-900" />
        </span>
      )}
    </span>
  )
}
