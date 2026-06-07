import type { Metadata, Viewport } from "next"
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
import { NavLinks, PanelDropdown, MobileMenu } from "./nav-links"
import ThemeProvider from "./theme-provider"
import ThemeToggle from "./theme-toggle"
import ChatFab from "./components/chat-fab"
import BottomNav from "./components/bottom-nav"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" })

export const metadata: Metadata = {
  title: "Don Bosco Premier League",
  description: "Amatorska liga piłkarska",
  icons: { icon: "/donlogo.png" },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

const VOTE_WINDOW_MS = 3 * 60 * 60 * 1000

const navLinks = [
  { href: "/",             label: "Tabela" },
  { href: "/mecze",        label: "Mecze" },
  { href: "/gracze",       label: "Gracze" },
  { href: "/statystyki",   label: "Statystyki" },
  { href: "/glosowanie",   label: "Głosowanie" },
  { href: "/ogloszenia",   label: "Ogłoszenia" },
]

const panelLinks = [
  { href: "/panel/losowanie", label: "Losowanie", icon: "🎲" },
  { href: "/panel/sezony",    label: "Sezony",    icon: "🏆" },
  { href: "/panel/gracze",    label: "Gracze",    icon: "👥" },
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
        <ThemeProvider>
        <header className="navbar-bg sticky top-0 z-50 border-b border-black/8 dark:border-white/8 shadow-md shadow-black/5 dark:shadow-black/30 relative overflow-hidden">
          {/* Orange accent line */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-orange-500 to-transparent" />

          <div className="mx-auto max-w-5xl px-4">

            {/* ── Mobile navbar ── */}
            <div className="flex sm:hidden items-center justify-between h-16 relative">
              {/* Logo only (no text on mobile) */}
              <Link href="/" className="shrink-0">
                <Image
                  src="/donlogo.png"
                  alt="Don Bosco Premier League"
                  width={48} height={48}
                  quality={100} priority unoptimized
                  className="logo-img w-11 h-11 object-contain block"
                />
              </Link>

              {/* Centered title */}
              <span className="absolute left-1/2 -translate-x-1/2 font-black italic text-orange-500 text-xl tracking-tight pointer-events-none select-none">
                Don Bosco
              </span>

              {/* Right: theme toggle */}
              <div className="flex items-center gap-1">
                {session && <PushButton />}
                <ThemeToggle />
              </div>
            </div>

            {/* ── Desktop navbar ── */}
            <div className="hidden sm:flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-3 shrink-0">
                <Image
                  src="/donlogo.png"
                  alt="Don Bosco Premier League"
                  width={56} height={56}
                  quality={100} priority unoptimized
                  className="logo-img w-14 h-14 object-contain block"
                />
                <span className="font-extrabold tracking-tight leading-tight">
                  <span className="text-base text-orange-500 italic">Don Bosco</span>
                  <span className="block text-[10px] font-bold tracking-widest uppercase text-zinc-400 dark:text-zinc-500">
                    Premier League
                  </span>
                </span>
              </Link>

              <NavLinks links={navLinks} />

              <div className="flex items-center gap-1">
                {session?.role === "ORGANIZER" && <PanelDropdown links={panelLinks} />}
                {session ? (
                  <>
                    <Link
                      href="/moj-profil"
                      className="hidden md:block rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                    >
                      Mój profil
                    </Link>
                    <PushButton />
                    <form action={logout} className="hidden md:block">
                      <button
                        type="submit"
                        className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                      >
                        Wyloguj
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link
                      href="/rejestracja"
                      className="hidden md:block rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                    >
                      Zarejestruj się
                    </Link>
                    <Link
                      href="/logowanie"
                      className="hidden md:block rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 transition-colors dark:bg-orange-500 dark:hover:bg-orange-600"
                    >
                      Zaloguj się
                    </Link>
                  </>
                )}
                <ThemeToggle />
                <MobileMenu
                  navLinks={navLinks}
                  panelLinks={panelLinks}
                  isLoggedIn={!!session}
                  isOrganizer={session?.role === "ORGANIZER"}
                  logoutAction={logout}
                />
              </div>
            </div>

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

        <main className="mx-auto max-w-5xl px-4 py-4 pb-28 sm:py-8 sm:pb-8">{children}</main>
        <Toaster richColors position="bottom-left" />
        <Suspense><ToastConsumer /></Suspense>
        <ChatFab
          currentUserId={session?.userId ?? null}
          isOrganizer={session?.role === "ORGANIZER"}
        />
        <BottomNav
          isLoggedIn={!!session}
          isOrganizer={session?.role === "ORGANIZER"}
          logoutAction={logout}
        />
        </ThemeProvider>
      </body>
    </html>
  )
}
