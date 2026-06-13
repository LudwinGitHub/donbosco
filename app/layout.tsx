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
import { Analytics } from "@vercel/analytics/next"

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

const VOTE_WINDOW_OPEN_MS  = 3.5 * 60 * 60 * 1000
const VOTE_WINDOW_CLOSE_MS = 0.5 * 60 * 60 * 1000

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
  const now            = new Date()
  const windowOpenEnd  = new Date(now.getTime() + VOTE_WINDOW_OPEN_MS)
  const windowCloseEnd = new Date(now.getTime() + VOTE_WINDOW_CLOSE_MS)

  const [session, activeDraw] = await Promise.all([
    getOptionalSession(),
    prisma.matchDraw.findFirst({
      where: {
        match: {
          status:      "SCHEDULED",
          scheduledAt: { gt: windowCloseEnd, lte: windowOpenEnd },
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
        <header className="navbar-bg sticky top-0 z-50 border-b border-black/8 dark:border-white/8 shadow-md shadow-black/5 dark:shadow-black/30 relative">
          {/* Orange accent line */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-orange-500 to-transparent z-10" />

          {/* ── Mobile hero — full bleed ── */}
          <div className="sm:hidden relative overflow-hidden" style={{ height: "144px" }}>
            {/* Diagonal jersey-stripe pattern */}
            <div className="hero-stripes absolute inset-0 pointer-events-none" />

            {/* Orange radial glow — top right */}
            <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />

            {/* Vertical right accent line */}
            <div className="absolute right-0 top-6 bottom-6 w-px bg-gradient-to-b from-transparent via-orange-500/50 to-transparent pointer-events-none" />

            {/* Ghost "DB" — large decorative background element */}
            <div
              className="absolute -bottom-3 right-4 font-black italic leading-none select-none pointer-events-none text-orange-500/[0.055] dark:text-orange-500/[0.09]"
              style={{ fontSize: "110px" }}
              aria-hidden
            >
              DB
            </div>

            {/* Controls — top right, z-20 above the h-full logo div */}
            <div className="absolute top-3 right-3 z-20 flex items-center gap-1">
              {session && <PushButton />}
              <ThemeToggle />
            </div>

            {/* Bottom gradient wash */}
            <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-orange-500/[0.04] to-transparent pointer-events-none" />

            {/* Logo + text */}
            <div className="relative z-10 flex items-center h-full px-5">
              <Link href="/" className="shrink-0 mr-4">
                <Image
                  src="/donlogo.png"
                  alt="Don Bosco Premier League"
                  width={64} height={64}
                  quality={100} priority unoptimized
                  className="logo-img w-16 h-16 object-contain block"
                />
              </Link>
              <div>
                <p
                  className="font-black italic text-orange-500 leading-none tracking-tight"
                  style={{ fontSize: "2.1rem" }}
                >
                  Don Bosco
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="block h-px w-6 bg-orange-500/40" />
                  <p className="text-[9px] font-bold tracking-[0.32em] uppercase text-zinc-400 dark:text-zinc-500">
                    Premier League
                  </p>
                  <span className="block h-px w-6 bg-orange-500/40" />
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-5xl px-4">
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
            windowOpenAtISO={new Date(activeDraw.match.scheduledAt.getTime() - VOTE_WINDOW_OPEN_MS).toISOString()}
            windowCloseAtISO={new Date(activeDraw.match.scheduledAt.getTime() - VOTE_WINDOW_CLOSE_MS).toISOString()}
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
        <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
