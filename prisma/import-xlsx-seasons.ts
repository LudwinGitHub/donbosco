/**
 * Importuje dane z pliku Excel "Don Bosco Premier League.xlsx" do bazy danych.
 *
 * Arkusze: 202324, 202425, 202526, 202627
 * Każdy mecz zajmuje 4 kolumny (B,C,D,E dla meczu 1, F,G,H,I dla meczu 2 itd.):
 *   Wiersz 1: "1 kolejka", "2 kolejka" co 4 kolumny
 *   Wiersz 2: Data meczu
 *   Wiersz 3: Wynik, np. "11:5 dla Patryka"
 *   Wiersz 4: Nagłówki: "Gracz", "Gole", "Asysty", "$"
 *   Wiersze 5+: Dane graczy (bold = drużyna Jaco, non-bold = drużyna Brami/Patryk)
 *
 * Uruchomienie:
 *   DATABASE_URL="..." npx tsx prisma/import-xlsx-seasons.ts
 */

import "dotenv/config"
import * as path from "path"
import ExcelJS from "exceljs"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../app/generated/prisma/client"

const pool    = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma  = new PrismaClient({ adapter })

const XLSX_PATH = path.join(__dirname, "../info/Don Bosco Premier League.xlsx")

// ─── Konfiguracja sezonów ─────────────────────────────────────────────────────

const SEASON_CONFIGS = [
  {
    sheetName:    "202324",
    seasonName:   "Sezon 2023/24",
    homeTeamName: "Drużyna Jaco",
    awayTeamName: "Drużyna Brami",
  },
  {
    sheetName:    "202425",
    seasonName:   "Sezon 2024/25",
    homeTeamName: "Drużyna Jaco",
    awayTeamName: "Drużyna Brami",
  },
  {
    sheetName:    "202526",
    seasonName:   "Sezon 2025/26",
    homeTeamName: "Drużyna Jaco",
    awayTeamName: "Drużyna Brami",
  },
  {
    sheetName:    "202627",
    seasonName:   "Sezon 2026/27",
    homeTeamName: "Drużyna Jaco",
    awayTeamName: "Drużyna Patryk",
  },
]

// ─── Scalanie zdublowanych zawodników ────────────────────────────────────────

const MERGE_GROUPS: Array<{
  aliases:   Array<{ firstName: string; lastName: string }>
  canonical: { firstName: string; lastName: string }
}> = [
  {
    aliases: [
      { firstName: "Jaco",   lastName: "" },
      { firstName: "Jacek",  lastName: "" },
      { firstName: "Jecek",  lastName: "" },
      { firstName: "Jacek",  lastName: "Serwański" },
      { firstName: "Jacek",  lastName: "Serwanski" },
    ],
    canonical: { firstName: "Jaco", lastName: "" },
  },
  {
    aliases: [
      { firstName: "Ludwin",  lastName: "Mat" },
      { firstName: "Mateusz", lastName: "Ludwin" },
      { firstName: "Matek",   lastName: "" },
      { firstName: "Matek",   lastName: "Ludwin" },
    ],
    canonical: { firstName: "Mateusz", lastName: "Ludwin" },
  },
]

