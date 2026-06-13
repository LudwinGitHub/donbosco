/**
 * Aktualizuje sezon 2026/27 na podstawie danych z PDF.
 *
 * Dane wyodrębnione z "Don Bosco Premier League - Dysk Google (2).pdf":
 *   M1  9.04.2026  5:11  Patryk wygrywa
 *   M2 16.04.2026 11:9   Jacek wygrywa
 *   M3 23.04.2026  5:4   Jacek wygrywa
 *
 * Uruchom:
 *   DATABASE_URL="neon_connection_string" npx tsx prisma/update-2026-season.ts
 */

import "dotenv/config"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../app/generated/prisma/client"

const pool    = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma  = new PrismaClient({ adapter })

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
      // Jeden rekord — tylko upewnij się że ma kanoniczną nazwę
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

    // Wiele rekordów — scala do kanonicznego (preferuj ten z kontem lub więcej meczami)
    const sorted = [...found].sort((a, b) => {
      const aHasUser = (a as any).userId ? 1 : 0
      const bHasUser = (b as any).userId ? 1 : 0
      if (bHasUser !== aHasUser) return bHasUser - aHasUser
      return b._count.matchLineups - a._count.matchLineups
    })

    const canonical = sorted[0]
    const duplicates = sorted.slice(1)

    // Upewnij się że kanoniczny ma właściwą nazwę
    const { firstName, lastName } = group.canonical
    if (canonical.firstName !== firstName || canonical.lastName !== lastName) {
      await prisma.player.update({ where: { id: canonical.id }, data: { firstName, lastName } })
    }

    for (const dup of duplicates) {
      console.log(`  Scalanie "${dup.firstName} ${dup.lastName}" → "${firstName} ${lastName}" (${dup._count.matchLineups} meczów)`)

      await prisma.matchLineup.updateMany({
        where: { playerId: dup.id },
        data:  { playerId: canonical.id },
      })
      await prisma.goal.updateMany({
        where: { scorerId: dup.id },
        data:  { scorerId: canonical.id },
      })
      await prisma.goal.updateMany({
        where: { assisterId: dup.id },
        data:  { assisterId: canonical.id },
      })
      await prisma.match.updateMany({
        where: { mvpPlayerId: dup.id },
        data:  { mvpPlayerId: canonical.id },
      })
      // Przenieś konto użytkownika jeśli duplikat ma konto a kanoniczny nie
      const dupFull = await prisma.player.findUnique({ where: { id: dup.id } })
      const canonFull = await prisma.player.findUnique({ where: { id: canonical.id } })
      if ((dupFull as any)?.userId && !(canonFull as any)?.userId) {
        await prisma.player.update({
          where: { id: canonical.id },
          data:  { userId: (dupFull as any).userId },
        })
      }

      await prisma.player.delete({ where: { id: dup.id } })
    }

    console.log(`  ✓ "${firstName} ${lastName}" (${found.length} rekordów scalonych w 1)`)
  }
}

// ─── Cache zawodników ─────────────────────────────────────────────────────────

const playerCache = new Map<string, string>()

async function getOrCreatePlayer(firstName: string, lastName: string): Promise<string> {
  const key = `${firstName}|${lastName}`
  if (playerCache.has(key)) return playerCache.get(key)!
  let p = await prisma.player.findFirst({ where: { firstName, lastName } })
  if (!p) {
    p = await prisma.player.create({ data: { firstName, lastName } })
    console.log(`  Nowy zawodnik: ${firstName} ${lastName}`)
  }
  playerCache.set(key, p.id)
  return p.id
}

// ─── Dane z PDF ───────────────────────────────────────────────────────────────

// Każdy wpis: { n: "Imię Nazwisko", g: gole, a: asysty }
// Nazwy zgodne z arkuszem (normalizacja: pierwsze słowo = firstName, reszta = lastName)

type Entry = { n: string; g: number; a: number }

function entry(n: string, g = 0, a = 0): Entry { return { n, g, a } }

function parseName(n: string): { firstName: string; lastName: string } {
  const parts = n.trim().split(/\s+/)
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") }
}

