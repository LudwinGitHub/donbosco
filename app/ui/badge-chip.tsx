import type { BadgeType } from "@/lib/badges"

const BADGE_CONFIG: Record<BadgeType, { label: string; className: string }> = {
  "striker":       { label: "⚽ Striker",       className: "bg-amber-100 text-amber-700 border-amber-200" },
  "playmaker":     { label: "🎯 Playmaker",      className: "bg-blue-100 text-blue-700 border-blue-200" },
  "hero-goal":     { label: "🔥 Hero",           className: "bg-orange-100 text-orange-700 border-orange-200" },
  "hero-assist":   { label: "💫 Hero",           className: "bg-purple-100 text-purple-700 border-purple-200" },
  "hat-trick":     { label: "🎩 Hat-trick",      className: "bg-red-100 text-red-700 border-red-200" },
  "on-fire":       { label: "🔥 On Fire",        className: "bg-rose-100 text-rose-700 border-rose-200" },
  "assist-streak": { label: "🎯 Seria asyst",    className: "bg-sky-100 text-sky-700 border-sky-200" },
  "iron-man":      { label: "🦾 Iron Man",       className: "bg-slate-100 text-slate-700 border-slate-200" },
  "veteran":       { label: "🎖 Weteran",        className: "bg-zinc-100 text-zinc-600 border-zinc-200" },
  "champion":      { label: "🏆 Champion",       className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  "mvp-legend":    { label: "⭐ MVP Legend",     className: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  "goals-5":       { label: "⚽ 5 goli",         className: "bg-lime-100 text-lime-700 border-lime-200" },
  "goals-10":      { label: "⚽ 10 goli",        className: "bg-green-100 text-green-700 border-green-200" },
  "goals-15":      { label: "⚽ 15 goli",        className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  "deadly-duo":    { label: "🤝 Deadly Duo",     className: "bg-pink-100 text-pink-700 border-pink-200" },
}

export default function BadgeChip({ type }: { type: BadgeType }) {
  const cfg = BADGE_CONFIG[type]
  return (
    <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold leading-none ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}
