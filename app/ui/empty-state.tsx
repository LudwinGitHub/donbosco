export default function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-white px-6 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
        {icon}
      </span>
      <div>
        <p className="text-sm font-semibold text-zinc-600">{title}</p>
        {description && <p className="mt-0.5 text-xs text-zinc-400">{description}</p>}
      </div>
    </div>
  )
}

export function IconCalendar() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

export function IconTrophy() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21h8M12 17v4M17 3H7v8a5 5 0 0 0 10 0V3z" />
      <path d="M7 4H4a2 2 0 0 0-2 2v1a4 4 0 0 0 4 4h1" />
      <path d="M17 4h3a2 2 0 0 1 2 2v1a4 4 0 0 1-4 4h-1" />
    </svg>
  )
}

export function IconUsers() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

export function IconVote() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10" />
      <path d="M12 20V4" />
      <path d="M6 20v-6" />
    </svg>
  )
}
