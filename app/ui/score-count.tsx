"use client"
import React, { useEffect, useRef, useState } from "react"
import { useInView } from "./use-in-view"

export default function ScoreCount({ home, away }: { home: number; away: number }) {
  const [ref, isInView] = useInView()
  const [hDisplay, setHDisplay] = useState(0)
  const [aDisplay, setADisplay] = useState(0)
  const rafRef = useRef<number>(0)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isInView) return
    startRef.current = null
    function tick(ts: number) {
      if (!startRef.current) startRef.current = ts
      const t = Math.min((ts - startRef.current) / 800, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setHDisplay(Math.round(eased * home))
      setADisplay(Math.round(eased * away))
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [isInView, home, away])

  return (
    <span ref={ref as React.RefObject<HTMLSpanElement>} className="text-4xl sm:text-5xl font-black tabular-nums text-zinc-900 tracking-tight">
      {hDisplay}<span className="text-zinc-300 mx-1">:</span>{aDisplay}
    </span>
  )
}
