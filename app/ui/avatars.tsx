export type AvatarId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15

export const AVATARS: Array<{
  id: AvatarId
  name: string
  from: string
  to: string
  Icon: (props: { size: number }) => React.ReactElement
}> = [
  {
    id: 1,
    name: "Kapitan",
    from: "#f59e0b", to: "#d97706",
    Icon: ({ size: s }) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <path d="M5 18h14l-3-9-3 5-3-9-3 5z" fill="white" />
        <rect x="5" y="18" width="14" height="2.5" rx="1.25" fill="white" />
        <circle cx="5"  cy="9" r="1.5" fill="white" />
        <circle cx="12" cy="5" r="1.5" fill="white" />
        <circle cx="19" cy="9" r="1.5" fill="white" />
      </svg>
    ),
  },
  {
    id: 2,
    name: "Błyskawica",
    from: "#6366f1", to: "#4f46e5",
    Icon: ({ size: s }) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <path d="M13 2L4 14h7l-1 8 9-12h-7z" fill="white" />
      </svg>
    ),
  },
  {
    id: 3,
    name: "Obrońca",
    from: "#10b981", to: "#059669",
    Icon: ({ size: s }) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <path d="M12 3L4 7v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V7z" fill="white" opacity="0.9" />
        <polyline points="8,12 11,15 16,9" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    ),
  },
  {
    id: 4,
    name: "Płomień",
    from: "#ef4444", to: "#dc2626",
    Icon: ({ size: s }) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <path d="M12 2c0 0-7 7-7 13 0 3.9 3.1 7 7 7s7-3.1 7-7c0-3-2-5.5-2-5.5s-1 2.5-3 3.5c0 0 1-5-2-11z" fill="white" />
        <path d="M12 14c0 0-2.5 2-2.5 4 0 1.4 1.1 2.5 2.5 2.5S14.5 19.4 14.5 18c0-1.5-2.5-4-2.5-4z" fill="white" opacity="0.45" />
      </svg>
    ),
  },
  {
    id: 5,
    name: "Gwiazda",
    from: "#f97316", to: "#ea580c",
    Icon: ({ size: s }) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <polygon
          points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
          fill="white"
        />
      </svg>
    ),
  },
  {
    id: 6,
    name: "Diament",
    from: "#ec4899", to: "#db2777",
    Icon: ({ size: s }) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <polygon points="12,2 22,10 12,22 2,10" fill="white" />
        <polygon points="12,7 18,11 12,18 6,11" fill="white" opacity="0.35" />
        <line x1="2" y1="10" x2="22" y2="10" stroke="#db2777" strokeWidth="0.75" />
      </svg>
    ),
  },
  {
    id: 7,
    name: "Orzeł",
    from: "#0ea5e9", to: "#0284c7",
    Icon: ({ size: s }) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <path d="M12 8 L3 14 L5 18 L12 15 L19 18 L21 14 Z" fill="white" />
        <path d="M12 8 L12 21" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="6" r="2.5" fill="white" />
      </svg>
    ),
  },
  {
    id: 8,
    name: "Góral",
    from: "#14b8a6", to: "#0d9488",
    Icon: ({ size: s }) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <polygon points="12,3 22,21 2,21" fill="white" />
        <polygon points="12,9 18,21 6,21"  fill="white" opacity="0.4" />
        <polygon points="7,21 11,13 15,21" fill="white" opacity="0.2" />
      </svg>
    ),
  },
  {
    id: 9,
    name: "Tarcza",
    from: "#8b5cf6", to: "#7c3aed",
    Icon: ({ size: s }) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <path d="M12 3L4 7v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V7z" fill="white" opacity="0.9" />
        <path d="M12 3L4 7v6c0 5 3.5 9 8 10" fill="white" opacity="0.35" />
        <line x1="12" y1="8" x2="12" y2="16" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" />
        <line x1="8"  y1="12" x2="16" y2="12" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 10,
    name: "Trofeum",
    from: "#eab308", to: "#ca8a04",
    Icon: ({ size: s }) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <path d="M8 3h8v7a4 4 0 0 1-8 0V3z" fill="white" />
        <path d="M8 5H5a3 3 0 0 0 0 6h3" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M16 5h3a3 3 0 0 1 0 6h-3" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <rect x="10" y="14" width="4" height="4" fill="white" />
        <rect x="7"  y="18" width="10" height="2.5" rx="1.25" fill="white" />
      </svg>
    ),
  },
  {
    id: 11,
    name: "Rakieta",
    from: "#a855f7", to: "#7c3aed",
    Icon: ({ size: s }) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <path d="M12 2 L14.5 8 L14.5 15 L12 18.5 L9.5 15 L9.5 8 Z" fill="white" />
        <path d="M9.5 12.5 L6 17.5 L9.5 15.5 Z" fill="white" opacity="0.8" />
        <path d="M14.5 12.5 L18 17.5 L14.5 15.5 Z" fill="white" opacity="0.8" />
        <circle cx="12" cy="9" r="1.8" fill="white" opacity="0.35" />
        <path d="M10.5 18.5 Q12 22 13.5 18.5" fill="white" opacity="0.6" />
      </svg>
    ),
  },
  {
    id: 12,
    name: "Księżyc",
    from: "#3b82f6", to: "#1d4ed8",
    Icon: ({ size: s }) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="white" />
      </svg>
    ),
  },
  {
    id: 13,
    name: "Korona",
    from: "#d97706", to: "#92400e",
    Icon: ({ size: s }) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <path d="M3 17 L6.5 10 L10 14.5 L12 6 L14 14.5 L17.5 10 L21 17 Z" fill="white" />
        <rect x="3" y="17" width="18" height="3" rx="1.5" fill="white" />
        <circle cx="12" cy="6" r="1.5" fill="white" opacity="0.4" />
      </svg>
    ),
  },
  {
    id: 14,
    name: "Fala",
    from: "#06b6d4", to: "#0e7490",
    Icon: ({ size: s }) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <path d="M2 10 Q5 6 8 10 Q11 14 14 10 Q17 6 22 10" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M2 15 Q5 11 8 15 Q11 19 14 15 Q17 11 22 15" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.5" />
      </svg>
    ),
  },
  {
    id: 15,
    name: "Sześcian",
    from: "#64748b", to: "#334155",
    Icon: ({ size: s }) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <polygon points="12,3 21,7.5 21,16.5 12,21 3,16.5 3,7.5" fill="white" opacity="0.25" />
        <polygon points="12,3 21,7.5 12,12 3,7.5" fill="white" opacity="0.9" />
        <polygon points="3,7.5 12,12 12,21 3,16.5" fill="white" opacity="0.6" />
        <polygon points="21,7.5 12,12 12,21 21,16.5" fill="white" opacity="0.4" />
      </svg>
    ),
  },
]

export function getAvatar(id: number | null | undefined) {
  if (!id) return null
  return AVATARS.find((a) => a.id === id) ?? null
}

// Renders the avatar circle — used in PlayerAvatar and AvatarPicker
export function AvatarCircle({
  avatarId,
  sizeClass,
  iconSize,
}: {
  avatarId: number
  sizeClass: string
  iconSize: number
}) {
  const av = getAvatar(avatarId)
  if (!av) return null
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full ${sizeClass}`}
      style={{ background: `linear-gradient(135deg, ${av.from}, ${av.to})` }}
      aria-label={av.name}
    >
      <av.Icon size={iconSize} />
    </span>
  )
}
