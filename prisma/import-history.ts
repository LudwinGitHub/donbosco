import "dotenv/config"
import { readFileSync } from "fs"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../app/generated/prisma/client"

const pool    = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma  = new PrismaClient({ adapter })

const INFO_DIR = `${__dirname}/../info`

// Seasons with full stats (goals + assists tracked per player per round)
// Data read from locally saved HTML exports (spreadsheet requires auth)
const SHEETS = [
  {
    file:         `${INFO_DIR}/Don Bosco Premier League - 2023_files/sheet.html`,
    label:        "2023/24",
    seasonName:   "Sezon 2023/24",
    year:         2023,
    homeTeamName: "Drużyna Jaco",
    awayTeamName: "Drużyna Brami",
    homeColor:    "#3b82f6",
    awayColor:    "#ef4444",
    isActive:     false,
  },
  {
    file:         `${INFO_DIR}/Don Bosco Premier League - 2024_files/sheet.html`,
    label:        "2024/25",
    seasonName:   "Sezon 2024/25",
    year:         2024,
    homeTeamName: "Drużyna Jaco",
    awayTeamName: "Drużyna Brami",
    homeColor:    "#3b82f6",
    awayColor:    "#ef4444",
    isActive:     false,
  },
  {
    file:         `${INFO_DIR}/Don Bosco Premier League - 2025_files/sheet.html`,
    label:        "2025/26",
    seasonName:   "Sezon 2025/26",
    year:         2025,
    homeTeamName: "Drużyna Jaco",
    awayTeamName: "Drużyna Brami",
    homeColor:    "#3b82f6",
    awayColor:    "#ef4444",
    isActive:     false,
  },
  {
    file:         `${INFO_DIR}/Don Bosco Premier League - Current_files/sheet.html`,
    label:        "2026/27",
    seasonName:   "Sezon 2026/27",
    year:         2026,
    homeTeamName: "Drużyna Jaco",
    awayTeamName: "Drużyna Patryk",
    homeColor:    "#3b82f6",
    awayColor:    "#ef4444",
    isActive:     true,
  },
]

// ─── HTML table parser ────────────────────────────────────────────────────────
// Handles colspan — date/score/header rows use colspan="4" to span a round block.
// We expand each cell into colspan copies (value + empty strings) so that column
// indices align with the per-round format the import logic expects.

function parseHTMLTable(html: string): string[][] {
  const rows: string[][] = []
  const trMatches = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/g) ?? []
  for (const tr of trMatches) {
    const cells: string[] = []
    const tdMatches = tr.match(/<td[^>]*>[\s\S]*?<\/td>/g) ?? []
    for (const td of tdMatches) {
      const colspanMatch = td.match(/colspan="?(\d+)"?/i)
      const colspan = colspanMatch ? parseInt(colspanMatch[1]) : 1
      const text = td
        .replace(/<br\s*\/?>/gi, " ")
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&nbsp;/g, " ")
        .replace(/&#39;/g, "'")
        .trim()
        .replace(/\s+/g, " ")
      cells.push(text)
      for (let i = 1; i < colspan; i++) cells.push("")
    }
    if (cells.some((c) => c.length > 0)) rows.push(cells)
  }
  return rows
}

