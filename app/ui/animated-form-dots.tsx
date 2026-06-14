"use client"
import { useInView } from "./use-in-view"
import type { FormResult } from "@/lib/standings"

const cfg: Record<FormResult, { bg: string; text: string; label: string }> = {
  W: { bg: "bg-green-500", text: "text-white",    label: "Wygrana" },
  D: { bg: "bg-zinc-300",  text: "text-zinc-600", label: "Remis"   },
  L: { bg: "bg-red-400",   text: "text-white",    label: "Porażka" },
}

export default function AnimatedFormDots({
  form,
  size = "md",
}: {
  form: FormResult[]
  size?: "sm" | "md"
}) {
  const [ref, isInView] = useInView({ threshold: 0.3 })

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className="flex items-center justify-center gap-1"
    >
      {form.map((r, i) => {
        const { bg, text, label } = cfg[r]
        return (
          <span
            key={i}
            title={label}
            className={`inline-flex items-center justify-center rounded font-bold ${bg} ${text} ${
              size === "sm" ? "h-4 w-4 text-[8px]" : "h-5 w-5 text-[9px]"
            }`}
            style={{
              opacity:    isInView ? 1 : 0,
              transform:  isInView ? "scale(1)" : "scale(0.4)",
              transition: `opacity 0.2s ease-out ${i * 65}ms, transform 0.2s ease-out ${i * 65}ms`,
            }}
          >
            {r}
          </span>
        )
      })}
    </div>
  )
}
