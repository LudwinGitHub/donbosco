import { redirect } from "next/navigation"
import Link from "next/link"
import { verifySession } from "@/lib/dal"
import { prisma } from "@/lib/prisma"
import PaymentsPanel from "./payments-panel"

export default async function MatchPaymentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await verifySession()
  if (session.role !== "ORGANIZER") redirect("/")

  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      homeTeam: { select: { name: true, color: true } },
      awayTeam: { select: { name: true, color: true } },
      payments: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: [{ status: "asc" }, { user: { lastName: "asc" } }],
      },
      matchLineups: {
        include: {
          player: {
            select: { firstName: true, lastName: true, userId: true },
          },
        },
      },
    },
  })

  if (!match) redirect("/panel/mecze")

  const paidCount = match.payments.filter((p) => p.status === "PAID").length
  const totalCount = match.payments.length

  const payments = match.payments.map((p) => ({
    userId: p.user.id,
    firstName: p.user.firstName,
    lastName: p.user.lastName,
    email: p.user.email,
    amount: p.amount.toNumber(),
    status: p.status as "UNPAID" | "PAID" | "EXEMPT",
    paidAt: p.paidAt ? p.paidAt.toISOString() : null,
  }))

  const dateFormatted = match.scheduledAt.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <Link href="/panel/mecze" className="hover:text-zinc-600 transition-colors">
          Mecze
        </Link>
        <span>›</span>
        <Link href={`/mecze/${id}`} className="hover:text-zinc-600 transition-colors">
          {match.homeTeam.name} vs {match.awayTeam.name}
        </Link>
        <span>›</span>
        <span>Płatności</span>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Płatności</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {match.homeTeam.name} vs {match.awayTeam.name} · {dateFormatted}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-right">
          <p className="text-2xl font-bold text-zinc-900">{paidCount}/{totalCount}</p>
          <p className="text-xs text-zinc-400">opłaconych</p>
        </div>
      </div>

      <PaymentsPanel payments={payments} matchId={id} />
    </div>
  )
}
