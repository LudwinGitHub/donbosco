"use client"
import { useState } from "react"
import Link from "next/link"
import type { PlayerWithStats, PlayerForm } from "@/lib/players"
import type { BadgeType } from "@/lib/badges"
import BadgeChip from "@/app/ui/badge-chip"
import PlayerAvatar from "@/app/ui/player-avatar"
import CountUp from "@/app/ui/count-up"

type SortKey = "played" | "goals" | "assists"

type Props = {
  players: PlayerWithStats[]
  badges: Record<string, Array<{ type: BadgeType }>>
  forms: Record<string, PlayerForm>
  seasonId: string | undefined
  initialSort: SortKey
}

export default function PlayersTable({ players, badges, forms, seasonId, initialSort }: Props) {
  const [sort, setSort] = useState<SortKey>(initialSort)

  const display = [...players].sort((a, b) => {
    if (sort === "goals")   return b.goals   - a.goals   || b.assists - a.assists || a.lastName.localeCompare(b.lastName)
    if (sort === "assists") return b.assists - a.assists || b.goals   - a.goals   || a.lastName.localeCompare(b.lastName)
    return b.played - a.played || a.lastName.localeCompare(b.lastName)
  })

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-100 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            <th className="px-4 py-3 text-right w-8">#</th>
            <th className="px-4 py-3 text-left">Gracz</th>
            {seasonId && <th className="px-4 py-3 text-left hidden sm:table-cell">Drużyna</th>}
            <th className="px-4 py-3 text-center w-10" title="Forma">F</th>
            <SortTh label="M" title="Mecze"  k="played"  sort={sort} onSort={setSort} />
            <SortTh label="G" title="Gole"   k="goals"   sort={sort} onSort={setSort} />
            <SortTh label="A" title="Asysty" k="assists" sort={sort} onSort={setSort} />
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 stagger">
          {display.map((p, i) => (
            <tr key={p.id} className="transition-colors hover:bg-zinc-50">
              <td className="px-4 py-3 text-right text-xs text-zinc-300">{i + 1}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <PlayerAvatar firstName={p.firstName} lastName={p.lastName} color={p.team?.color} avatarId={p.avatarId} size="sm" />
                  <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                    <Link href={`/gracze/${p.id}`} className="font-medium text-zinc-900 hover:underline">
                      {p.firstName} {p.lastName}
                    </Link>
                    {p.nickname && <span className="text-xs text-zinc-400">„{p.nickname}"</span>}
                    {(badges[p.id] ?? []).map((b, j) => (
                      <BadgeChip key={j} type={b.type} index={j} />
                    ))}
                  </div>
                </div>
              </td>
              {seasonId && (
                <td className="px-4 py-3 hidden sm:table-cell">
                  {p.team ? (
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: p.team.color }} />
                      <span className="text-zinc-600">{p.team.name}</span>
                    </div>
                  ) : <span className="text-zinc-300">—</span>}
                </td>
              )}
              <td className="px-4 py-3 text-center">
                <FormArrow form={forms[p.id]} />
              </td>
              <td className="px-4 py-3 text-center text-zinc-600">
                <CountUp value={p.played} duration={600} />
              </td>
              <td className="px-4 py-3 text-center">
                <span className={p.goals > 0 ? "font-semibold text-zinc-900" : "text-zinc-400"}>
                  <CountUp value={p.goals} duration={600} />
                </span>
              </td>
              <td className="px-4 py-3 text-center">
                <span className={p.assists > 0 ? "font-semibold text-zinc-900" : "text-zinc-400"}>
                  <CountUp value={p.assists} duration={600} />
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SortTh({ label, title, k, sort, onSort }: {
  label: string; title: string; k: SortKey; sort: SortKey; onSort: (k: SortKey) => void
}) {
  const active = sort === k
  return (
    <th
      className={`px-4 py-3 text-center w-14 cursor-pointer select-none transition-colors hover:text-zinc-600 ${active ? "text-orange-600" : ""}`}
      title={title}
      onClick={() => onSort(k)}
    >
      <span className="inline-flex items-center justify-center gap-0.5">
        {label}
        {active && <span className="text-[9px]">▼</span>}
      </span>
    </th>
  )
}

function FormArrow({ form }: { form: PlayerForm | undefined }) {
  if (!form) return null
  if (form === "up")   return <span className="text-sm font-black leading-none text-orange-500" title="Forma w górę">▲</span>
  if (form === "down") return <span className="text-sm font-black leading-none text-red-500"    title="Forma w dół">▼</span>
  return <span className="text-sm font-black leading-none text-zinc-400" title="Forma stabilna">—</span>
}
