"use client"
import Link from "next/link"
import { useActionState } from "react"
import { signup, type AuthFormState } from "@/app/actions/auth"

export default function SignupPage() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(signup, undefined)

  return (
    <div className="mx-auto max-w-sm space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Rejestracja</h1>
        <p className="mt-1 text-sm text-zinc-500">Utwórz konto w Don Bosco Premier League</p>
      </div>

      <form action={action} className="space-y-4">
        {state?.message && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-100">
            {state.message}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Imię" name="firstName" type="text" autoComplete="given-name" errors={state?.errors?.firstName} />
          <Field label="Nazwisko" name="lastName" type="text" autoComplete="family-name" errors={state?.errors?.lastName} />
        </div>
        <Field label="Email" name="email" type="email" autoComplete="email" errors={state?.errors?.email} />
        <Field label="Hasło" name="password" type="password" autoComplete="new-password" errors={state?.errors?.password} />

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
        >
          {pending ? "Tworzenie konta…" : "Zarejestruj się"}
        </button>
      </form>

      <p className="text-center text-sm text-zinc-500">
        Masz już konto?{" "}
        <Link href="/logowanie" className="font-medium text-zinc-900 hover:underline">
          Zaloguj się
        </Link>
      </p>
    </div>
  )
}

function Field({
  label,
  name,
  type,
  autoComplete,
  errors,
}: {
  label: string
  name: string
  type: string
  autoComplete?: string
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
        type={type}
        autoComplete={autoComplete}
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
