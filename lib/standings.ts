import { prisma } from "./prisma"

export type FormResult = "W" | "D" | "L"

export type StandingRow = {
  teamId: string
  teamName: string
  teamColor: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDiff: number
  points: number
  form: FormResult[]
}

export async function getStandings(seasonId: string): Promise<StandingRow[]> {
  const matches = await prisma.match.findMany({
    where:   { seasonId, status: "PLAYED" },
    include: { homeTeam: true, awayTeam: true },
    orderBy: { scheduledAt: "asc" },
  })

  const map     = new Map<string, StandingRow>()
  const formMap = new Map<string, FormResult[]>()

  const ensure = (team: { id: string; name: string; color: string }) => {
    if (!map.has(team.id)) {
      map.set(team.id, {
        teamId: team.id, teamName: team.name, teamColor: team.color,
        played: 0, won: 0, drawn: 0, lost: 0,
        goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0, form: [],
      })
      formMap.set(team.id, [])
    }
    return map.get(team.id)!
  }

  for (const m of matches) {
    const hg   = m.homeScore ?? 0
    const ag   = m.awayScore ?? 0
    const home = ensure(m.homeTeam)
    const away = ensure(m.awayTeam)

    home.played++; away.played++
    home.goalsFor += hg; home.goalsAgainst += ag
    away.goalsFor += ag; away.goalsAgainst += hg

    let homeResult: FormResult
    if (hg > ag) {
      home.won++; home.points += 3; away.lost++
      homeResult = "W"
    } else if (hg < ag) {
      away.won++; away.points += 3; home.lost++
      homeResult = "L"
    } else {
      home.drawn++; home.points++; away.drawn++; away.points++
      homeResult = "D"
    }

    formMap.get(m.homeTeam.id)!.push(homeResult)
    formMap.get(m.awayTeam.id)!.push(homeResult === "W" ? "L" : homeResult === "L" ? "W" : "D")
  }

  for (const row of map.values()) {
    row.goalDiff = row.goalsFor - row.goalsAgainst
    row.form     = (formMap.get(row.teamId) ?? []).slice(-5)
  }

  return [...map.values()].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor
    return a.teamName.localeCompare(b.teamName)
  })
}

export async function getActiveSeason() {
  return prisma.season.findFirst({ where: { isActive: true } })
}

export async function getAllSeasons() {
  return prisma.season.findMany({ orderBy: { startDate: "asc" } })
}
