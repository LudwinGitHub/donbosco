"use client"
import React from "react"
import Link from "next/link"
import { useInView } from "@/app/ui/use-in-view"
import CountUp from "@/app/ui/count-up"
import AnimatedFormDots from "@/app/ui/animated-form-dots"
import type { StandingRow } from "@/lib/standings"

export default function StandingsTable({
  rows,
  currentUserId,
}: {
  rows: StandingRow[]
  currentUserId: string | null
}) {
  const [ref, isInView] = useInView({ threshold: 0.05 })

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-100 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            <th className="px-4 py-3 text-left w-8">#</th>
            <th className="px-4 py-3 text-left">Drużyna</th>
            <th className="px-4 py-3 text-center w-10 hidden sm:table-cell" title="Mecze">M</th>
            <th className="px-4 py-3 text-center w-10 hidden sm:table-cell" title="Wygrane">W</th>
            <th className="px-4 py-3 text-center w-10 hidden sm:table-cell" title="Remisy">R</th>
            <th className="px-4 py-3 text-center w-10 hidden sm:table-cell" title="Porażki">P</th>
            <th className="px-4 py-3 text-center hidden sm:table-cell" title="Bramki">Br</th>
            <th className="px-4 py-3 text-center hidden sm:table-cell" title="Różnica bramek">RB</th>
            <th className="px-4 py-3 text-center font-bold text-zinc-600" title="Punkty">Pkt</th>
            <th className="px-4 py-3 text-center" title="Forma (ostatnie 5 meczów)">Forma</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {rows.map((row, i) => {
            const totalGames = row.won + row.drawn + row.lost
            const wonPct   = totalGames > 0 ? (row.won   / totalGames) * 100 : 0
            const drawnPct = totalGames > 0 ? (row.drawn / totalGames) * 100 : 0
            const lostPct  = totalGames > 0 ? (row.lost  / totalGames) * 100 : 0

            return (
              <tr
                key={row.teamId}
                className="transition-colors hover:bg-zinc-50"
                style={{
                  opacity:   isInView ? 1 : 0,
                  transform: isInView ? "none" : "translateY(8px)",
                  transition: `opacity 0.25s ease-out ${i * 40}ms, transform 0.25s ease-out ${i * 40}ms`,
                }}
              >
                <td className="px-4 py-3 text-zinc-400 font-medium">{i + 1}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: row.teamColor }} />
                    <Link href={`/druzyny/${row.teamId}`} className="font-medium text-zinc-900 hover:underline">
                      {row.teamName}
                    </Link>
                  </div>
                </td>
                <td className="px-4 py-3 text-center text-zinc-600 hidden sm:table-cell">
                  {isInView ? <CountUp value={row.played} duration={600} /> : 0}
                </td>
                <td className="px-4 py-3 text-center text-zinc-600 hidden sm:table-cell">
                  {isInView ? <CountUp value={row.won} duration={600} /> : 0}
                </td>
                <td className="px-4 py-3 text-center text-zinc-600 hidden sm:table-cell">
                  {isInView ? <CountUp value={row.drawn} duration={600} /> : 0}
                </td>
                <td className="px-4 py-3 text-center text-zinc-600 hidden sm:table-cell">
                  {isInView ? <CountUp value={row.lost} duration={600} /> : 0}
                </td>
                <td className="px-4 py-3 text-center text-zinc-600 hidden sm:table-cell">
                  <span className="inline-flex items-center gap-0.5">
                    {isInView ? <CountUp value={row.goalsFor} duration={600} /> : 0}
                    <span>:</span>
                    {isInView ? <CountUp value={row.goalsAgainst} duration={600} /> : 0}
                  </span>
                </td>
                <td className="px-4 py-3 text-center hidden sm:table-cell">
                  <span className={row.goalDiff > 0 ? "text-green-600" : row.goalDiff < 0 ? "text-red-500" : "text-zinc-400"}>
                    {row.goalDiff > 0 ? "+" : ""}
                    {isInView ? <CountUp value={row.goalDiff} duration={600} /> : 0}
                  </span>
                </td>
                <td className="px-4 py-3 text-center font-bold text-zinc-900">
                  {isInView ? <CountUp value={row.points} duration={600} /> : 0}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col items-center gap-1">
                    <AnimatedFormDots form={row.form} />
                    {totalGames > 0 && (
                      <div className="flex h-1 overflow-hidden rounded-full gap-px" style={{ width: "60px" }}>
                        <div
                          className="bg-green-500 transition-all duration-700"
                          style={{ width: isInView ? `${wonPct}%` : "0%" }}
                        />
                        <div
                          className="bg-zinc-300 transition-all duration-700 delay-100"
                          style={{ width: isInView ? `${drawnPct}%` : "0%" }}
                        />
                        <div
                          className="bg-red-400 transition-all duration-700 delay-200"
                          style={{ width: isInView ? `${lostPct}%` : "0%" }}
                        />
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={10} className="px-4 py-8 text-center text-zinc-400">
                Brak rozegranych meczów w tym sezonie.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