function readSheet(filePath: string): string[][] {
  const html = readFileSync(filePath, "utf-8")
  return parseHTMLTable(html)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseDate(s: string, fallbackYear: number): Date | null {
  const m = s.trim().match(/^(\d{1,2})\.(\d{1,2})(?:\.(\d{4}))?/)
  if (!m) return null
  const d = +m[1], mo = +m[2], y = m[3] ? +m[3] : fallbackYear
  if (d < 1 || d > 31 || mo < 1 || mo > 12) return null
  return new Date(y, mo - 1, d, 18, 0, 0)
}

function parseScore(s: string): { homeScore: number; awayScore: number } | null {
  const m = s.trim().match(/(\d+):(\d+)/)
  if (!m) return null
  return { homeScore: +m[1], awayScore: +m[2] }
}

function parseMvpName(s: string): { firstName: string; lastName: string } | null {
  // Matches "MVP Ślęczka Patryk", "MVP: Ludwin Mateusz", "MVP - Bartek Ludwin"
  // Skips ambiguous entries like "MVP Kozieł Kamil/Patryk?"
  const m = s.match(/MVP[:\s-]+([A-ZŁŚŻŹĆĄĘÓŃ][a-złśżźćąęóń]+(?:\s[A-ZŁŚŻŹĆĄĘÓŃ][a-złśżźćąęóń]+)+)/u)
  if (!m) return null
  const parts = m[1].trim().split(/\s+/)
  if (parts.length < 2) return null
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") }
}

async function resolvePlayerForMvp(rawName: { firstName: string; lastName: string }): Promise<string | null> {
  // Try firstName lastName as-is
  let p = await prisma.player.findFirst({ where: { firstName: rawName.firstName, lastName: rawName.lastName } })
  if (p) return p.id
  // Try reversed: "Ludwin Mateusz" → firstName="Mateusz", lastName="Ludwin"
  const parts = [rawName.firstName, ...rawName.lastName.split(" ")]
  if (parts.length >= 2) {
    const rev = { firstName: parts[parts.length - 1], lastName: parts.slice(0, -1).join(" ") }
    p = await prisma.player.findFirst({ where: { firstName: rev.firstName, lastName: rev.lastName } })
    if (p) return p.id
  }
  // Try just the first word with empty last name
  // (handles players stored as single-word last names, e.g. "Ślęczka" stored as firstName="Ślęczka", lastName="")
  p = await prisma.player.findFirst({ where: { firstName: rawName.firstName, lastName: "" } })
  if (p) return p.id
  return null
}

function normalizeName(s: string): { firstName: string; lastName: string } | null {
  const t = s.trim()
  if (!t || t.length < 2) return null
  if (/[!?]/.test(t)) return null
  if (/^\d+%?$/.test(t)) return null
  if (/^https?:/i.test(t)) return null
  if (/^\$/.test(t)) return null
  const parts = t.split(/\s+/)
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") }
}

// ─── Player cache ─────────────────────────────────────────────────────────────

const playerCache = new Map<string, string>()

async function getOrCreatePlayer(firstName: string, lastName: string): Promise<string> {
  const key = `${firstName}|${lastName}`
  if (playerCache.has(key)) return playerCache.get(key)!
  let player = await prisma.player.findFirst({ where: { firstName, lastName } })
  if (!player) player = await prisma.player.create({ data: { firstName, lastName } })
  playerCache.set(key, player.id)
  return player.id
}

// ─── Stats format ─────────────────────────────────────────────────────────────
// Row 0: "1 kolejka",,,, "2 kolejka",,,, …
// Row 1: dates  (col 1, 5, 9, …)
// Row 2: scores (col 1, 5, 9, …)
// Row 3: "Gracz, Gole, Asysty, $" header (repeated)
// Row 4+: slot index (col 0), then per-round block: [name, goals, assists, $]

type PlayerEntry = {
  firstName: string
  lastName:  string
  goals:     number
  assists:   number
}

async function importStats(
  rows:     string[][],
  season:   { id: string },
  homeTeam: { id: string },
  awayTeam: { id: string },
  year:     number
) {
  const dateRow  = rows[1] ?? []
  const scoreRow = rows[2] ?? []

  const maxPossibleRound = Math.floor((Math.max(...rows.map(r => r.length)) - 1) / 4)
  let maxRound = 0
  for (let k = 1; k <= maxPossibleRound; k++) {
    if (parseDate((dateRow[1 + (k - 1) * 4] ?? "").trim(), year)) maxRound = k
  }

  let currentYear = year
  let prevMonth   = -1

  for (let k = 1; k <= maxRound; k++) {
    const baseCol  = 1 + (k - 1) * 4
    const dateStr  = (dateRow[baseCol]  ?? "").trim()
    const scoreStr = (scoreRow[baseCol] ?? "").trim()

    // Year rollover for seasons spanning two calendar years (e.g. 2025/2026)
    const moMatch = dateStr.match(/^(\d{1,2})\.(\d{1,2})/)
    const mo = moMatch ? +moMatch[2] : -1
    if (prevMonth > 0 && mo > 0 && mo < prevMonth - 3) currentYear++
    if (mo > 0) prevMonth = mo

    const date = parseDate(dateStr, currentYear)
    if (!date) continue
    if (/odwoła/i.test(scoreStr)) continue

    // Read player rows: col layout per round = [name, goals, assists, $]
    const players: PlayerEntry[] = []
    for (let r = 4; r < rows.length; r++) {
      const row = rows[r]
      if (!/^\d+$/.test((row[0] ?? "").trim())) break
      const name = normalizeName(row[baseCol] ?? "")
      if (!name) continue
      const goals   = Math.max(0, parseInt(row[baseCol + 1] ?? "") || 0)
      const assists = Math.max(0, parseInt(row[baseCol + 2] ?? "") || 0)
      players.push({ ...name, goals, assists })
    }

    const score = parseScore(scoreStr)
    if (players.length === 0 && !score) continue

    const mvpRaw = parseMvpName(scoreStr)

    const match = await prisma.match.create({
      data: {
        seasonId:    season.id,
        homeTeamId:  homeTeam.id,
        awayTeamId:  awayTeam.id,
        scheduledAt: date,
        playedAt:    score ? date : null,
        status:      score ? "PLAYED" : "SCHEDULED",
        homeScore:   score?.homeScore ?? null,
        awayScore:   score?.awayScore ?? null,
        round:       k,
        playerLimit: 14,
      },
    })

    // ── Lineups ──────────────────────────────────────────────────────────────
    const half = Math.ceil(players.length / 2)
    type PlayerWithId = { id: string; teamId: string; goals: number; assists: number }
    const resolved: PlayerWithId[] = []

    for (let i = 0; i < players.length; i++) {
      const { firstName, lastName, goals, assists } = players[i]
      const playerId = await getOrCreatePlayer(firstName, lastName)
      const teamId   = i < half ? homeTeam.id : awayTeam.id
      resolved.push({ id: playerId, teamId, goals, assists })

      await prisma.matchLineup.upsert({
        where:  { matchId_playerId: { matchId: match.id, playerId } },
        create: { matchId: match.id, playerId, teamId },
        update: { teamId },
      })
    }

    // ── Goals ─────────────────────────────────────────────────────────────────
    // Build flat lists for goals and assists, then assign assists to goals
    // (best-effort: correct counts, but specific goal↔assist pairing is arbitrary)
    const goalsList: Array<{ scorerId: string; teamId: string }> = []
    const assistQueue: string[] = []

    for (const p of resolved) {
      for (let g = 0; g < p.goals;   g++) goalsList.push({ scorerId: p.id, teamId: p.teamId })
      for (let a = 0; a < p.assists; a++) assistQueue.push(p.id)
    }

    let assistIdx = 0
    for (const goal of goalsList) {
      let assisterId: string | null = null
      while (assistIdx < assistQueue.length) {
        const candidate = assistQueue[assistIdx++]
        if (candidate !== goal.scorerId) { assisterId = candidate; break }
      }
      await prisma.goal.create({
        data: {
          matchId:   match.id,
          teamId:    goal.teamId,
          scorerId:  goal.scorerId,
          assisterId,
          isOwnGoal: false,
        },
      })
    }

    // ── MVP ────────────────────────────────────────────────────────────────────
    if (mvpRaw) {
      const mvpPlayerId = await resolvePlayerForMvp(mvpRaw)
      if (mvpPlayerId) {
        await prisma.match.update({ where: { id: match.id }, data: { mvpPlayerId } })
      }
    }

    const totalGoals   = goalsList.length
    const totalAssists = assistQueue.length
    console.log(
      `    kolejka ${k} (${dateStr} ${currentYear}): ${players.length} graczy` +
      `  ${scoreStr || "brak wyniku"}  [${totalGoals}G ${totalAssists}A]${mvpRaw ? ` MVP:${mvpRaw.firstName} ${mvpRaw.lastName}` : ""}`
    )
  }
}

// ─── Attendance format (2022/23) ─────────────────────────────────────────────
// Row 3: round labels ("Inauguracja", "2 Kolejka", …)
// Row 4: dates  (one per column, no colspan)
// Row 5: scores ("9:7 dla Jaca", "11:8 dla Bramiego", …)
// Row 6+: slot index (col 0), then player name per round (one column per round, no goals/assists)

function parseAttendanceScore(s: string): { homeScore: number; awayScore: number } | null {
  const m = s.trim().match(/(\d+):(\d+)/)
  if (!m) return null
  const a = +m[1], b = +m[2]
  // "X:Y dla Bramiego" → Brami (away) won → swap so away score > home score
  if (/bram/i.test(s)) return { homeScore: b, awayScore: a }
  return { homeScore: a, awayScore: b }
}

async function importAttendance(
  rows:     string[][],
  season:   { id: string },
  homeTeam: { id: string },
  awayTeam: { id: string },
  year:     number
) {
  const dateRow  = rows[4] ?? []
  const scoreRow = rows[5] ?? []
  const maxCol   = Math.max(...rows.map(r => r.length)) - 1

  let currentYear = year
  let prevMonth   = -1

  for (let k = 1; k <= maxCol; k++) {
    const dateStr  = (dateRow[k]  ?? "").trim()
    const scoreStr = (scoreRow[k] ?? "").trim()

    const moMatch = dateStr.match(/^(\d{1,2})\.(\d{1,2})/)
    const mo = moMatch ? +moMatch[2] : -1
    if (prevMonth > 0 && mo > 0 && mo < prevMonth - 3) currentYear++
    if (mo > 0) prevMonth = mo

    const date = parseDate(dateStr, currentYear)
    if (!date) continue

    const playerNames: { firstName: string; lastName: string }[] = []
    for (let r = 6; r < rows.length; r++) {
      const row = rows[r]
      if (!/^\d+$/.test((row[0] ?? "").trim())) continue
      const raw  = (row[k] ?? "").replace(/\(.*?\)/g, "").trim()
      const name = normalizeName(raw)
      if (name && name.firstName) playerNames.push(name)
    }

    const score = parseAttendanceScore(scoreStr)
    if (playerNames.length === 0 && !score) continue

    const mvpRaw = parseMvpName(scoreStr)

    const match = await prisma.match.create({
      data: {
        seasonId:    season.id,
        homeTeamId:  homeTeam.id,
        awayTeamId:  awayTeam.id,
        scheduledAt: date,
        playedAt:    score ? date : null,
        status:      score ? "PLAYED" : "SCHEDULED",
        homeScore:   score?.homeScore ?? null,
        awayScore:   score?.awayScore ?? null,
        round:       k,
        playerLimit: 14,
      },
    })

    const half = Math.ceil(playerNames.length / 2)
    for (let i = 0; i < playerNames.length; i++) {
      const { firstName, lastName } = playerNames[i]
      const playerId = await getOrCreatePlayer(firstName, lastName)
      const teamId   = i < half ? homeTeam.id : awayTeam.id
      await prisma.matchLineup.upsert({
        where:  { matchId_playerId: { matchId: match.id, playerId } },
        create: { matchId: match.id, playerId, teamId },
        update: { teamId },
      })
    }

    // ── MVP ────────────────────────────────────────────────────────────────────
    if (mvpRaw) {
      const mvpPlayerId = await resolvePlayerForMvp(mvpRaw)
      if (mvpPlayerId) {
        await prisma.match.update({ where: { id: match.id }, data: { mvpPlayerId } })
      }
    }

    console.log(
      `    kolejka ${k} (${dateStr} ${currentYear}): ${playerNames.length} graczy` +
      `  ${scoreStr || "brak wyniku"}${mvpRaw ? ` MVP:${mvpRaw.firstName} ${mvpRaw.lastName}` : ""}`
    )
  }
}

// ─── Season / team helpers ────────────────────────────────────────────────────

async function ensureSeason(name: string, year: number, isActive: boolean) {
  return prisma.season.create({
    data: {
      name,
      startDate: new Date(year, 3, 1),
      endDate:   new Date(year + 1, 3, 30),
      isActive,
    },
  })
}

async function ensureTeam(seasonId: string, name: string, color: string) {
  return prisma.team.create({ data: { seasonId, name, color } })
}

// ─── Reset ────────────────────────────────────────────────────────────────────

async function resetDB() {
  console.log("Czyszczenie bazy danych (konta użytkowników zachowane)…")
  await prisma.$transaction(async (tx) => {
    await tx.drawVote.deleteMany()
    await tx.matchDraw.deleteMany()
    await tx.goal.deleteMany()
    await tx.matchLineup.deleteMany()
    await tx.matchRegistration.deleteMany()
    await tx.match.deleteMany()
    await tx.teamPlayer.deleteMany()
    await tx.team.deleteMany()
    await tx.player.deleteMany()
    await tx.season.deleteMany()
  })
  playerCache.clear()
  console.log("✅ Baza wyczyszczona\n")
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  await resetDB()

  // ── 2022/23: attendance only (no goals/assists in this season's sheet) ──────
  console.log("=== Sezon 2022/23 (obecność) ===")
  const season2022   = await ensureSeason("Sezon 2022/23", 2022, false)
  const home2022     = await ensureTeam(season2022.id, "Drużyna Jaco",  "#3b82f6")
  const away2022     = await ensureTeam(season2022.id, "Drużyna Brami", "#ef4444")
  const file2022     = `${INFO_DIR}/Don Bosco Premier League - Dysk Google_files/sheet.html`
  console.log(`  Czytanie pliku: sheet.html`)
  const rows2022     = readSheet(file2022)
  console.log(`  Wierszy HTML: ${rows2022.length}`)
  await importAttendance(rows2022, season2022, home2022, away2022, 2022)

  // ── 2023/24 – 2026/27: full stats (goals + assists) ──────────────────────────
  console.log("\nImportowanie sezonów ze statystykami strzeleckimi (2023/24 – 2026/27)…\n")

  for (const cfg of SHEETS) {
    console.log(`\n=== Sezon ${cfg.label} ===`)

    const season   = await ensureSeason(cfg.seasonName, cfg.year, cfg.isActive)
    const homeTeam = await ensureTeam(season.id, cfg.homeTeamName, cfg.homeColor)
    const awayTeam = await ensureTeam(season.id, cfg.awayTeamName, cfg.awayColor)

    console.log(`  Czytanie pliku: ${cfg.file.split("/").pop()}`)
    const rows = readSheet(cfg.file)
    console.log(`  Wierszy HTML: ${rows.length}`)

    await importStats(rows, season, homeTeam, awayTeam, cfg.year)
  }

  const [totals] = await prisma.$queryRaw<Array<{
    seasons: bigint; matches: bigint; players: bigint; lineups: bigint; goals: bigint
  }>>`
    SELECT
      (SELECT COUNT(*) FROM seasons)       AS seasons,
      (SELECT COUNT(*) FROM matches)       AS matches,
      (SELECT COUNT(*) FROM players)       AS players,
      (SELECT COUNT(*) FROM match_lineups) AS lineups,
      (SELECT COUNT(*) FROM goals)         AS goals
  `
  console.log(`\n✅ Gotowe!`)
  console.log(
    `   Sezony: ${totals.seasons}  |  Mecze: ${totals.matches}  |` +
    `  Gracze: ${totals.players}  |  Składy: ${totals.lineups}  |  Gole: ${totals.goals}`
  )

  await pool.end()
}

main().catch(async (e) => { console.error(e); await pool.end(); process.exit(1) })
