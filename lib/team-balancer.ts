export type PlayerForBalance = {
  id: string
  firstName: string
  lastName: string
  nickname: string | null
  played: number
  goals: number
  assists: number
  form?: "up" | "down" | "stable"
}

export type BalancedTeams = {
  teamA: PlayerForBalance[]
  teamB: PlayerForBalance[]
  ratingA: number
  ratingB: number
}

export function playerRating(p: PlayerForBalance): number {
  if (p.played === 0) return 0
  return (p.goals * 2 + p.assists) / p.played
}

export function generateBalancedTeams(players: PlayerForBalance[]): BalancedTeams {
  const n = players.length
  if (n < 2) throw new Error("Za mało graczy.")

  const FORM_BONUS: Record<string, number> = { up: 0.25, down: -0.25, stable: 0 }

  // Add form modifier + jitter so each call yields different (but balanced) teams
  const rated = players.map((p) => ({
    player: p,
    rating: playerRating(p)
      + (FORM_BONUS[p.form ?? "stable"] ?? 0)
      + (Math.random() - 0.5) * 0.5,
  }))
  rated.sort((a, b) => b.rating - a.rating)

  const halfA = Math.ceil(n / 2)
  const [groupA, groupB] = n <= 20
    ? optimalSplit(rated, halfA)
    : snakeDraft(rated, halfA)

  return {
    teamA:   groupA.map((r) => r.player),
    teamB:   groupB.map((r) => r.player),
    ratingA: groupA.reduce((s, r) => s + playerRating(r.player), 0),
    ratingB: groupB.reduce((s, r) => s + playerRating(r.player), 0),
  }
}

// ─── Optimal split (backtracking, feasible for n ≤ 20) ───────────────────────
// Finds the subset of `sizeA` items minimising |sumA − sumB|.
// Jitter on ratings guarantees different optima on each call.

function optimalSplit<T extends { rating: number }>(
  items: T[],
  sizeA: number
): [T[], T[]] {
  const n = items.length
  const total = items.reduce((s, p) => s + p.rating, 0)
  let bestDiff = Infinity
  let bestMask = 0

  function search(idx: number, count: number, sum: number, mask: number) {
    if (count === sizeA) {
      const diff = Math.abs(2 * sum - total)
      if (diff < bestDiff) { bestDiff = diff; bestMask = mask }
      return
    }
    if (idx === n) return
    if (n - idx < sizeA - count) return // prune: not enough items left

    search(idx + 1, count + 1, sum + items[idx].rating, mask | (1 << idx))
    search(idx + 1, count, sum, mask)
  }

  search(0, 0, 0, 0)

  return [
    items.filter((_, i) =>  (bestMask >> i) & 1),
    items.filter((_, i) => !((bestMask >> i) & 1)),
  ]
}

// ─── Snake draft fallback for n > 20 ─────────────────────────────────────────
// Pick order: A B B A A B B A …  (minimises imbalance for sorted list)

function snakeDraft<T>(items: T[], sizeA: number): [T[], T[]] {
  const A: T[] = [], B: T[] = []
  for (let i = 0; i < items.length; i++) {
    const group = Math.floor(i / 2) % 2 === 0
    const slot  = i % 2 === 0
    ;(group === slot ? A : B).push(items[i])
  }
  // Trim to correct sizes if odd total
  while (A.length > sizeA) B.push(A.pop()!)
  return [A, B]
}
