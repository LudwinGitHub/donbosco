import { AvatarCircle } from "./avatars"

function luminance(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const SIZE = {
  sm: { cls: "h-7 w-7 text-[10px]", icon: 14 },
  md: { cls: "h-8 w-8 text-xs",     icon: 16 },
  lg: { cls: "h-12 w-12 text-base", icon: 24 },
} as const

export default function PlayerAvatar({
  firstName,
  lastName,
  color,
  avatarId,
  size = "md",
}: {
  firstName: string
  lastName: string
  color?: string | null
  avatarId?: number | null
  size?: "sm" | "md" | "lg"
}) {
  const { cls, icon } = SIZE[size]

  if (avatarId) {
    return <AvatarCircle avatarId={avatarId} sizeClass={cls} iconSize={icon} />
  }

  const bg = color ?? "#d4d4d8"
  const textColor = luminance(bg) > 0.45 ? "#18181b" : "#ffffff"
  const initials = (firstName[0] ?? "") + (lastName[0] ?? "")

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold uppercase ${cls}`}
      style={{ backgroundColor: bg, color: textColor }}
      aria-hidden
    >
      {initials}
    </span>
  )
}
