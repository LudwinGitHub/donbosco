"use client"

import { useEffect } from "react"

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  const shortMessage =
    error.message && error.message.length < 100 ? error.message : null

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-5xl mb-4">⚠</p>
      <h1 className="text-2xl font-bold text-zinc-800">Coś poszło nie tak</h1>
      {shortMessage && (
        <p className="text-sm text-zinc-500 font-mono bg-zinc-100 rounded px-3 py-1.5 mt-2">
          {shortMessage}
        </p>
      )}
      {!shortMessage && (
        <p className="text-zinc-500 mt-2">
          Wystąpił nieoczekiwany błąd. Spróbuj ponownie.
        </p>
      )}
      <div className="mt-8 flex gap-3">
        <button
          onClick={unstable_retry}
          className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
        >
          Spróbuj ponownie
        </button>
        <a
          href="/"
          className="rounded-lg border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
        >
          Wróć do strony głównej
        </a>
      </div>
    </div>
  )
}
