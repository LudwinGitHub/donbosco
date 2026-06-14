"use client"
import { useEffect, useRef, useState } from "react"
import { useInView } from "@/app/ui/use-in-view"
import type { SeasonChartEntry } from "@/lib/players"

// ViewBox coordinate system
const VW = 400
const VH = 160
const PAD_L = 22  // y-axis labels
const PAD_R = 6
const PAD_T = 20  // room for value labels above bars
const PAD_B = 26  // x-axis season labels

const CW = VW - PAD_L - PAD_R   // chart inner width  = 372
const CH = VH - PAD_T - PAD_B   // chart inner height = 114

function niceMax(v: number) {
  if (v <= 5)  return 5
  if (v <= 10) return 10
  if (v <= 15) return 15
  if (v <= 20) return 20
  return Math.ceil(v / 5) * 5
}

function gridValues(max: number): number[] {
  const step = max <= 5 ? 1 : 5
  const out: number[] = []
  for (let v = 0; v <= max; v += step) out.push(v)
  return out
}

function shortLabel(name: string) {
  const m = name.match(/\d+/)
  return m ? m[0] : name.slice(0, 4)
}

export default function SeasonChart({ data }: { data: SeasonChartEntry[] }) {
  const [containerRef, isInView] = useInView()
  const [progress, setProgress] = useState(0)
  const rafRef = useRef<number>(0)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isInView) return
    startRef.current = null
    function tick(ts: number) {
      if (!startRef.current) startRef.current = ts
      const t = Math.min((ts - startRef.current) / 900, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setProgress(eased)
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [isInView])

  if (data.length < 2) return null

  const rawMax = Math.max(...data.flatMap((d) => [d.goals, d.assists]), 1)
  const maxVal = niceMax(rawMax)
  const grid   = gridValues(maxVal)

  const groupW = CW / data.length
  const padG   = Math.max(3, groupW * 0.1)
  const barGap = Math.max(2, groupW * 0.05)
  const barW   = (groupW - 2 * padG - barGap) / 2

  const bH = (v: number) => (v / maxVal) * CH * progress
  const bY = (v: number) => PAD_T + CH - bH(v)

  return (
    <div
      ref={containerRef as React.RefObject<HTMLDivElement>}
      className="space-y-2"
    >
      <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full h-auto">
        {/* Gridlines + Y labels */}
        {grid.map((v) => {
          const y = PAD_T + CH - (v / maxVal) * CH
          return (
            <g key={v}>
              <line x1={PAD_L} y1={y} x2={VW - PAD_R} y2={y} stroke="#f4f4f5" strokeWidth="1" />
              <text x={PAD_L - 3} y={y + 3.5} textAnchor="end" fontSize="9" fill="#a1a1aa">{v}</text>
            </g>
          )
        })}

        {/* Baseline */}
        <line x1={PAD_L} y1={PAD_T + CH} x2={VW - PAD_R} y2={PAD_T + CH} stroke="#e4e4e7" strokeWidth="1" />

        {/* Season groups */}
        {data.map((d, i) => {
          const gx = PAD_L + i * groupW + padG
          const ax = gx + barW + barGap
          const cx = PAD_L + i * groupW + groupW / 2
          const gh = Math.max(d.goals   > 0 ? 2 * progress : 0, bH(d.goals))
          const ah = Math.max(d.assists > 0 ? 2 * progress : 0, bH(d.assists))
          const gy = PAD_T + CH - gh
          const ay = PAD_T + CH - ah

          return (
            <g key={d.seasonName}>
              {/* Goals bar */}
              <rect x={gx} y={gy} width={barW} height={gh} rx="2" fill="#f97316" />
              {d.goals > 0 && progress > 0.85 && (
                <text
                  x={gx + barW / 2} y={gy - 3}
                  textAnchor="middle" fontSize="9" fontWeight="600" fill="#f97316"
                  style={{ opacity: Math.max(0, (progress - 0.85) / 0.15) }}
                >
                  {d.goals}
                </text>
              )}

              {/* Assists bar */}
              <rect x={ax} y={ay} width={barW} height={ah} rx="2" fill="#a1a1aa" />
              {d.assists > 0 && progress > 0.85 && (
                <text
                  x={ax + barW / 2} y={ay - 3}
                  textAnchor="middle" fontSize="9" fontWeight="600" fill="#71717a"
                  style={{ opacity: Math.max(0, (progress - 0.85) / 0.15) }}
                >
                  {d.assists}
                </text>
              )}

              {/* Season label */}
              <text x={cx} y={VH - 4} textAnchor="middle" fontSize="9" fill="#71717a">
                {shortLabel(d.seasonName)}
              </text>
            </g>
          )
        })}
      </svg>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-orange-500" />
          <span className="text-xs text-zinc-500">Gole</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-zinc-400" />
          <span className="text-xs text-zinc-500">Asysty</span>
        </div>
      </div>
    </div>
  )
}
