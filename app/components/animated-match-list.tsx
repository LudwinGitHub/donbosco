"use client"
import React from "react"
import Link from "next/link"
import { useInView } from "@/app/ui/use-in-view"
import type { MatchListItem } from "@/lib/matches"

const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: "Zaplanowany",
  PLAYED: "Rozegrany",
  CANCELLED: "Odwołany",
  POSTPONED: "Przełożony",
}

type RoundGroup = {
  round: number | null
  matches: MatchListItem[]
}

export default function AnimatedMatchList({
  byRound,
  countByMatchId,
  nextMatchId,
}: {
  byRound: RoundGroup[]
  countByMatchId: Record<string, number>
  nextMatchId: string | null
}) {
  const [ref, isInView] = useInView({ threshold: 0.05 })

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className="space-y-4">
      {byRound.map(({ round, matches }, groupIndex) => (
        <section
          key={round ?? "no-round"}
          className="space-y-2"
          style={{
            opacity:    isInView ? 1 : 0,
            transform:  isInView ? "none" : "translateY(10px)",
            transition: `opacity 0.3s ease-out ${groupIndex * 60}ms, transform 0.3s ease-out ${groupIndex * 60}ms`,
          }}
        >
          {round !== null && (
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Kolejka {round}
            </h2>
          )}
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white divide-y divide-zinc-100">
            {matches.map((m) => (
              <MatchRow
                key={m.id}
                match={m}
                confirmedCount={countByMatchId[m.id] ?? 0}
                isNext={m.id === nextMatchId}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function MatchRow({ match: m, confirmedCount, isNext }: { match: MatchListItem; confirmedCount: number; isNext: boolean }) {
  const played    = m.status === "PLAYED"
  const cancelled = m.status === "CANCELLED" || m.status === "POSTPONED"
  const isFull    = confirmedCount >= m.playerLimit

  const scoreOrTime = played ? (
    <span className="font-bold tabular-nums text-zinc-900 text-base sm:text-lg">
      {m.homeScore}:{m.awayScore}
    </span>
  ) : cancelled ? (
    <span className="text-xs font-medium text-zinc-400">{STATUS_LABEL[m.status]}</span>
  ) : (
    <span className="text-sm font-medium text-zinc-400">{formatTime(m.scheduledAt)}</span>
  )

  return (
    <Link
      href={`/mecze/${m.id}`}
      className={`relative block transition-colors group ${
        isNext ? "bg-orange-50 hover:bg-orange-100" : "hover:bg-zinc-50"
      }`}
    >
      {isNext && <span className="absolute inset-y-0 left-0 w-1 bg-orange-500" />}
      {/* Mobile layout */}
      <div className="flex sm:hidden items-center gap-3 px-4 py-3">
        <div className="shrink-0 w-14 text-center">{scoreOrTime}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-zinc-800 truncate">
              <span className="inline-block h-2 w-2 rounded-full mr-1 align-middle shrink-0" style={{ backgroundColor: m.homeTeam.color }} />
              {m.homeTeam.name}
              <span className="text-zinc-300 mx-1.5">vs</span>
              <span className="inline-block h-2 w-2 rounded-full mr-1 align-middle shrink-0" style={{ backgroundColor: m.awayTeam.color }} />
              {m.awayTeam.name}
            </p>
            {isNext && (
              <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded-full shrink-0">
                Następny
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-zinc-400">
            {formatDate(m.scheduledAt)}
            {!played && !cancelled && ` · ${confirmedCount}/${m.playerLimit}`}
          </p>
        </div>
        <span className="text-zinc-300 text-sm shrink-0">›</span>
      </div>

      {/* Desktop layout */}
      <div className="hidden sm:flex items-center gap-4 px-4 py-3">
        <div className="w-28 shrink-0 text-xs text-zinc-400">{formatDate(m.scheduledAt)}</div>
        <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
          <TeamName name={m.homeTeam.name} color={m.homeTeam.color} align="right" />
          <div className="shrink-0 w-20 text-center">{scoreOrTime}</div>
          <TeamName name={m.awayTeam.name} color={m.awayTeam.color} align="left" />
        </div>
        <div className="shrink-0 w-28 flex items-center justify-end gap-2">
          {isNext && (
            <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded-full">
              Następny
            </span>
          )}
          {!played && !cancelled && (
            <span className={`text-xs font-medium tabular-nums ${isFull ? "text-red-500" : "text-zinc-400"}`}>
              {confirmedCount}/{m.playerLimit}
            </span>
          )}
          <span className="text-zinc-300 group-hover:text-zinc-400 text-sm">›</span>
        </div>
      </div>
    </Link>
  )
}

function TeamName({ name, color, align }: { name: string; color: string; align: "left" | "right" }) {
  return (
    <div className={`flex items-center gap-2 flex-1 min-w-0 ${align === "right" ? "flex-row-reverse" : ""}`}>
      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className="truncate text-sm font-medium text-zinc-800">{name}</span>
    </div>
  )
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  })
}
