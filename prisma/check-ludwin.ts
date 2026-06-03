import { readFileSync } from "fs"

const INFO_DIR = `${__dirname}/../info`

const FILES = [
  { label: "2022/23", file: `${INFO_DIR}/Don Bosco Premier League - Dysk Google_files/sheet.html`, type: "attendance" },
  { label: "2023/24", file: `${INFO_DIR}/Don Bosco Premier League - 2023_files/sheet.html`, type: "stats" },
  { label: "2024/25", file: `${INFO_DIR}/Don Bosco Premier League - 2024_files/sheet.html`, type: "stats" },
  { label: "2025/26", file: `${INFO_DIR}/Don Bosco Premier League - 2025_files/sheet.html`, type: "stats" },
  { label: "2026/27", file: `${INFO_DIR}/Don Bosco Premier League - Current_files/sheet.html`, type: "stats" },
]

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
        .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
        .replace(/&nbsp;/g, " ").replace(/&#39;/g, "'")
        .trim().replace(/\s+/g, " ")
      cells.push(text)
      for (let i = 1; i < colspan; i++) cells.push("")
    }
    if (cells.some(c => c.length > 0)) rows.push(cells)
  }
  return rows
}

function isLudwin(name: string): boolean {
  return /ludwin/i.test(name)
}

type Stats = { mecze: number; gole: number; asysty: number }
type Person = { label: string; match: (n: string) => boolean; stats: Record<string, Stats> }

const persons: Person[] = [
  { label: "Mateusz Ludwin (Mat)", match: n => /ludwin/i.test(n) && /mat/i.test(n), stats: {} },
  { label: "Bartek Ludwin (Bar)",  match: n => /ludwin/i.test(n) && /bar/i.test(n), stats: {} },
]

for (const { label, file, type } of FILES) {
  const html = readFileSync(file, "utf-8")
  const rows = parseHTMLTable(html)

  for (const p of persons) {
    p.stats[label] = { mecze: 0, gole: 0, asysty: 0 }
  }

  if (type === "attendance") {
    const maxCol = Math.max(...rows.map(r => r.length)) - 1
    for (let k = 1; k <= maxCol; k++) {
      const dateStr = (rows[4]?.[k] ?? "").trim()
      if (!dateStr) continue
      for (const p of persons) {
        for (let r = 6; r < rows.length; r++) {
          const row = rows[r]
          if (!/^\d+$/.test((row[0] ?? "").trim())) continue
          const name = (row[k] ?? "").trim()
          if (p.match(name)) { p.stats[label].mecze++; break }
        }
      }
    }
  } else {
    const maxPossibleRound = Math.floor((Math.max(...rows.map(r => r.length)) - 1) / 4)
    for (let k = 1; k <= maxPossibleRound; k++) {
      const baseCol = 1 + (k - 1) * 4
      const dateStr = (rows[1]?.[baseCol] ?? "").trim()
      if (!dateStr || !dateStr.match(/^\d{1,2}\.\d{1,2}/)) continue
      for (let r = 4; r < rows.length; r++) {
        const row = rows[r]
        if (!/^\d+$/.test((row[0] ?? "").trim())) break
        const name = (row[baseCol] ?? "").trim()
        for (const p of persons) {
          if (!p.match(name)) continue
          const g = parseInt(row[baseCol + 1] ?? "") || 0
          const a = parseInt(row[baseCol + 2] ?? "") || 0
          p.stats[label].mecze++
          p.stats[label].gole += g
          p.stats[label].asysty += a
        }
      }
    }
  }
}

for (const p of persons) {
  console.log(`\n${"=".repeat(55)}`)
  console.log(`${p.label}`)
  console.log(`${"=".repeat(55)}`)
  let tm = 0, tg = 0, ta = 0
  for (const [season, s] of Object.entries(p.stats)) {
    console.log(`  ${season}: mecze=${s.mecze}  gole=${s.gole}  asysty=${s.asysty}`)
    tm += s.mecze; tg += s.gole; ta += s.asysty
  }
  console.log(`  ──────────────────────────────`)
  console.log(`  ŁĄCZNIE: mecze=${tm}  gole=${tg}  asysty=${ta}`)
}
