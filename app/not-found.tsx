import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-8xl font-black text-zinc-200">404</p>
      <h1 className="text-2xl font-bold text-zinc-800 mt-4">Strona nie istnieje</h1>
      <p className="text-zinc-500 mt-2">Nie znaleźliśmy tego, czego szukasz.</p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/"
          className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
        >
          Wróć do tabeli →
        </Link>
        <Link
          href="/mecze"
          className="rounded-lg border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
        >
          Mecze →
        </Link>
      </div>
    </div>
  )
}
