"use client"
import React from "react"
import { useInView } from "./use-in-view"

export default function PollBar({ pct, color = "bg-orange-500" }: { pct: number; color?: string }) {
  const [ref, isInView] = useInView({ threshold: 0.5 })
  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
      <div
        className={`h-full ${color} transition-all duration-700 ease-out`}
        style={{ width: isInView ? `${pct}%` : "0%" }}
      />
    </div>
  )
}
