import type { BadgeType } from "@/lib/badges"

const BADGE_CONFIG: Record<BadgeType, { label: string; className: string }> = {
  striker:      { label: "⚽ Striker",    className: "bg-amber-100 text-amber-700 border-amber-200" },
  playmaker:    { label: "🎯 Playmaker",  className: "bg-blue-100 text-blue-700 border-blue-200" },
  "hero-goal":  { label: "🔥 Hero",       className: "bg-orange-100 text-orange-700 border-orange-200" },
  "hero-assist":{ label: "💫 Hero",       className: "bg-purple-100 text-purple-700 border-purple-200" },
}

export default function BadgeChip({ type }: { type: BadgeType }) {
  const cfg = BADGE_CONFIG[type]
  return (
    <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold leading-none ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}