async function mergePlayers() {
  for (const group of MERGE_GROUPS) {
    const found = await prisma.player.findMany({
      where: {
        OR: group.aliases.map(a => ({ firstName: a.firstName, lastName: a.lastName })),
      },
      include: {
        _count: { select: { matchLineups: true } },
      },
    })

    if (found.length === 0) continue
    if (found.length === 1) {
      const p = found[0]
      const { firstName, lastName } = group.canonical
      if (p.firstName !== firstName || p.lastName !== lastName) {
        await prisma.player.update({
          where: { id: p.id },
          data:  { firstName, lastName },
        })
        console.log(`  Przemianowano: "${p.firstName} ${p.lastName}" → "${firstName} ${lastName}"`)
      }
      continue
    }

    const sorted = [...found].sort((a, b) => {
      const aHasUser = (a as any).userId ? 1 : 0
      const bHasUser = (b as any).userId ? 1 : 0
      if (bHasUser !== aHasUser) return bHasUser - aHasUser
      return b._count.matchLineups - a._count.matchLineups
    })

    const canonical  = sorted[0]
    const duplicates = sorted.slice(1)

    const { firstName, lastName } = group.canonical
    if (canonical.firstName !== firstName || canonical.lastName !== lastName) {
      await prisma.player.update({ where: { id: canonical.id }, data: { firstName, lastName } })
    }

    for (const dup of duplicates) {
      console.log(`  Scalanie "${dup.firstName} ${dup.lastName}" → "${firstName} ${lastName}" (${dup._count.matchLineups} meczów)`)

      await prisma.matchLineup.updateMany({ where: { playerId: dup.id }, data: { playerId: canonical.id } })
      await prisma.goal.updateMany({ where: { scorerId:   dup.id }, data: { scorerId:   canonical.id } })
      await prisma.goal.updateMany({ where: { assisterId: dup.id }, data: { assisterId: canonical.id } })
      await prisma.match.updateMany({ where: { mvpPlayerId: dup.id }, data: { mvpPlayerId: canonical.id } })

      const dupFull  = await prisma.player.findUnique({ where: { id: dup.id } })
      const canFull  = await prisma.player.findUnique({ where: { id: canonical.id } })
      if ((dupFull as any)?.userId && !(canFull as any)?.userId) {
        await prisma.player.update({ where: { id: canonical.id }, data: { userId: (dupFull as any).userId } })
      }

      await prisma.player.delete({ where: { id: dup.id } })
    }

    console.log(`  ✓ "${firstName} ${lastName}" (${found.length} rekordów scalonych w 1)`)
  }
}

// ─── Cache zawodników ─────────────────────────────────────────────────────────

const playerCache = new Map<string, string>()

function normalizePlayerName(firstName: string, lastName: string): { firstName: string; lastName: string } {
  for (const group of MERGE_GROUPS) {
    if (group.aliases.some(a => a.firstName === firstName && a.lastName === lastName)) {
      return group.canonical
    }
  }
  return { firstName, lastName }
}

