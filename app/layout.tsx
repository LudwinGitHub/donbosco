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
          {/* Orange accent line bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-90" />
          <div className="mx-auto max-w-5xl px-4">
            <div className="flex items-center justify-between h-16">

              {/* Logo */}
              <Link href="/" className="flex items-center gap-3 shrink-0">
                <div className="dark:bg-white/92 dark:rounded-xl dark:p-0.5 shrink-0">
                  <Image
                    src="/donlogo.png"
                    alt="Don Bosco Premier League"
                    width={56} height={56}
                    quality={100} priority unoptimized
                    className="logo-img w-12 h-12 sm:w-14 sm:h-14 object-contain block"
                  />
                </div>
                <span className="font-extrabold tracking-tight leading-tight">
                  <span className="text-sm sm:text-base text-orange-600 italic">Don Bosco</span>
                  <span className="hidden sm:block text-[10px] font-bold tracking-widest uppercase text-zinc-400 dark:text-zinc-500">
                    Premier League
                  </span>
                </span>
              </Link>

              {/* Desktop nav */}
              <NavLinks links={navLinks} />

              {/* Right side: panel dropdown + auth + mobile hamburger */}
              <div className="flex items-center gap-1">
                {session?.role === "ORGANIZER" && (
                  <PanelDropdown links={panelLinks} />
                )}

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
                      className="hidden md:block rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
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

        <main className="mx-auto max-w-5xl px-4 py-4 sm:py-8">{children}</main>
        <Toaster richColors position="bottom-left" />
        <Suspense><ToastConsumer /></Suspense>
        <ChatFab
          currentUserId={session?.userId ?? null}
          isOrganizer={session?.role === "ORGANIZER"}
        />
        </ThemeProvider>
      </body>
    </html>
  )
}
