'use client'

import { useState } from 'react'
import type { BadgeType } from "@/lib/badges"

const BADGE_CONFIG: Record<BadgeType, { emoji: string; label: string }> = {
  "striker":       { emoji: "⚽", label: "Striker"       },
  "playmaker":     { emoji: "🎯", label: "Playmaker"     },
  "hero-goal":     { emoji: "🔥", label: "Hero (gole)"   },
  "hero-assist":   { emoji: "💫", label: "Hero (asysty)" },
  "hat-trick":     { emoji: "🎩", label: "Hat-trick"     },
  "on-fire":       { emoji: "🔥", label: "On Fire"       },
  "assist-streak": { emoji: "🎯", label: "Seria asyst"   },
  "iron-man":      { emoji: "🦾", label: "Iron Man"      },
  "veteran":       { emoji: "🎖",  label: "Weteran"       },
  "mvp-legend":    { emoji: "⭐", label: "MVP Legend"    },
  "deadly-duo":    { emoji: "🤝", label: "Deadly Duo"    },
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
      <span className="inline-flex cursor-pointer select-none items-center rounded-full border border-orange-500/60 bg-orange-500/10 px-2 py-0.5 text-xs leading-none shadow-sm text-orange-600">
        {cfg.emoji}
      </span>
      {open && (
        <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-orange-400/30 bg-zinc-900 px-2.5 py-1 text-[11px] font-semibold text-white">
          {cfg.emoji} {cfg.label}
          <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-zinc-900" />
        </span>
      )}
    </span>
  )
}
