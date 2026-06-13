'use client'

import React, { useState } from 'react'
import type { BadgeType } from "@/lib/badges"

// ── SVG icons — 14×14, stroke-based, currentColor ────────────────────────────

function IcoStriker() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polygon points="12,6 15.5,9.5 14,14 10,14 8.5,9.5" fill="currentColor" stroke="none" />
      <line x1="12" y1="6" x2="12" y2="2" />
      <line x1="15.5" y1="9.5" x2="19.5" y2="8" />
      <line x1="14" y1="14" x2="17" y2="17.5" />
      <line x1="10" y1="14" x2="7" y2="17.5" />
      <line x1="8.5" y1="9.5" x2="4.5" y2="8" />
    </svg>
  )
}

function IcoPlaymaker() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

function IcoHeroGoal() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z" />
    </svg>
  )
}

function IcoHeroAssist() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.937A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  )
}

function IcoHatTrick() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.905 9.5A1.9 1.9 0 0 1 17.19 17H6.81a1.9 1.9 0 0 1-1.886-1.481L2.02 6.019a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z" />
      <line x1="4" y1="21" x2="20" y2="21" />
    </svg>
  )
}

function IcoOnFire() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L4.5 13.5H12L11 22L19.5 10.5H13L13 2z" />
    </svg>
  )
}

function IcoAssistStreak() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2 8 6 12 2 16" />
      <polyline points="9 8 13 12 9 16" />
      <polyline points="16 8 20 12 16 16" />
    </svg>
  )
}

function IcoIronMan() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  )
}

function IcoVeteran() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  )
}

function IcoMvpLegend() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
    </svg>
  )
}

function IcoDeadlyDuo() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="12" r="6" />
      <circle cx="16" cy="12" r="6" />
    </svg>
  )
}

// ── Config ────────────────────────────────────────────────────────────────────

const BADGE_CONFIG: Record<BadgeType, { Icon: React.FC; label: string }> = {
  "striker":       { Icon: IcoStriker,      label: "Striker"       },
  "playmaker":     { Icon: IcoPlaymaker,    label: "Playmaker"     },
  "hero-goal":     { Icon: IcoHeroGoal,     label: "Hero (gole)"   },
  "hero-assist":   { Icon: IcoHeroAssist,   label: "Hero (asysty)" },
  "hat-trick":     { Icon: IcoHatTrick,     label: "Hat-trick"     },
  "on-fire":       { Icon: IcoOnFire,       label: "On Fire"       },
  "assist-streak": { Icon: IcoAssistStreak, label: "Seria asyst"   },
  "iron-man":      { Icon: IcoIronMan,      label: "Iron Man"      },
  "veteran":       { Icon: IcoVeteran,      label: "Weteran"       },
  "mvp-legend":    { Icon: IcoMvpLegend,    label: "MVP Legend"    },
  "deadly-duo":    { Icon: IcoDeadlyDuo,    label: "Deadly Duo"    },
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function BadgeChip({ type }: { type: BadgeType }) {
  const { Icon, label } = BADGE_CONFIG[type]
  const [open, setOpen] = useState(false)

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={(e) => { e.stopPropagation(); setOpen(o => !o) }}
    >
      {/* Chip */}
      <span className="inline-flex cursor-pointer select-none items-center rounded-full border border-orange-500/50 bg-orange-500/10 p-1 shadow-sm text-orange-600 dark:border-orange-500/40 dark:bg-orange-500/[0.12] dark:text-orange-400">
        <Icon />
      </span>

      {/* Tooltip */}
      {open && (
        <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-zinc-700/60 bg-zinc-900 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-lg dark:border-white/10 dark:bg-zinc-800 max-sm:left-0 max-sm:translate-x-0">
          {label}
          <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-zinc-900 dark:border-t-zinc-800 max-sm:left-3 max-sm:translate-x-0" />
        </span>
      )}
    </span>
  )
}
