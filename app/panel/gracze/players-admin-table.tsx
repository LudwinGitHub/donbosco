"use client"
import { useState, useEffect, useActionState } from "react"
import { toast } from "sonner"
import {
  updatePlayer,
  mergePlayers,
  deletePlayer,
  linkPlayerToUser,
  deleteUserAccount,
  type PlayerFormState,
} from "@/app/actions/players"

type PlayerRow = {
  id: string
  firstName: string
  lastName: string
  nickname: string | null
  matchCount: number
  goalCount: number
  linkedUser: { id: string; email: string } | null
}

type UnlinkedUser = {
  id: string
  email: string
  firstName: string
  lastName: string
}

export default function PlayersAdminTable({
  players,
  unlinkedUsers,
}: {
  players: PlayerRow[]
  unlinkedUsers: UnlinkedUser[]
}) {
  const [search, setSearch] = useState("")
  const [activeRow, setActiveRow] = useState<{ id: string; mode: "edit" | "merge" | "link" } | null>(null)

  const filtered = players.filter((p) => {
    const q = search.toLowerCase()
    return (
      p.firstName.toLowerCase().includes(q) ||
      p.lastName.toLowerCase().includes(q) ||
      (p.nickname?.toLowerCase().includes(q) ?? false)
    )
  })

  const activate = (id: string, mode: "edit" | "merge" | "link") =>
    setActiveRow((prev) => (prev?.id === id && prev.mode === mode ? null : { id, mode }))

  return (
    <div className="space-y-4">
      <input
        type="search"
        placeholder="Szukaj po nazwisku, imieniu lub przydomku…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
      />

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              <th className="px-4 py-3 text-left">Gracz</th>
              <th className="px-4 py-3 text-center w-14">M</th>
              <th className="px-4 py-3 text-center w-14">G</th>
              <th className="px-4 py-3 text-left">Konto</th>
              <th className="px-4 py-3 text-right">Akcje</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filtered.map((player) => (
              <PlayerTableRow
                key={player.id}
                player={player}
                allPlayers={players}
                unlinkedUsers={unlinkedUsers}
                activeMode={activeRow?.id === player.id ? activeRow.mode : null}
                onActivate={(mode) => activate(player.id, mode)}
                onClose={() => setActiveRow(null)}
              />
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-400">
                  Brak graczy spełniających kryteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PlayerTableRow({
  player,
  allPlayers,
  unlinkedUsers,
  activeMode,
  onActivate,
  onClose,
}: {
  player: PlayerRow
  allPlayers: PlayerRow[]
  unlinkedUsers: UnlinkedUser[]
  activeMode: "edit" | "merge" | "link" | null
  onActivate: (mode: "edit" | "merge" | "link") => void
  onClose: () => void
}) {
  const [editState,       editAction,       editPending]       = useActionState<PlayerFormState, FormData>(updatePlayer,       undefined)
  const [mergeState,      mergeAction,      mergePending]      = useActionState<PlayerFormState, FormData>(mergePlayers,       undefined)
  const [deleteState,     deleteAction,     deletePending]     = useActionState<PlayerFormState, FormData>(deletePlayer,       undefined)
  const [linkState,       linkAction,       linkPending]       = useActionState<PlayerFormState, FormData>(linkPlayerToUser,   undefined)
  const [delUserState,    delUserAction,    delUserPending]    = useActionState<PlayerFormState, FormData>(deleteUserAccount,  undefined)

  useEffect(() => {
    if (editState?.success)        { toast.success("Gracz zaktualizowany");    onClose() }
    else if (editState?.message)     toast.error(editState.message)
  }, [editState])

  useEffect(() => {
    if (mergeState?.success)       { toast.success("Gracze scaleni");          onClose() }
    else if (mergeState?.message)    toast.error(mergeState.message)
  }, [mergeState])

  useEffect(() => {
    if (deleteState?.success)        toast.success("Gracz usunięty")
    else if (deleteState?.message)   toast.error(deleteState.message)
  }, [deleteState])

  useEffect(() => {
    if (linkState?.success)        { toast.success("Konto powiązane");         onClose() }
    else if (linkState?.message)     toast.error(linkState.message)
  }, [linkState])

  useEffect(() => {
    if (delUserState?.success)       toast.success("Konto użytkownika usunięte")
    else if (delUserState?.message)  toast.error(delUserState.message)
  }, [delUserState])

  const mergeOptions = allPlayers.filter((p) => p.id !== player.id)
  const linkOptions  = player.linkedUser
    ? [{ id: player.linkedUser.id, email: player.linkedUser.email, firstName: "", lastName: "" }, ...unlinkedUsers]
    : unlinkedUsers

  // ── Edit mode ──────────────────────────────────────────────────────────────
  if (activeMode === "edit") {
    return (
      <tr className="bg-zinc-50">
        <td colSpan={5} className="px-4 py-3">
          <form action={editAction} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="id" value={player.id} />
            <Field label="Imię" name="firstName" defaultValue={player.firstName} error={editState?.errors?.firstName?.[0]} />
            <Field label="Nazwisko" name="lastName" defaultValue={player.lastName} error={editState?.errors?.lastName?.[0]} />
            <Field label="Przydomek" name="nickname" defaultValue={player.nickname ?? ""} placeholder="opcjonalny" />
            <FormButtons pending={editPending} onCancel={onClose} submitLabel="Zapisz" />
            {editState?.message && <p className="w-full text-xs text-red-500">{editState.message}</p>}
          </form>
        </td>
      </tr>
    )
  }

  // ── Merge mode ─────────────────────────────────────────────────────────────
  if (activeMode === "merge") {
    return (
      <tr className="bg-amber-50">
        <td colSpan={5} className="px-4 py-3">
          <form action={mergeAction} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="deleteId" value={player.id} />
            <p className="w-full text-sm text-zinc-700">
              Scal <strong>{player.firstName} {player.lastName}</strong>{" "}
              <span className="text-zinc-400">(zostanie usunięty)</span> z:
            </p>
            <div className="space-y-1">
              <label className="block text-xs text-zinc-500">Zachowaj profil</label>
              <select
                name="keepId"
                defaultValue=""
                className="min-w-[240px] rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-zinc-500"
              >
                <option value="" disabled>Wybierz gracza…</option>
                {mergeOptions
                  .sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName))
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.lastName} {p.firstName}
                      {p.nickname ? ` „${p.nickname}"` : ""}
                      {" "}({p.matchCount} M)
                    </option>
                  ))}
              </select>
            </div>
            <FormButtons pending={mergePending} onCancel={onClose} submitLabel="Scal" variant="amber" />
            {mergeState?.message && <p className="w-full text-xs text-red-500">{mergeState.message}</p>}
          </form>
        </td>
      </tr>
    )
  }

  // ── Link mode ──────────────────────────────────────────────────────────────
  if (activeMode === "link") {
    return (
      <tr className="bg-blue-50">
        <td colSpan={5} className="px-4 py-3">
          <form action={linkAction} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="playerId" value={player.id} />
            <p className="w-full text-sm text-zinc-700">
              Powiąż <strong>{player.firstName} {player.lastName}</strong> z kontem:
            </p>
            <div className="space-y-1">
              <label className="block text-xs text-zinc-500">Konto użytkownika</label>
              <select
                name="userId"
                defaultValue={player.linkedUser?.id ?? ""}
                className="min-w-[260px] rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-zinc-500"
              >
                <option value="">— odłącz —</option>
                {linkOptions.map((u) => (
                  <option key={u.id} value={u.id}>{u.email}</option>
                ))}
              </select>
            </div>
            <FormButtons pending={linkPending} onCancel={onClose} submitLabel="Zapisz" variant="blue" />
            {linkState?.message && <p className="w-full text-xs text-red-500">{linkState.message}</p>}
          </form>
        </td>
      </tr>
    )
  }

  // ── Normal row ─────────────────────────────────────────────────────────────
  return (
    <tr className="transition-colors hover:bg-zinc-50">
      <td className="px-4 py-3">
        <span className="font-medium text-zinc-900">{player.firstName} {player.lastName}</span>
        {player.nickname && (
          <span className="ml-1.5 text-xs text-zinc-400">„{player.nickname}"</span>
        )}
      </td>
      <td className="px-4 py-3 text-center text-zinc-600">{player.matchCount}</td>
      <td className="px-4 py-3 text-center text-zinc-600">{player.goalCount}</td>
      <td className="px-4 py-3">
        {player.linkedUser ? (
          <div className="flex items-center gap-1.5">
            <span className="rounded bg-green-50 px-1.5 py-0.5 text-xs text-green-700">
              {player.linkedUser.email}
            </span>
            <form action={delUserAction}>
              <input type="hidden" name="userId" value={player.linkedUser.id} />
              <button
                type="submit"
                disabled={delUserPending}
                title="Usuń konto użytkownika"
                onClick={(e) => {
                  if (!confirm(`Usunąć konto ${player.linkedUser!.email}?\nProfil gracza zostanie zachowany.`)) e.preventDefault()
                }}
                className="rounded px-1 py-0.5 text-xs text-red-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
              >
                {delUserPending ? "…" : "✕"}
              </button>
            </form>
            {delUserState?.message && (
              <p className="text-xs text-red-500">{delUserState.message}</p>
            )}
          </div>
        ) : (
          <span className="text-zinc-300 text-xs">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end items-center gap-1">
          <ActionBtn onClick={() => onActivate("edit")}>Edytuj</ActionBtn>
          <ActionBtn onClick={() => onActivate("merge")} color="amber">Scal</ActionBtn>
          <ActionBtn onClick={() => onActivate("link")} color="blue">
            {player.linkedUser ? "Zmień konto" : "Przypisz konto"}
          </ActionBtn>
          <form action={deleteAction}>
            <input type="hidden" name="id" value={player.id} />
            <button
              type="submit"
              disabled={deletePending}
              onClick={(e) => {
                const warn = player.matchCount > 0
                  ? `Usunąć ${player.firstName} ${player.lastName}?\n\nZostanie usunięta historia: ${player.matchCount} meczów, ${player.goalCount} goli.`
                  : `Usunąć ${player.firstName} ${player.lastName}?`
                if (!confirm(warn)) e.preventDefault()
              }}
              className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50 disabled:opacity-40"
            >
              {deletePending ? "…" : "Usuń"}
            </button>
          </form>
          {deleteState?.message && (
            <p className="text-xs text-red-500">{deleteState.message}</p>
          )}
        </div>
      </td>
    </tr>
  )
}

// ── Shared small components ────────────────────────────────────────────────────

function Field({
  label, name, defaultValue, placeholder, error,
}: {
  label: string; name: string; defaultValue?: string; placeholder?: string; error?: string
}) {
  return (
    <div className="space-y-1">
      <label className="block text-xs text-zinc-500">{label}</label>
      <input
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-500"
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

function FormButtons({
  pending, onCancel, submitLabel, variant = "default",
}: {
  pending: boolean; onCancel: () => void; submitLabel: string; variant?: "default" | "amber" | "blue"
}) {
  const colors = {
    default: "bg-zinc-900 hover:bg-zinc-700",
    amber:   "bg-amber-600 hover:bg-amber-500",
    blue:    "bg-blue-700 hover:bg-blue-600",
  }
  return (
    <div className="flex gap-2 items-end">
      <button
        type="submit"
        disabled={pending}
        className={`rounded-md px-3 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-50 ${colors[variant]}`}
      >
        {pending ? "…" : submitLabel}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="rounded-md border border-zinc-200 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50"
      >
        Anuluj
      </button>
    </div>
  )
}

function ActionBtn({
  children, onClick, color = "zinc",
}: {
  children: React.ReactNode; onClick: () => void; color?: "zinc" | "amber" | "blue"
}) {
  const colors = {
    zinc:  "text-zinc-500 hover:bg-zinc-100",
    amber: "text-amber-600 hover:bg-amber-50",
    blue:  "text-blue-600 hover:bg-blue-50",
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded px-2 py-1 text-xs transition-colors ${colors[color]}`}
    >
      {children}
    </button>
  )
}
