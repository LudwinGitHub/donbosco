"use client"
import { useActionState, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { updateMyPlayerProfile, type PlayerFormState } from "@/app/actions/players"
import { toast } from "sonner"

export default function EditPlayerSection({
  firstName,
  lastName,
  nickname,
}: {
  firstName: string
  lastName: string
  nickname: string | null
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState<PlayerFormState, FormData>(
    updateMyPlayerProfile,
    undefined,
  )

  useEffect(() => {
    if (state?.message) toast.error(state.message)
    if (state?.success) {
      toast.success("Dane zaktualizowane.")
      setOpen(false)
      router.refresh()
    }
  }, [state, router])

  return (
    <div className="rounded-xl border border-zinc-200 border-t-2 border-t-zinc-300 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
      >
        Edytuj dane
        <span className={`text-zinc-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>

      {open && (
        <div className="border-t border-zinc-100 px-5 pb-5 pt-4">
          <form action={action} className="space-y-4">
            <Field
              label="Imię"
              name="firstName"
              defaultValue={firstName}
              errors={state?.errors?.firstName}
            />
            <Field
              label="Nazwisko"
              name="lastName"
              defaultValue={lastName}
              errors={state?.errors?.lastName}
            />
            <Field
              label="Ksywka (opcjonalnie)"
              name="nickname"
              defaultValue={nickname ?? ""}
              errors={state?.errors?.nickname}
            />
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
            >
              {pending ? "Zapisywanie…" : "Zapisz zmiany"}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

function Field({
  label,
  name,
  defaultValue,
  errors,
}: {
  label: string
  name: string
  defaultValue: string
  errors?: string[]
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="block text-sm font-medium text-zinc-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="text"
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
      />
      {errors?.map((e) => (
        <p key={e} className="text-xs text-red-500">
          {e}
        </p>
      ))}
    </div>
  )
}
