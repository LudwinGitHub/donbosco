import "dotenv/config"
import { Pool } from "pg"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function main() {
  const ludwin = await pool.query(`
    SELECT p."firstName", p."lastName",
      COUNT(DISTINCT ml."matchId") as mecze,
      COUNT(DISTINCT g.id) FILTER (WHERE g."scorerId" = p.id) as gole,
      COUNT(DISTINCT g.id) FILTER (WHERE g."assisterId" = p.id) as asysty
    FROM players p
    LEFT JOIN match_lineups ml ON ml."playerId" = p.id
    LEFT JOIN goals g ON g."scorerId" = p.id OR g."assisterId" = p.id
    WHERE p."lastName" ILIKE '%ludwin%' OR p."firstName" ILIKE '%ludwin%'
    GROUP BY p.id, p."firstName", p."lastName"
    ORDER BY mecze DESC
  `)
  console.log("=== Ludwin ===")
  console.table(ludwin.rows)

  const all = await pool.query(`
    SELECT p."firstName", p."lastName", COUNT(DISTINCT ml."matchId") as mecze
    FROM players p
    LEFT JOIN match_lineups ml ON ml."playerId" = p.id
    GROUP BY p.id, p."firstName", p."lastName"
    ORDER BY mecze DESC, p."lastName", p."firstName"
  `)
  console.log("\n=== Wszyscy gracze (wg liczby meczów) ===")
  console.table(all.rows)

  await pool.end()
}

main().catch(async (e) => { console.error(e); await pool.end(); process.exit(1) })
