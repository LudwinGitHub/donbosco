"use client"
import { useId, useEffect, useRef, useState } from "react"
import { useInView } from "@/app/ui/use-in-view"
import type { FormEntry } from "@/lib/players"

const VW = 400
const VH = 150
const PAD_L = 8
const PAD_R = 8
const PAD_T = 28   // room for value labels above dots
const PAD_B = 30   // room for result dots below baseline

const CW = VW - PAD_L - PAD_R  // 384
const CH = VH - PAD_T - PAD_B  // 92

const RC: Record<string, string> = { W: "#22c55e", D: "#a1a1aa", L: "#ef4444" }

function easeOut(t: number) { return 1 - Math.pow(1 - t, 3) }

export default function FormChart({ data }: { data: FormEntry[] }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "")
  const [ref, isInView] = useInView()
  const [progress, setProgress] = useState(0)
  const raf = useRef<number>(0)
  const t0  = useRef<number | null>(null)

  useEffect(() => {
    if (!isInView) return
    t0.current = null
    const tick = (ts: number) => {
      if (!t0.current) t0.current = ts
      const p = Math.min((ts - t0.current) / 900, 1)
      setProgress(easeOut(p))
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [isInView])

  if (data.length < 2) return null

  const n      = data.length
  const maxVal = Math.max(...data.flatMap(d => [d.goals, d.assists]), 1)
  const xOf    = (i: number) => PAD_L + (i / (n - 1)) * CW
  const yOf    = (v: number) => PAD_T + CH - (v / maxVal) * CH * progress

  const goalPts   = data.map((d, i) => `${xOf(i)},${yOf(d.goals)}`).join(" ")
  const assistPts = data.map((d, i) => `${xOf(i)},${yOf(d.assists)}`).join(" ")
  const hasAssists = data.some(d => d.assists > 0)

  // clipPath expands left→right to "draw" the lines
  const clipW = progress * (VW + 32)

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className="space-y-3">
      <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full h-auto">
        <defs>
          <clipPath id={`fc${uid}`}>
            <rect x={-16} y={-4} width={clipW} height={VH + 8} />
          </clipPath>
        </defs>

        {/* Baseline */}
        <line x1={PAD_L} y1={PAD_T + CH} x2={VW - PAD_R} y2={PAD_T + CH}
          stroke="#e4e4e7" strokeWidth="1" />

        {/* Assists line */}
        {hasAssists && (
          <polyline points={assistPts} fill="none" stroke="#d4d4d8" strokeWidth="2"
            strokeLinejoin="round" clipPath={`url(#fc${uid})`} />
        )}

        {/* Goals line */}
        <polyline points={goalPts} fill="none" stroke="#f97316" strokeWidth="2.5"
          strokeLinejoin="round" clipPath={`url(#fc${uid})`} />

        {data.map((d, i) => {
          const x      = xOf(i)
          const gy     = yOf(d.goals)
          const ay     = yOf(d.assists)
          const rdY    = PAD_T + CH + 12
          const visible = progress > i / (n - 1)
          const labelOp = progress > 0.85 ? (progress - 0.85) / 0.15 : 0

          const parts: string[] = []
          if (d.goals > 0)   parts.push(`${d.goals}G`)
          if (d.assists > 0) parts.push(`${d.assists}A`)
          const label  = parts.join(" ")
          const labelY = d.goals > 0 ? gy - 7 : ay - 7

          return (
            <g key={d.matchId} style={{ opacity: visible ? 1 : 0 }}>
              {/* Goals dot */}
              <circle cx={x} cy={gy} r="3.5" fill="#f97316" clipPath={`url(#fc${uid})`} />

              {/* Assists dot */}
              {d.assists > 0 && (
                <circle cx={x} cy={ay} r="3" fill="#a1a1aa" clipPath={`url(#fc${uid})`} />
              )}

              {/* Value label */}
              {label && (
                <text x={x} y={labelY} textAnchor="middle" fontSize="9" fontWeight="700" fill="#52525b"
                  style={{ opacity: labelOp }}>
                  {label}
                </text>
              )}

              {/* W/D/L result dot */}
              <circle cx={x} cy={rdY} r="6" fill={d.result ? RC[d.result] : "#d4d4d8"} />
              <text x={x} y={rdY + 4} textAnchor="middle" fontSize="7" fontWeight="800" fill="white">
                {d.result ?? "·"}
              </text>
            </g>
          )
        })}
      </svg>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-orange-500" />
          <span className="text-xs text-zinc-500">Gole</span>
        </div>
        {hasAssists && (
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-zinc-300" />
            <span className="text-xs text-zinc-500">Asysty</span>
          </div>
        )}
        <div className="ml-auto flex items-center gap-3 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />W
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-zinc-400" />R
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />P
          </span>
        </div>
      </div>
    </div>
  )
}
