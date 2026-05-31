"use client"
import { useTransition, useState } from "react"
import { toast } from "sonner"
import {
  markPaymentPaid,
  markPaymentUnpaid,
  markPaymentExempt,
  updatePaymentAmount,
} from "@/app/actions/payments"

type PaymentRow = {
  userId: string
  firstName: string
  lastName: string
  email: string
  amount: number
  status: "UNPAID" | "PAID" | "EXEMPT"
  paidAt: string | null
}

export default function PaymentsPanel({
  payments,
  matchId,
}: {
  payments: PaymentRow[]
  matchId: string
}) {
  if (payments.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white px-6 py-10 text-center text-sm text-zinc-400">
        Brak płatności — wyniki meczu nie zostały jeszcze zapisane.
      </div>
    )
  }

  const paidCount = payments.filter((p) => p.status === "PAID").length
  const unpaidTotal = payments
    .filter((p) => p.status === "UNPAID")
    .reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500">
        <span>
          <span className="font-semibold text-green-700">{paidCount}</span> opłaconych
          z {payments.length} łącznie
        </span>
        {unpaidTotal > 0 && (
          <span>
            Do zebrania:{" "}
            <span className="font-semibold text-amber-700">{unpaidTotal} zł</span>
          </span>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              <th className="px-4 py-3 text-left">Gracz</th>
              <th className="px-4 py-3 text-right w-24">Kwota</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Akcje</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {payments.map((payment) => (
              <PaymentTableRow key={payment.userId} payment={payment} matchId={matchId} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PaymentTableRow({ payment, matchId }: { payment: PaymentRow; matchId: string }) {
  const [isPending, startTransition] = useTransition()
  const [editingAmount, setEditingAmount] = useState(false)
  const [amountInput, setAmountInput] = useState(String(payment.amount))

  function handleMarkPaid() {
    startTransition(async () => {
      try {
        await markPaymentPaid(matchId, payment.userId)
        toast.success(`${payment.firstName} ${payment.lastName} — oznaczono jako opłacone`)
      } catch {
        toast.error("Nie udało się zaktualizować płatności")
      }
    })
  }

  function handleMarkUnpaid() {
    startTransition(async () => {
      try {
        await markPaymentUnpaid(matchId, payment.userId)
        toast.success(`${payment.firstName} ${payment.lastName} — cofnięto płatność`)
      } catch {
        toast.error("Nie udało się zaktualizować płatności")
      }
    })
  }

  function handleMarkExempt() {
    startTransition(async () => {
      try {
        await markPaymentExempt(matchId, payment.userId)
        toast.success(`${payment.firstName} ${payment.lastName} — zwolniono z opłaty`)
      } catch {
        toast.error("Nie udało się zaktualizować płatności")
      }
    })
  }

  function handleUpdateAmount() {
    const parsed = parseFloat(amountInput.replace(",", "."))
    if (isNaN(parsed) || parsed < 0) {
      toast.error("Nieprawidłowa kwota")
      return
    }
    startTransition(async () => {
      try {
        await updatePaymentAmount(matchId, payment.userId, parsed)
        toast.success("Kwota zaktualizowana")
        setEditingAmount(false)
      } catch {
        toast.error("Nie udało się zaktualizować kwoty")
      }
    })
  }

  const paidDate = payment.paidAt
    ? new Date(payment.paidAt).toLocaleDateString("pl-PL", {
        day: "numeric",
        month: "short",
      })
    : null

  return (
    <tr className="transition-colors hover:bg-zinc-50">
      {/* Gracz */}
      <td className="px-4 py-3">
        <span className="font-medium text-zinc-900">
          {payment.firstName} {payment.lastName}
        </span>
        <span className="ml-1.5 text-xs text-zinc-400">{payment.email}</span>
      </td>

      {/* Kwota */}
      <td className="px-4 py-3 text-right">
        {editingAmount ? (
          <div className="flex items-center justify-end gap-1">
            <input
              type="number"
              min="0"
              step="1"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleUpdateAmount()
                if (e.key === "Escape") setEditingAmount(false)
              }}
              className="w-20 rounded border border-zinc-300 px-2 py-0.5 text-right text-sm outline-none focus:border-zinc-500"
              autoFocus
              disabled={isPending}
            />
            <button
              onClick={handleUpdateAmount}
              disabled={isPending}
              className="rounded px-1.5 py-0.5 text-xs text-green-700 hover:bg-green-50 disabled:opacity-40"
            >
              {isPending ? "…" : "✓"}
            </button>
            <button
              onClick={() => setEditingAmount(false)}
              disabled={isPending}
              className="rounded px-1.5 py-0.5 text-xs text-zinc-400 hover:bg-zinc-100 disabled:opacity-40"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setAmountInput(String(payment.amount))
              setEditingAmount(true)
            }}
            disabled={isPending}
            className="rounded px-2 py-0.5 text-sm text-zinc-700 hover:bg-zinc-100 disabled:opacity-40"
            title="Kliknij, aby zmienić kwotę"
          >
            {payment.amount} zł
          </button>
        )}
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        {payment.status === "PAID" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
            Opłacone{paidDate ? ` · ${paidDate}` : ""}
          </span>
        )}
        {payment.status === "UNPAID" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
            Do zapłaty
          </span>
        )}
        {payment.status === "EXEMPT" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-500">
            Zwolniony
          </span>
        )}
      </td>

      {/* Akcje */}
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          {payment.status === "UNPAID" && (
            <>
              <button
                onClick={handleMarkPaid}
                disabled={isPending}
                className="rounded px-2 py-1 text-xs text-green-700 hover:bg-green-50 disabled:opacity-40 transition-colors"
              >
                {isPending ? "…" : "✓ Opłacone"}
              </button>
              <button
                onClick={handleMarkExempt}
                disabled={isPending}
                className="rounded px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-50 disabled:opacity-40 transition-colors"
              >
                {isPending ? "…" : "Zwolnij"}
              </button>
            </>
          )}
          {(payment.status === "PAID" || payment.status === "EXEMPT") && (
            <button
              onClick={handleMarkUnpaid}
              disabled={isPending}
              className="rounded px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-50 disabled:opacity-40 transition-colors"
            >
              {isPending ? "…" : "Cofnij"}
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}