const MATCH_DATA = [
  {
    date:      new Date(2026, 3, 9, 18, 30, 0),  // 9 kwiecień 2026, 18:30
    round:     1,
    homeScore: 5,
    awayScore: 11,
    // Drużyna Jaco (pogrubieni)
    jacek: [
      entry("Jaco",        3, 0),
      entry("Piech",       1, 4),
      entry("Szumiec",     1, 1),
      entry("Bart",        0, 0),
      entry("Mateusz Ludwin", 0, 0),
      entry("Tamar",       0, 0),
      entry("Malik",       0, 0),
      entry("Olivier",     0, 0),
      entry("Murzyn",      0, 1),
      entry("Kamil Kozieł",0, 0),
      entry("Ślęczka",     0, 0),
      entry("Szymaniak",   0, 0),
    ],
    // Drużyna Patryka (niepogrubieni, $)
    patryk: [
      entry("Bicz",         3, 1),
      entry("Kamil Kozieł", 2, 1),
      entry("Olivier",      2, 0),
      entry("Bramora",      1, 1),
      entry("Ślęczka",      1, 1),
      entry("Szumiec",      1, 1),
      entry("Bart",         0, 0),
      entry("Mazur",        0, 0),
      entry("Miłosz",       0, 0),
      entry("Tamar",        0, 0),
      entry("Woźniak",      0, 0),
      entry("Jaco",         0, 0),
      entry("Szymaniak",    0, 0),
      entry("Szymeczko",    0, 0),
    ],
    ownGoalAway: 1,   // 1 OG w bramce Jacka (doliczony do awayScore)
  },
  {
    date:      new Date(2026, 3, 16, 18, 30, 0), // 16 kwiecień 2026
    round:     2,
    homeScore: 11,
    awayScore: 9,
    jacek: [
      entry("Murzyn",       2, 2),
      entry("Kamil Kozieł", 2, 3),
      entry("Ślęczka",      2, 0),
      entry("Malik",        1, 0),
      entry("Szymaniak",    1, 0),
      entry("Tamar",        1, 0),
      entry("Bart",         0, 1),
      entry("Olivier",      0, 1),
      entry("Mateusz Ludwin", 0, 0),
      entry("Szumiec",      0, 0),
    ],
    patryk: [
      entry("Bicz",         2, 0),
      entry("Kamil Kozieł", 2, 0),
      entry("Olivier",      2, 0),
      entry("Bramora",      1, 1),
      entry("Ślęczka",      1, 0),
      entry("Tamar",        1, 0),
      entry("Jaco",         0, 1),
      entry("Mazur",        0, 1),
      entry("Woźniak",      0, 1),
      entry("Bart",         0, 0),
      entry("Miłosz",       0, 0),
      entry("Szymaniak",    0, 0),
      entry("Szymeczko",    0, 0),
      entry("Szumiec",      0, 0),
    ],
    ownGoalAway: 0,
  },
  {
    date:      new Date(2026, 3, 23, 18, 30, 0), // 23 kwiecień 2026
    round:     3,
    homeScore: 5,
    awayScore: 4,
    jacek: [
      entry("Murzyn",      1, 0),
      entry("Ślęczka",     1, 0),
      entry("Tamar",       0, 1),
      entry("Olivier",     0, 1),
      entry("Bart",           0, 0),
      entry("Mateusz Ludwin", 0, 0),
      entry("Malik",          0, 0),
      entry("Szymaniak",      0, 0),
      entry("Szumiec",        0, 0),
    ],
    patryk: [
      entry("Mazur",          0, 1),
      entry("Woźniak",        0, 1),
      entry("Bart",           0, 1),
      entry("Jaco",           0, 0),
      entry("Miłosz",         0, 0),
      entry("Bramora",        0, 0),
      entry("Olivier",        0, 0),
      entry("Tamar",          0, 0),
      entry("Ślęczka",        0, 0),
      entry("Mateusz Ludwin", 0, 0),
      entry("Szumiec",     0, 0),
      entry("Szymaniak",   0, 0),
      entry("Abratański",  0, 0),
      entry("Szymeczko",   0, 0),
    ],
    ownGoalAway: 0,
  },
]

// ─── Import ───────────────────────────────────────────────────────────────────

