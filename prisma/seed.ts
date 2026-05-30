import "dotenv/config"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../app/generated/prisma/client"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  // Gracze
  const players = await Promise.all([
    prisma.player.upsert({ where: { id: "p1" }, update: {}, create: { id: "p1", firstName: "Jan", lastName: "Kowalski", nickname: "Kowal" } }),
    prisma.player.upsert({ where: { id: "p2" }, update: {}, create: { id: "p2", firstName: "Piotr", lastName: "Nowak", nickname: "Nowek" } }),
    prisma.player.upsert({ where: { id: "p3" }, update: {}, create: { id: "p3", firstName: "Michał", lastName: "Wiśniewski", nickname: "Wiśnia" } }),
    prisma.player.upsert({ where: { id: "p4" }, update: {}, create: { id: "p4", firstName: "Tomasz", lastName: "Wójcik" } }),
    prisma.player.upsert({ where: { id: "p5" }, update: {}, create: { id: "p5", firstName: "Paweł", lastName: "Kowalczyk", nickname: "Pablo" } }),
    prisma.player.upsert({ where: { id: "p6" }, update: {}, create: { id: "p6", firstName: "Marek", lastName: "Kamiński", nickname: "Kaman" } }),
  ])

  // Sezon
  const season = await prisma.season.upsert({
    where: { id: "s1" },
    update: {},
    create: {
      id: "s1",
      name: "Wiosna 2026",
      startDate: new Date("2026-03-01"),
      endDate: new Date("2026-06-30"),
      isActive: true,
    },
  })

  // Drużyny
  const teamA = await prisma.team.upsert({
    where: { id: "t1" },
    update: {},
    create: { id: "t1", name: "FC Don Bosco", color: "#e63946", seasonId: season.id },
  })
  const teamB = await prisma.team.upsert({
    where: { id: "t2" },
    update: {},
    create: { id: "t2", name: "Salezjanie United", color: "#457b9d", seasonId: season.id },
  })

  // Przypisanie graczy do drużyn
  await prisma.teamPlayer.createMany({
    data: [
      { playerId: players[0].id, teamId: teamA.id },
      { playerId: players[1].id, teamId: teamA.id },
      { playerId: players[2].id, teamId: teamA.id },
      { playerId: players[3].id, teamId: teamB.id },
      { playerId: players[4].id, teamId: teamB.id },
      { playerId: players[5].id, teamId: teamB.id },
    ],
    skipDuplicates: true,
  })

  // Mecz
  const match = await prisma.match.upsert({
    where: { id: "m1" },
    update: {},
    create: {
      id: "m1",
      seasonId: season.id,
      homeTeamId: teamA.id,
      awayTeamId: teamB.id,
      scheduledAt: new Date("2026-05-25T16:00:00"),
      homeScore: 3,
      awayScore: 1,
      status: "PLAYED",
      playedAt: new Date("2026-05-25T17:30:00"),
      venue: "Boisko przy Don Bosco",
      round: 1,
    },
  })

  // Bramki
  await prisma.goal.createMany({
    data: [
      { matchId: match.id, teamId: teamA.id, scorerId: players[0].id, assisterId: players[1].id, minute: 12 },
      { matchId: match.id, teamId: teamA.id, scorerId: players[2].id, minute: 34 },
      { matchId: match.id, teamId: teamB.id, scorerId: players[3].id, minute: 45 },
      { matchId: match.id, teamId: teamA.id, scorerId: players[0].id, assisterId: players[2].id, minute: 67 },
    ],
    skipDuplicates: true,
  })

  // Skład
  await prisma.matchLineup.createMany({
    data: players.map((p, i) => ({
      matchId: match.id,
      playerId: p.id,
      teamId: i < 3 ? teamA.id : teamB.id,
    })),
    skipDuplicates: true,
  })

  console.log("Seed zakończony pomyślnie ✓")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
