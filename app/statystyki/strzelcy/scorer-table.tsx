"use client"
import { useState } from "react"
import Link from "next/link"
import type { ScorerRankingRow } from "@/lib/stats"

type SortKey = "goals" | "assists" | "matches"

const RANK_COLORS = ["#ca8a04", "#71717a", "#b45309"] // gold, silver, bronze

export default function ScorerTable({ rows: initial }: { rows: ScorerRankingRow[] }) {
  const [sort, setSort] = useState<SortKey>("goals")

  const rows = [...initial].sort((a, b) => {
    if (sort === "goals")   return b.goals   - a.goals   || b.assists - a.assists
    if (sort === "assists") return b.assists - a.assists || b.goals   - a.goals
    return b.matches - a.matches
  })

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-zinc-100 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-400">
          <th className="px-4 py-3 text-right w-8">#</th>
          <th className="px-4 py-3 text-left">Gracz</th>
          <th className="px-4 py-3 text-left hidden sm:table-cell">Drużyna</th>
          <SortTh label="G" title="Gole"   k="goals"   sort={sort} onSort={setSort} />
          <SortTh label="A" title="Asysty" k="assists" sort={sort} onSort={setSort} />
          <SortTh label="M" title="Mecze"  k="matches" sort={sort} onSort={setSort} hidden />
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-100 stagger">
        {rows.map((r, i) => (
          <tr
            key={r.playerId}
            className={`hover:bg-zinc-50 transition-colors ${i < 3 && sort === "goals" ? "border-l-2" : ""}`}
            style={i < 3 && sort === "goals" ? { borderLeftColor: RANK_COLORS[i] } : undefined}
          >
            <td className="px-4 py-3 text-right text-xs text-zinc-300">{i + 1}</td>
            <td className="px-4 py-3">
              <Link href={`/gracze/${r.playerId}`} className="font-medium text-zinc-900 hover:underline">
                {r.firstName} {r.lastName}
              </Link>
              {r.nickname && <p className="text-xs text-zinc-400">{r.nickname}</p>}
            </td>
            <td className="px-4 py-3 hidden sm:table-cell">
              {r.teamName ? (
                <div className="flex items-center gap-1.5">
                  {r.teamColor && <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: r.teamColor }} />}
                  <span className="text-zinc-600">{r.teamName}</span>
                </div>
              ) : <span className="text-zinc-300">—</span>}
            </td>
            <td className="px-4 py-3 text-center font-bold text-zinc-900">{r.goals}</td>
            <td className="px-4 py-3 text-center text-zinc-600">{r.assists}</td>
            <td className="px-4 py-3 text-center text-zinc-400 hidden sm:table-cell">{r.matches}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function SortTh({
  label, title, k, sort, onSort, hidden,
}: {
  label: string; title: string; k: SortKey
  sort: SortKey; onSort: (k: SortKey) => void; hidden?: boolean
}) {
  const active = sort === k
  return (
    <th
      className={`px-4 py-3 text-center w-14 cursor-pointer select-none transition-colors hover:text-zinc-600 ${active ? "text-orange-600" : ""} ${hidden ? "hidden sm:table-cell" : ""}`}
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