async function main() {
  // 1. Scal zdublowanych zawodników
  console.log("\n=== Scalanie zawodników ===")
  await mergePlayers()

  // 2. Znajdź sezon 2026/27
  const season = await prisma.season.findFirst({
    where: { name: { contains: "2026" } },
    include: { teams: true },
  })
  if (!season) {
    console.error("❌ Nie znaleziono sezonu 2026/27 w bazie. Sprawdź czy import-history.ts był uruchamiany.")
    return
  }
  console.log(`\nSezon: ${season.name} (id: ${season.id})`)

  const homeTeam = season.teams.find(t => /jaco|jacek/i.test(t.name))
  const awayTeam = season.teams.find(t => /patryk/i.test(t.name))
  if (!homeTeam || !awayTeam) {
    console.error("❌ Nie znaleziono drużyn sezonu. Teams:", season.teams.map(t => t.name))
    return
  }
  console.log(`Drużyna Jaco: ${homeTeam.name} (${homeTeam.id})`)
  console.log(`Drużyna Patryk: ${awayTeam.name} (${awayTeam.id})`)

  // 3. Usuń istniejące mecze sezonu
  const existing = await prisma.match.findMany({ where: { seasonId: season.id } })
  if (existing.length > 0) {
    console.log(`\nUsuwanie ${existing.length} istniejących meczów sezonu 2026/27…`)
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

  // 4. Importuj 3 mecze
  console.log("\n=== Import meczów 2026/27 ===")

  for (const md of MATCH_DATA) {
    const match = await prisma.match.create({
      data: {
        seasonId:    season.id,
        homeTeamId:  homeTeam.id,
        awayTeamId:  awayTeam.id,
        scheduledAt: md.date,
        playedAt:    md.date,
        status:      "PLAYED",
        homeScore:   md.homeScore,
        awayScore:   md.awayScore,
        round:       md.round,
        playerLimit: 14,
      },
    })

    // Skład + gole
    type Resolved = { id: string; teamId: string; goals: number; assists: number }
    const resolved: Resolved[] = []

    for (const e of md.jacek) {
      const { firstName, lastName } = parseName(e.n)
      const id = await getOrCreatePlayer(firstName, lastName)
      resolved.push({ id, teamId: homeTeam.id, goals: e.g, assists: e.a })
      await prisma.matchLineup.upsert({
        where:  { matchId_playerId: { matchId: match.id, playerId: id } },
        create: { matchId: match.id, playerId: id, teamId: homeTeam.id },
        update: { teamId: homeTeam.id },
      })
    }
    for (const e of md.patryk) {
      const { firstName, lastName } = parseName(e.n)
      const id = await getOrCreatePlayer(firstName, lastName)
      resolved.push({ id, teamId: awayTeam.id, goals: e.g, assists: e.a })
      await prisma.matchLineup.upsert({
        where:  { matchId_playerId: { matchId: match.id, playerId: id } },
        create: { matchId: match.id, playerId: id, teamId: awayTeam.id },
        update: { teamId: awayTeam.id },
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
    }

    // Own goal (bez przypisanego strzelca)
    if (md.ownGoalAway > 0) {
      for (let i = 0; i < md.ownGoalAway; i++) {
        await prisma.goal.create({
          data: {
            matchId:   match.id,
            teamId:    awayTeam.id,
            scorerId:  resolved.find(r => r.teamId === homeTeam.id)!.id,
            isOwnGoal: true,
          },
        })
      }
    }

    const totalGoals = goalsList.length + md.ownGoalAway
    console.log(
      `  kolejka ${md.round} (${md.date.toLocaleDateString("pl-PL")})` +
      `  ${md.homeScore}:${md.awayScore}` +
      `  Jaco: ${md.jacek.length}os, Patryk: ${md.patryk.length}os` +
      `  [${goalsList.length}G ${assistQueue.length}A${md.ownGoalAway ? ` +${md.ownGoalAway}OG` : ""}]`
    )
  }

  // 5. Podsumowanie
  const [stats] = await prisma.$queryRaw<Array<{
    matches: bigint; players: bigint; lineups: bigint; goals: bigint
  }>>`
    SELECT
      (SELECT COUNT(*) FROM matches WHERE "seasonId" = ${season.id}) AS matches,
      (SELECT COUNT(DISTINCT "playerId") FROM match_lineups ml
       JOIN matches m ON m.id = ml."matchId" WHERE m."seasonId" = ${season.id}) AS players,
      (SELECT COUNT(*) FROM match_lineups ml
       JOIN matches m ON m.id = ml."matchId" WHERE m."seasonId" = ${season.id}) AS lineups,
      (SELECT COUNT(*) FROM goals g
       JOIN matches m ON m.id = g."matchId" WHERE m."seasonId" = ${season.id}) AS goals
  `
  console.log(`\n✅ Sezon 2026/27 zaktualizowany:`)
  console.log(`   Mecze: ${stats.matches} | Gracze: ${stats.players} | Składy: ${stats.lineups} | Gole: ${stats.goals}`)

  await pool.end()
}

main().catch(async (e) => { console.error(e); await pool.end(); process.exit(1) })
