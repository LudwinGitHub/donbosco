import type { Metadata, Viewport } from "next"
import { Geist } from "next/font/google"
import { Suspense } from "react"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { getOptionalSession } from "@/lib/dal"
import { logout } from "@/app/actions/auth"
import { prisma } from "@/lib/prisma"
import VoteBanner from "./vote-banner"
import PushButton from "./push-button"
import ToastConsumer from "./toast-consumer"
import { Toaster } from "sonner"
import ThemeProvider from "./theme-provider"
import ChatFab from "./components/chat-fab"
import BottomNav from "./components/bottom-nav"
import NavHeader from "./components/nav-header"
import SwRegister from "./sw-register"
import InstallBanner from "./install-banner"

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
  { href: "/panel/sklad",     label: "Skład",     icon: "📋" },
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
    <html lang="pl" className={geist.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-zinc-50 font-sans text-zinc-900 antialiased" suppressHydrationWarning>
        <ThemeProvider>
        <NavHeader
          isLoggedIn={!!session}
          isOrganizer={session?.role === "ORGANIZER"}
          navLinks={navLinks}
          panelLinks={panelLinks}
          logoutAction={logout}
        />

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

        <main className="mx-auto max-w-5xl px-4 py-4 pb-28 sm:py-8 sm:pb-20">{children}</main>
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
        <InstallBanner />
        <SwRegister />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
