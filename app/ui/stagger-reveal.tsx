"use client"
import React from "react"
import { useInView } from "./use-in-view"

export default function StaggerReveal({
  children,
  className,
  stagger = 60,
}: {
  children: React.ReactNode
  className?: string
  stagger?: number
}) {
  const [ref, isInView] = useInView({ threshold: 0.05 })
  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className={className}>
      {React.Children.map(children, (child, i) =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<{ style?: React.CSSProperties }>, {
              style: {
                ...(child.props as { style?: React.CSSProperties }).style,
                opacity: isInView ? 1 : 0,
                transform: isInView ? "none" : "translateY(10px)",
                transition: `opacity 0.3s ease-out ${i * stagger}ms, transform 0.3s ease-out ${i * stagger}ms`,
              },
            })
          : child
      )}
    </div>
  )
}
