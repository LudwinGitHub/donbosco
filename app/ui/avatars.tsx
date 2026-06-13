export type AvatarId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

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
