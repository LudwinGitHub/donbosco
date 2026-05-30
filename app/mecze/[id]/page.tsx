import Link from "next/link"
import { notFound } from "next/navigation"
import { getMatchById, type GoalDetail, type LineupEntry } from "@/lib/matches"
import { getOptionalSession } from "@/lib/dal"

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [match, session] = await Promise.all([
    getMatchById(id),
    getOptionalSession(),
  ])
  const isOrganizer = session?.role === "ORGANIZER"

  if (!match) notFound()

  const played = match.status === "PLAYED"
  const homeLineup = match.matchLineups.filter((l) => l.teamId === match.homeTeam.id)
  const awayLineup = match.matchLineups.filter((l) => l.teamId === match.awayTeam.id)
  const hasLineup = homeLineup.length > 0 || awayLineup.length > 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Link href="/mecze" className="hover:text-zinc-600 transition-colors">
            Mecze
          </Link>
          <span>›</span>
          {match.round !== null && <span>Kolejka {match.round}</span>}
        </div>
        {isOrganizer && (
          <div className="flex items-center gap-2">
            <Link
              href={`/panel/mecze/${id}/sklad`}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
            >
              Edytuj skład
            </Link>
            <Link
              href={`/mecze/${id}/wyniki`}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
            >
              {match.status === "PLAYED" ? "Edytuj wyniki" : "Wpisz wyniki"}
            </Link>
          </div>
        )}
      </div>

      {/* Scoreboard */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="flex items-center justify-between gap-4">
          <TeamBlock name={match.homeTeam.name} color={match.homeTeam.color} align="left" />

          <div className="shrink-0 text-center">
            {played ? (
              <span className="text-4xl font-bold tabular-nums text-zinc-900">
                {match.homeScore} : {match.awayScore}
              </span>
            ) : (
              <div>
                <span className="text-2xl font-light text-zinc-300">vs</span>
                <p className="mt-1 text-xs text-zinc-400">{formatDateTime(match.scheduledAt)}</p>
              </div>
            )}
            {played && match.playedAt && (
              <p className="mt-1 text-xs text-zinc-400">{formatDateTime(match.playedAt)}</p>
            )}
            {match.venue && (
              <p className="mt-0.5 text-xs text-zinc-400">{match.venue}</p>
            )}
            {match.mvpPlayer && (
              <p className="mt-2 text-xs text-zinc-400">
                ⭐{" "}
                <Link href={`/gracze/${match.mvpPlayer.id}`} className="font-semibold text-zinc-700 hover:underline">
                  {match.mvpPlayer.firstName} {match.mvpPlayer.lastName}
                </Link>
              </p>
            )}
          </div>

          <TeamBlock name={match.awayTeam.name} color={match.awayTeam.color} align="right" />
        </div>
      </div>

      {/* Goals */}
      {played && match.goals.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Bramki</h2>
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <GoalTimeline goals={match.goals} homeTeam={match.homeTeam} awayTeam={match.awayTeam} />
          </div>
        </section>
      )}

      {/* Lineup */}
      {hasLineup && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Skład</h2>
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <div className="grid grid-cols-2 divide-x divide-zinc-100">
              <LineupColumn players={homeLineup} teamName={match.homeTeam.name} teamColor={match.homeTeam.color} />
              <LineupColumn players={awayLineup} teamName={match.awayTeam.name} teamColor={match.awayTeam.color} />
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

function TeamBlock({
  name,
  color,
  align,
}: {
  name: string
  color: string
  align: "left" | "right"
}) {
  return (
    <div className={`flex flex-1 flex-col items-${align === "left" ? "start" : "end"} gap-2`}>
      <span
        className="h-10 w-10 rounded-full border-2 border-zinc-100"
        style={{ backgroundColor: color }}
      />
      <span className="font-semibold text-zinc-900 text-sm leading-tight">{name}</span>
    </div>
  )
}

function GoalTimeline({
  goals,
  homeTeam,
  awayTeam,
}: {
  goals: GoalDetail[]
  homeTeam: { id: string; name: string; color: string }
  awayTeam: { id: string; name: string; color: string }
}) {
  let h = 0, a = 0
  const events = goals.map((g) => {
    const isHome = g.teamId === homeTeam.id
    if (isHome) h++; else a++
    return { ...g, isHome, score: `${h}:${a}` }
  })

  return (
    <div className="divide-y divide-zinc-50">
      {events.map((ev) => (
        <div key={ev.id} className="grid grid-cols-[1fr_72px_1fr] items-center gap-1 px-4 py-2.5">
          {ev.isHome ? (
            <div className="text-right pr-1">
              <p className={`text-sm font-medium text-zinc-900 leading-snug ${ev.isOwnGoal ? "line-through decoration-zinc-400" : ""}`}>
                {ev.scorer.firstName} {ev.scorer.lastName}
              </p>
              {ev.isOwnGoal && <p className="text-xs text-zinc-400">samobój</p>}
              {ev.assister && (
                <p className="text-xs text-zinc-400">
                  as. {ev.assister.firstName} {ev.assister.lastName}
                </p>
              )}
            </div>
          ) : <div />}

          <div className="flex flex-col items-center gap-0.5">
            <span className="text-sm font-bold tabular-nums text-zinc-900">{ev.score}</span>
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ev.isHome ? homeTeam.color : awayTeam.color }} />
            {ev.minute != null && (
              <span className="text-[10px] text-zinc-400">{ev.minute}&apos;</span>
            )}
          </div>

          {!ev.isHome ? (
            <div className="text-left pl-1">
              <p className={`text-sm font-medium text-zinc-900 leading-snug ${ev.isOwnGoal ? "line-through decoration-zinc-400" : ""}`}>
                {ev.scorer.firstName} {ev.scorer.lastName}
              </p>
              {ev.isOwnGoal && <p className="text-xs text-zinc-400">samobój</p>}
              {ev.assister && (
                <p className="text-xs text-zinc-400">
                  as. {ev.assister.firstName} {ev.assister.lastName}
                </p>
              )}
            </div>
          ) : <div />}
        </div>
      ))}
    </div>
  )
}

function LineupColumn({
  players,
  teamName,
  teamColor,
}: {
  players: LineupEntry[]
  teamName: string
  teamColor: string
}) {
  return (
    <div className="p-4 space-y-1">
      <div className="flex items-center gap-1.5 mb-3">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: teamColor }} />
        <span className="text-xs font-semibold text-zinc-500">{teamName}</span>
      </div>
      {players.map((l) => (
        <p key={l.player.id} className="text-sm text-zinc-700">
          {l.player.firstName} {l.player.lastName}
          {l.player.nickname && (
            <span className="ml-1 text-xs text-zinc-400">„{l.player.nickname}"</span>
          )}
        </p>
      ))}
    </div>
  )
}

function formatDateTime(date: Date) {
  return new Date(date).toLocaleString("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