async function getOrCreatePlayer(firstName: string, lastName: string): Promise<string> {
  ;({ firstName, lastName } = normalizePlayerName(firstName, lastName))
  const key = `${firstName}|${lastName}`
  if (playerCache.has(key)) return playerCache.get(key)!
  let p = await prisma.player.findFirst({ where: { firstName, lastName } })
  if (!p) {
    p = await prisma.player.create({ data: { firstName, lastName } })
    console.log(`    Nowy zawodnik: ${firstName} ${lastName}`)
  }
  playerCache.set(key, p.id)
  return p.id
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseName(raw: string): { firstName: string; lastName: string } | null {
  const s = raw.trim()
  if (!s || s.length < 2) return null
  // Reject non-name strings (notes, cancelled markers, etc.)
  if (s.includes("!") || s.includes("?") || /odwoła/i.test(s) || s.length > 40) return null
  const parts = s.split(/\s+/)
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") }
}

/**
 * Parsuje wynik meczu z ciągu znaków.
 *
 * Format: pierwsza liczba = gole zwycięzcy, druga = gole przegranego.
 * "dla Jaca/Jacka" → home (Jaco) wygrał → homeScore=first, awayScore=second
 * "dla Barta/Bramiego/Patryka/Maligi" → away wygrał → homeScore=second, awayScore=first
 * brak "dla" lub remis → homeScore=first, awayScore=second
 */
function parseScore(s: string): { homeScore: number; awayScore: number } | null {
  if (!s) return null
  const m = s.match(/(\d+)\s*:\s*(\d+)/)
  if (!m) return null
  const [first, second] = [+m[1], +m[2]]

  const dlaMatch = s.match(/dla\s+(\w+)/i)
  if (!dlaMatch) return { homeScore: first, awayScore: second }  // remis lub brak info

  // "dla Jac..." → homeTeam (bold/Jaco) wygrał → first = home
  if (/^jac/i.test(dlaMatch[1])) return { homeScore: first, awayScore: second }

  // "dla Barta/Bramiego/Patryka/Maligi..." → awayTeam wygrał → first = away
  return { homeScore: second, awayScore: first }
}

/**
 * Zwraca wartość tekstową komórki lub pusty string.
 * Obsługuje: string, number, Date, boolean, obiekty RichText, FormulaValue.
 */
function cellText(cell: ExcelJS.Cell): string {
  const v = cell.value
  if (v === null || v === undefined) return ""
  if (typeof v === "string") return v
  if (typeof v === "number") return String(v)
  if (typeof v === "boolean") return String(v)
  if (v instanceof Date) return "" // daty obsługujemy jako Date
  // RichText
  if (typeof v === "object" && "richText" in v) {
    return (v as ExcelJS.CellRichTextValue).richText.map(rt => rt.text).join("")
  }
  // Formula z wynikiem
  if (typeof v === "object" && "result" in v) {
    const res = (v as ExcelJS.CellFormulaValue).result
    if (res === null || res === undefined) return ""
    if (typeof res === "string") return res
    if (typeof res === "number") return String(res)
    return String(res)
  }
  return String(v)
}

/**
 * Zwraca wartość numeryczną komórki lub 0.
 */
function cellNumber(cell: ExcelJS.Cell): number {
  const v = cell.value
  if (v === null || v === undefined) return 0
  if (typeof v === "number") return v
  if (typeof v === "string") return parseInt(v) || 0
  if (typeof v === "object" && "result" in v) {
    const res = (v as ExcelJS.CellFormulaValue).result
    if (typeof res === "number") return res
    return 0
  }
  return 0
}

/**
 * Zwraca Date z komórki lub null.
 */
function cellDate(cell: ExcelJS.Cell): Date | null {
  const v = cell.value
  if (v instanceof Date) {
    // Sprawdź czy to nie jest wartość "zero" Excela (1899-12-30)
    if (v.getFullYear() < 1900) return null
    return v
  }
  return null
}

/**
 * Sprawdza czy komórka ma bold (obsługuje też RichText).
 */
function isCellBold(cell: ExcelJS.Cell): boolean {
  // Sprawdź styl bezpośredni
  if (cell.font?.bold === true) return true

  // Sprawdź RichText — jeśli JAKIKOLWIEK run jest bold, traktujemy jako bold
  const v = cell.value
  if (v !== null && typeof v === "object" && "richText" in v) {
    const rt = v as ExcelJS.CellRichTextValue
    return rt.richText.some(run => run.font?.bold === true)
  }

  return false
}

// ─── Typ danych gracza ────────────────────────────────────────────────────────

interface ParsedPlayer {
  firstName: string
  lastName:  string
  goals:     number
  assists:   number
  isBold:    boolean   // true = drużyna Jaco (homeTeam)
}

interface ParsedMatch {
  round:       number
  date:        Date | null
  cancelled:   boolean
  homeScore:   number | null
  awayScore:   number | null
  players:     ParsedPlayer[]
  ownGoals:    number   // liczba własnych bramek (bez przypisanego strzelca)
}

// ─── Parsowanie arkusza ───────────────────────────────────────────────────────

function parseWorksheet(ws: ExcelJS.Worksheet): ParsedMatch[] {
  const matches: ParsedMatch[] = []

  const colCount = ws.actualColumnCount
  // Mecze zaczynają się od kolumny 2 (B), co 4 kolumny
  // Kolumna A (1) to np. numer slotu lub "Rezerwa"

  let round = 0

  for (let startCol = 2; startCol <= colCount; startCol += 4) {
    // Wiersz 1: etykieta meczu ("1 kolejka", "2 kolejka", ...)
    const labelCell = ws.getCell(1, startCol)
    const label     = cellText(labelCell).trim()

    // Koniec danych gdy brak etykiety lub napotkamy sekcję podsumowania
    if (!label) continue
    if (/WYNIK|SUMA|TABELA|STRZEL/i.test(label)) break

    // Wyciągnij numer kolejki z etykiety
    const roundMatch = label.match(/(\d+)\s*kolejka/i)
    round = roundMatch ? +roundMatch[1] : round + 1

    // Wiersz 2: data
    const dateCell = ws.getCell(2, startCol)
    const date     = cellDate(dateCell)

    // Sprawdź czy GRA ODWOŁANA
    const dateText = cellText(dateCell).trim()
    const isCancelledByDate = /odwoła/i.test(dateText)

    // Wiersz 3: wynik
    const resultCell = ws.getCell(3, startCol)
    const resultText = cellText(resultCell).trim()
    const isCancelledByResult = /odwoła|GRA ODWOŁ/i.test(resultText)

    const cancelled = isCancelledByDate || isCancelledByResult || (!date && !isCancelledByResult)

    // Parsuj wynik
    let homeScore: number | null = null
    let awayScore: number | null = null
    if (!cancelled && resultText && !/\[object Object\]/i.test(resultText)) {
      const score = parseScore(resultText)
      if (score) {
        homeScore = score.homeScore
        awayScore = score.awayScore
      }
    }

    // Parsuj graczy (wiersze 5..60)
    const players: ParsedPlayer[] = []
    let ownGoals = 0

    for (let row = 5; row <= 80; row++) {
      // Kolumna A: numer slotu lub "Rezerwa"
      const colACell = ws.getCell(row, 1)
      const colAText = cellText(colACell).trim()

      // "Rezerwa" to rezerwowi gracze — pomijamy, ale nie przerywamy (po nich może być wiersz Own Goal)
      if (/rezerwa/i.test(colAText)) continue

      // Sprawdź własne gole (kolumna A = "Own Goal" lub kolumna z nazwą gracza = "Own Goal")
      const nameCell  = ws.getCell(row, startCol)
      const nameText  = cellText(nameCell).trim()

      if (/own goal/i.test(nameText) || /own goal/i.test(colAText)) {
        // Wartość w kolumnie "$" (startCol+3) może zawierać liczbę własnych goli
        const ogCell  = ws.getCell(row, startCol + 3)
        const ogValue = cellNumber(ogCell)
        ownGoals += ogValue > 0 ? ogValue : 1
        continue
      }

      // Sprawdź czy kolumna B (nameCell) jest pusta → koniec meczowych graczy
      if (!nameText) continue

      // Filtruj linie nagłówkowe ("Gracz", "Gole", "Asysty", "$")
      if (/^gracz$/i.test(nameText) || /^gole$/i.test(nameText)) continue

      // Parsuj nazwę
      const name = parseName(nameText)
      if (!name) continue

      const goalsCell   = ws.getCell(row, startCol + 1)
      const assistsCell = ws.getCell(row, startCol + 2)

      const goals   = Math.max(0, cellNumber(goalsCell))
      const assists = Math.max(0, cellNumber(assistsCell))
      const bold    = isCellBold(nameCell)

      players.push({
        firstName: name.firstName,
        lastName:  name.lastName,
        goals,
        assists,
        isBold: bold,
      })
    }

    matches.push({
      round,
      date,
      cancelled,
      homeScore,
      awayScore,
      players,
      ownGoals,
    })
  }

  return matches
}

// ─── Import sezonu ────────────────────────────────────────────────────────────

async function importSeason(
  ws:          ExcelJS.Worksheet,
  seasonName:  string,
  homeTeamName: string,
  awayTeamName: string,
) {
  // Znajdź sezon w DB
  const season = await prisma.season.findFirst({ where: { name: seasonName }, include: { teams: true } })
  if (!season) {
    console.error(`  ❌ Nie znaleziono sezonu "${seasonName}" w bazie`)
    return
  }

  const homeTeam = season.teams.find(t => t.name === homeTeamName)
  const awayTeam = season.teams.find(t => t.name === awayTeamName)
  if (!homeTeam || !awayTeam) {
    console.error(`  ❌ Nie znaleziono drużyn sezonu "${seasonName}". Teams: ${season.teams.map(t => t.name).join(", ")}`)
    return
  }

  console.log(`  Drużyny: "${homeTeam.name}" (home) vs "${awayTeam.name}" (away)`)

  // Usuń istniejące dane sezonu
  const existing = await prisma.match.findMany({ where: { seasonId: season.id } })
  if (existing.length > 0) {
    console.log(`  Usuwanie ${existing.length} istniejących meczów…`)
    await prisma.$transaction(async (tx) => {
      const ids = existing.map(m => m.id)
      await tx.drawVote.deleteMany({ where: { matchId: { in: ids } } })
      await tx.matchDraw.deleteMany({ where: { matchId: { in: ids } } })
      await tx.goal.deleteMany({ where: { matchId: { in: ids } } })
      await tx.matchLineup.deleteMany({ where: { matchId: { in: ids } } })
      await tx.matchRegistration.deleteMany({ where: { matchId: { in: ids } } })
      await tx.match.deleteMany({ where: { id: { in: ids } } })
    })
    console.log("  ✓ Usunięto")
  }

  // Parsuj arkusz
  const parsedMatches = parseWorksheet(ws)
  console.log(`  Sparsowano ${parsedMatches.length} meczów z arkusza`)

  let importedMatches = 0
  let importedGoals   = 0
  let importedPlayers = new Set<string>()

  for (const pm of parsedMatches) {
    // Pomiń mecze bez daty i bez anulowania (błędne dane)
    if (!pm.date && !pm.cancelled) {
      console.log(`    kolejka ${pm.round}: brak daty — pomijam`)
      continue
    }

    // Ustal datę meczu (dla anulowanych używamy placeholder)
    const matchDate = pm.date ?? new Date(2000, 0, 1)

    const match = await prisma.match.create({
      data: {
        seasonId:    season.id,
        homeTeamId:  homeTeam.id,
        awayTeamId:  awayTeam.id,
        scheduledAt: matchDate,
        playedAt:    pm.cancelled ? null : matchDate,
        status:      pm.cancelled ? "CANCELLED" : (pm.homeScore !== null ? "PLAYED" : "SCHEDULED"),
        homeScore:   pm.homeScore,
        awayScore:   pm.awayScore,
        round:       pm.round,
        playerLimit: 14,
      },
    })

    if (pm.cancelled) {
      const dateStr = pm.date ? pm.date.toLocaleDateString("pl-PL") : "brak daty"
      console.log(`    kolejka ${pm.round} (${dateStr}): ODWOŁANA`)
      importedMatches++
      continue
    }

    // Sprawdź czy są bolds — jeśli nie ma żadnego, wszyscy idą do awayTeam
    const hasBolds = pm.players.some(p => p.isBold)

    // Skład + gole
    type Resolved = { id: string; teamId: string; goals: number; assists: number }
    const resolved: Resolved[] = []

    for (const player of pm.players) {
      const playerId = await getOrCreatePlayer(player.firstName, player.lastName)
      importedPlayers.add(playerId)

      // Bold = homeTeam (Jaco), non-bold = awayTeam
      // Jeśli brak boldów → wszyscy do awayTeam
      const teamId = (hasBolds && player.isBold) ? homeTeam.id : awayTeam.id

      resolved.push({ id: playerId, teamId, goals: player.goals, assists: player.assists })

      await prisma.matchLineup.upsert({
        where:  { matchId_playerId: { matchId: match.id, playerId } },
        create: { matchId: match.id, playerId, teamId },
        update: { teamId },
      })
    }

    // Gole (best-effort pairing z asystami)
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
        data: { matchId: match.id, teamId: goal.teamId, scorerId: goal.scorerId, assisterId, isOwnGoal: false },
      })
      importedGoals++
    }

    // Own goals — przypisz do strzelca pierwszego gracza awayTeam (lub homeTeam jako fallback)
    if (pm.ownGoals > 0) {
      // Własna bramka jest liczona jako gol dla drużyny przeciwnej
      // Zgodnie z logiką: ownGoal strzelca z drużyny homeTeam → teamId = awayTeam (i odwrotnie)
      // Upraszczamy: przypisujemy do homeTeam (jak w update-2026-season.ts ownGoalAway)
      const firstHomePlayer = resolved.find(r => r.teamId === homeTeam.id)
      const firstAwayPlayer = resolved.find(r => r.teamId === awayTeam.id)
      const ogScorer = firstAwayPlayer ?? firstHomePlayer

      if (ogScorer) {
        for (let i = 0; i < pm.ownGoals; i++) {
          // Samobój strzelony przez gracza drużyny X liczy się dla drużyny przeciwnej
          const ogTeamId = ogScorer.teamId === homeTeam.id ? awayTeam.id : homeTeam.id
          await prisma.goal.create({
            data: {
              matchId:   match.id,
              teamId:    ogTeamId,
              scorerId:  ogScorer.id,
              isOwnGoal: true,
            },
          })
          importedGoals++
        }
      }
    }

    const dateStr = pm.date!.toLocaleDateString("pl-PL")
    const score   = pm.homeScore !== null ? `${pm.homeScore}:${pm.awayScore}` : "brak wyniku"
    const boldInfo = hasBolds ? "" : " [brak boldów→awayTeam]"
    console.log(
      `    kolejka ${pm.round} (${dateStr})  ${score}` +
      `  graczy: ${pm.players.length} (${resolved.filter(r => r.teamId === homeTeam.id).length}+${resolved.filter(r => r.teamId === awayTeam.id).length})` +
      `  [${goalsList.length}G ${assistQueue.length}A${pm.ownGoals ? ` +${pm.ownGoals}OG` : ""}]${boldInfo}`
    )

    importedMatches++
  }

  console.log(`  → Zaimportowano: ${importedMatches} meczów, ${importedGoals} goli, ${importedPlayers.size} unikalnych graczy`)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Import XLSX sezonów Don Bosco Premier League ===\n")
  console.log(`Plik: ${XLSX_PATH}\n`)

  // 1. Scal zdublowanych zawodników
  console.log("=== Scalanie zawodników ===")
  await mergePlayers()
  console.log()

  // 2. Wczytaj plik Excel
  console.log("Wczytywanie pliku Excel…")
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(XLSX_PATH)
  console.log(`Arkusze: ${workbook.worksheets.map(ws => ws.name).join(", ")}\n`)

  // 3. Importuj sezony
  for (const cfg of SEASON_CONFIGS) {
    console.log(`=== Sezon: ${cfg.seasonName} (arkusz: ${cfg.sheetName}) ===`)

    const ws = workbook.getWorksheet(cfg.sheetName)
    if (!ws) {
      console.error(`  ❌ Nie znaleziono arkusza "${cfg.sheetName}"`)
      continue
    }

    await importSeason(ws, cfg.seasonName, cfg.homeTeamName, cfg.awayTeamName)
    console.log()
  }

  // 4. Scal ponownie (import mógł stworzyć nowe aliasy)
  console.log("=== Scalanie zawodników (po imporcie) ===")
  playerCache.clear()
  await mergePlayers()
  console.log()

  // 5. Podsumowanie globalne
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
  console.log("=== Podsumowanie globalne ===")
  console.log(
    `Sezony: ${totals.seasons}  |  Mecze: ${totals.matches}  |` +
    `  Gracze: ${totals.players}  |  Składy: ${totals.lineups}  |  Gole: ${totals.goals}`
  )

  await pool.end()
}

main().catch(async (e) => { console.error(e); await pool.end(); process.exit(1) })
