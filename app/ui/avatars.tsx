import React from "react"

export type AvatarId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11

export const AVATARS: Array<{
  id: AvatarId
  name: string
  from: string
  to: string
  Icon: (props: { size: number }) => React.ReactElement
}> = [

  // ── 1. Real Madrid — korona królewska ─────────────────────────────────────
  {
    id: 1, name: "Real Madrid", from: "#6d28d9", to: "#312e81",
    Icon: ({ size: s }) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        {/* Podstawa */}
        <rect x="4" y="16.5" width="16" height="3" rx="1.5" fill="white" />
        {/* Trzy zęby korony */}
        <path d="M4 16.5 L6.5 9 L10 14 L12 5.5 L14 14 L17.5 9 L20 16.5Z" fill="white" />
        {/* Kulki na szczytach */}
        <circle cx="6.5"  cy="8"   r="1.6" fill="white" opacity="0.75" />
        <circle cx="12"   cy="4.5" r="1.6" fill="white" opacity="0.75" />
        <circle cx="17.5" cy="8"   r="1.6" fill="white" opacity="0.75" />
      </svg>
    ),
  },

  // ── 2. FC Barcelona — pasy blaugrana ─────────────────────────────────────
  {
    id: 2, name: "FC Barcelona", from: "#1e40af", to: "#9b1c1c",
    Icon: ({ size: s }) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        {/* 4 pionowe pasy blaugrana — naprzemiennie pełne/półprzezroczyste */}
        <rect x="4"    y="4" width="3.5" height="16" rx="1" fill="white" />
        <rect x="8.5"  y="4" width="3.5" height="16" rx="1" fill="white" opacity="0.3" />
        <rect x="13"   y="4" width="3.5" height="16" rx="1" fill="white" />
        <rect x="17.5" y="4" width="3.5" height="16" rx="1" fill="white" opacity="0.3" />
        {/* Krzyż kataloński u góry */}
        <rect x="3.5" y="3.5" width="17" height="2.5" rx="1" fill="white" opacity="0.85" />
      </svg>
    ),
  },

  // ── 3. PSG — wieża Eiffla ────────────────────────────────────────────────
  {
    id: 3, name: "PSG", from: "#1e3a8a", to: "#7f1d1d",
    Icon: ({ size: s }) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        {/* Sylwetka wieży */}
        <path
          d="M12 2 L13.5 8.5 L17.5 10.5 L15.5 13 L16.5 21 L7.5 21 L8.5 13 L6.5 10.5 L10.5 8.5Z"
          fill="white"
        />
        {/* Poziome belki */}
        <rect x="7"   y="13.5" width="10" height="1.5" rx="0.75" fill="white" opacity="0.35" />
        <rect x="9.5" y="10"   width="5"  height="1.2" rx="0.6"  fill="white" opacity="0.35" />
      </svg>
    ),
  },

  // ── 4. Arsenal — armata ──────────────────────────────────────────────────
  {
    id: 4, name: "Arsenal", from: "#ef4444", to: "#991b1b",
    Icon: ({ size: s }) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        {/* Lufa */}
        <rect x="2" y="9" width="15" height="5.5" rx="2.75" fill="white" />
        {/* Wylot lufy */}
        <rect x="16.5" y="10" width="5" height="3.5" rx="1.75" fill="white" />
        {/* Dwa koła */}
        <circle cx="7"  cy="16" r="2.8" fill="white" />
        <circle cx="12" cy="16" r="2.8" fill="white" />
        {/* Oś kół */}
        <rect x="6" y="15.2" width="7" height="1.5" rx="0.75" fill="white" opacity="0.4" />
      </svg>
    ),
  },

  // ── 5. Manchester United — Czerwony Diabeł ───────────────────────────────
  {
    id: 5, name: "Man United", from: "#dc2626", to: "#7f1d1d",
    Icon: ({ size: s }) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        {/* Głowa */}
        <circle cx="12" cy="9" r="3.5" fill="white" />
        {/* Lewy róg */}
        <path d="M9.5 6.5 Q8 3 7 4 Q8.5 6 9.5 6.5Z" fill="white" />
        {/* Prawy róg */}
        <path d="M14.5 6.5 Q16 3 17 4 Q15.5 6 14.5 6.5Z" fill="white" />
        {/* Ciało */}
        <path d="M8.5 12.5 Q7 17 8 21 L12 18.5 L16 21 Q17 17 15.5 12.5 Q12 16 8.5 12.5Z" fill="white" />
        {/* Ogon */}
        <path
          d="M8 21 Q4.5 20 5 16 Q6 18.5 8 18"
          stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"
        />
      </svg>
    ),
  },

  // ── 6. Liverpool — Ptak Wątroby (kormoran) ───────────────────────────────
  {
    id: 6, name: "Liverpool", from: "#ef4444", to: "#92400e",
    Icon: ({ size: s }) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        {/* Ciało */}
        <ellipse cx="12" cy="13.5" rx="3.5" ry="4.5" fill="white" />
        {/* Głowa */}
        <ellipse cx="11" cy="8.5" rx="2.5" ry="2.8" fill="white" />
        {/* Dziób z gałązką */}
        <path d="M9.5 8 L5.5 6.5 L8 9" fill="white" />
        {/* Lewe skrzydło */}
        <path d="M8.5 12 Q5 9.5 2.5 11.5 Q4 14 8.5 13Z" fill="white" />
        {/* Prawe skrzydło */}
        <path d="M15.5 12 Q19 9.5 21.5 11.5 Q20 14 15.5 13Z" fill="white" />
        {/* Ogon — trzy pióra */}
        <line x1="9.5" y1="18" x2="8"  y2="22" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="12"  y1="18" x2="12" y2="22" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="14.5" y1="18" x2="16" y2="22" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },

  // ── 7. Bayern Monachium — wzór Rauten (4 romby) ──────────────────────────
  {
    id: 7, name: "Bayern", from: "#dc2626", to: "#991b1b",
    Icon: ({ size: s }) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        {/* Górny lewy — biały */}
        <path d="M8  3 L4  8 L8  13 L12 8Z"  fill="white" />
        {/* Górny prawy — przeźroczysty */}
        <path d="M16 3 L12 8 L16 13 L20 8Z"  fill="white" opacity="0.2" />
        {/* Dolny lewy — przeźroczysty */}
        <path d="M8  11 L4  16 L8  21 L12 16Z" fill="white" opacity="0.2" />
        {/* Dolny prawy — biały */}
        <path d="M16 11 L12 16 L16 21 L20 16Z" fill="white" />
      </svg>
    ),
  },

  // ── 8. Juventus — litera J ────────────────────────────────────────────────
  {
    id: 8, name: "Juventus", from: "#18181b", to: "#3f3f46",
    Icon: ({ size: s }) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        {/* Górna belka J */}
        <rect x="7" y="3" width="10" height="3" rx="1.5" fill="white" />
        {/* Pionowy trzpień */}
        <rect x="12.5" y="3" width="4.5" height="13.5" rx="1" fill="white" />
        {/* Zaokrąglenie dolne J */}
        <path
          d="M15.5 16.5 Q16 22 10.5 22 Q6 22 6 18"
          stroke="white" strokeWidth="3.5" fill="none"
          strokeLinecap="round"
        />
      </svg>
    ),
  },

  // ── 9. Wisła Kraków — Biała Gwiazda ─────────────────────────────────────
  {
    id: 9, name: "Wisła Kraków", from: "#b91c1c", to: "#7f1d1d",
    Icon: ({ size: s }) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <polygon
          points="12,2 14.5,9 22,9 16,13.5 18.5,21 12,16.5 5.5,21 8,13.5 2,9 9.5,9"
          fill="white"
        />
      </svg>
    ),
  },

  // ── 10. AC Milan — krzyż mediolański na tle biało-czerwono-czarnym ───────
  {
    id: 10, name: "AC Milan", from: "#dc2626", to: "#18181b",
    Icon: ({ size: s }) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        {/* Pionowy ramię krzyża */}
        <rect x="10.5" y="3"  width="3"  height="18" rx="1" fill="white" />
        {/* Poziome ramię krzyża */}
        <rect x="3"  y="10.5" width="18" height="3"  rx="1" fill="white" />
        {/* Czerwone pionowe pasy w tle (widoczne przez półprzezroczystość) */}
        <rect x="4.5"  y="3"  width="5.5" height="7"    rx="0.5" fill="white" opacity="0.2" />
        <rect x="14.5" y="14" width="5.5" height="7"    rx="0.5" fill="white" opacity="0.2" />
      </svg>
    ),
  },

  // ── 11. Don Bosco — monogram DB w tarczy ────────────────────────────────
  {
    id: 11, name: "Don Bosco", from: "#f97316", to: "#ea580c",
    Icon: ({ size: s }) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        {/* Tarcza */}
        <path d="M12 2 L4 6 L4 15 Q4 21 12 23 Q20 21 20 15 L20 6Z" fill="white" opacity="0.2" />
        <path d="M12 2 L4 6 L4 15 Q4 21 12 23 Q20 21 20 15 L20 6Z" stroke="white" strokeWidth="1" fill="none" />
        {/* Monogram DB */}
        <text
          x="12" y="16"
          textAnchor="middle"
          fontSize={s * 0.46}
          fontWeight="900"
          fill="white"
          fontFamily="system-ui, sans-serif"
        >DB</text>
      </svg>
    ),
  },
]

export function getAvatar(id: number | null | undefined) {
  if (!id) return null
  return AVATARS.find((a) => a.id === id) ?? null
}

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
