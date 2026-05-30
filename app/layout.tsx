import type { Metadata } from "next"
import { Geist } from "next/font/google"
import Link from "next/link"
import Image from "next/image"
import { Suspense } from "react"
import "./globals.css"
import { getOptionalSession } from "@/lib/dal"
import { logout } from "@/app/actions/auth"
import { prisma } from "@/lib/prisma"
import VoteBanner from "./vote-banner"
import PushButton from "./push-button"
import ToastConsumer from "./toast-consumer"
import { Toaster } from "sonner"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" })

export const metadata: Metadata = {
  title: "Don Bosco Premier League",
  description: "Amatorska liga piłkarska",
  icons: { icon: "/logo-cropped.png" },
}

const VOTE_WINDOW_MS = 3 * 60 * 60 * 1000

const navLinks = [
  { href: "/",            label: "Tabela" },
  { href: "/mecze",       label: "Mecze" },
  { href: "/gracze",      label: "Gracze" },
  { href: "/statystyki",  label: "Statystyki" },
  { href: "/glosowanie",  label: "Głosowanie" },
]

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const now       = new Date()
  const windowEnd = new Date(now.getTime() + VOTE_WINDOW_MS)

  const [session, activeDraw] = await Promise.all([
    getOptionalSession(),
    prisma.matchDraw.findFirst({
      where: {
        match: {
          status:      "SCHEDULED",
          scheduledAt: { gt: now, lte: windowEnd },
        },
      },
      select: {
        matchId: true,
        match: {
          select: {
            scheduledAt: true,
            homeTeam: { select: { name: true } },
            awayTeam: { select: { name: true } },
          },
        },
        _count: { select: { votes: true } },
      },
    }),
  ])

  return (
    <html lang="pl" className={geist.variable}>
      <body className="min-h-screen bg-zinc-50 font-sans text-zinc-900 antialiased">
        <header className="border-b border-zinc-200 bg-white">
          <div className="mx-auto max-w-5xl px-4">

            {/* Main row: logo + desktop-nav + auth */}
            <div className="flex items-center justify-between py-1.5">

              {/* Logo */}
              <Link href="/" className="flex items-center gap-2 sm:gap-3">
                <Image
                  src="/logo-cropped.png"
                  alt="Don Bosco Premier League"
                  width={83} height={83}
                  quality={100} priority unoptimized
                  className="w-[52px] h-[52px] sm:w-[83px] sm:h-[83px]"
                />
                <span className="font-extrabold tracking-tight leading-tight">
                  <span className="text-base sm:text-xl">Don Bosco</span>
                  <span className="hidden sm:block text-xs font-semibold tracking-widest uppercase text-zinc-500 mt-0.5">
                    Premier League
                  </span>
                </span>
              </Link>

              {/* Desktop nav */}
              <nav className="hidden sm:flex gap-1">
                {navLinks.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="rounded-md px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>

              {/* Auth */}
              <div className="flex items-center gap-1 sm:gap-2 sm:ml-3 sm:pl-3 sm:border-l sm:border-zinc-200">
                {session ? (
                  <>
                    {session.role === "ORGANIZER" && (
                      <>
                        <Link href="/panel/losowanie" className="hidden sm:block rounded-md px-3 py-1.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-50">
                          Losowanie
                        </Link>
                        <Link href="/panel/gracze" className="hidden sm:block rounded-md px-3 py-1.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-50">
                          Panel
                        </Link>
                      </>
                    )}
                    <Link href="/moj-profil" className="rounded-md px-2 sm:px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900">
                      <span className="sm:hidden">Profil</span>
                      <span className="hidden sm:inline">Mój profil</span>
                    </Link>
                    <PushButton />
                    <form action={logout}>
                      <button type="submit" className="rounded-md px-2 sm:px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900">
                        Wyloguj
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link href="/rejestracja" className="hidden sm:block rounded-md px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900">
                      Zarejestruj się
                    </Link>
                    <Link href="/logowanie" className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700">
                      Zaloguj się
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Mobile nav row */}
            <nav className="sm:hidden flex border-t border-zinc-100 py-1 gap-0.5 overflow-x-auto">
              {navLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="shrink-0 rounded-md px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                >
                  {l.label}
                </Link>
              ))}
              {session?.role === "ORGANIZER" && (
                <>
                  <Link href="/panel/losowanie" className="shrink-0 rounded-md px-3 py-1.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-50">
                    Losowanie
                  </Link>
                  <Link href="/panel/gracze" className="shrink-0 rounded-md px-3 py-1.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-50">
                    Panel
                  </Link>
                </>
              )}
            </nav>

          </div>
        </header>

        {activeDraw && activeDraw._count.votes < 14 && (
          <VoteBanner
            scheduledAtISO={activeDraw.match.scheduledAt.toISOString()}
            windowOpenAtISO={new Date(activeDraw.match.scheduledAt.getTime() - VOTE_WINDOW_MS).toISOString()}
            matchName={`${activeDraw.match.homeTeam.name} vs ${activeDraw.match.awayTeam.name}`}
            totalVotes={activeDraw._count.votes}
            maxVotes={14}
          />
        )}

        <main className="mx-auto max-w-5xl px-4 py-4 sm:py-8">{children}</main>
        <Toaster richColors position="bottom-right" />
        <Suspense><ToastConsumer /></Suspense>
      </body>
    </html>
  )
}
