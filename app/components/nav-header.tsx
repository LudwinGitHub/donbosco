"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { PanelDropdown, MobileMenu } from "@/app/nav-links"
import ThemeToggle from "@/app/theme-toggle"
import PushButton from "@/app/push-button"

type NavItem   = { href: string; label: string }
type PanelLink = { href: string; label: string; icon: string }

type Props = {
  isLoggedIn:    boolean
  isOrganizer:   boolean
  navLinks:      NavItem[]
  panelLinks:    PanelLink[]
  logoutAction:  () => Promise<void>
}

// ── Sliding pill nav (desktop) ────────────────────────────────────────────────
function SlidingNavLinks({ links }: { links: NavItem[] }) {
  const pathname    = usePathname()
  const containerRef = useRef<HTMLDivElement>(null)
  const linkRefs    = useRef<Map<string, HTMLAnchorElement>>(new Map())
  const [pill, setPill] = useState({ left: 0, width: 0, ready: false })

  const updatePill = useCallback(() => {
    const active = links.find((l) =>
      l.href === "/" ? pathname === "/" : pathname.startsWith(l.href)
    )
    if (!active) { setPill((p) => ({ ...p, ready: false })); return }
    const el        = linkRefs.current.get(active.href)
    const container = containerRef.current
    if (el && container) {
      const er = el.getBoundingClientRect()
      const cr = container.getBoundingClientRect()
      setPill({ left: er.left - cr.left, width: er.width, ready: true })
    }
  }, [pathname, links])

  useEffect(() => { updatePill() }, [updatePill])
  useEffect(() => {
    window.addEventListener("resize", updatePill)
    return () => window.removeEventListener("resize", updatePill)
  }, [updatePill])

  return (
    <nav ref={containerRef} className="relative hidden md:flex items-center gap-0.5">
      {/* Orange sliding pill */}
      <div
        className="absolute inset-y-1 bg-orange-500 rounded-lg pointer-events-none"
        style={{
          left:    pill.left,
          width:   pill.width,
          opacity: pill.ready ? 1 : 0,
          transition: "left 0.25s cubic-bezier(0.4,0,0.2,1), width 0.25s cubic-bezier(0.4,0,0.2,1), opacity 0.15s",
        }}
      />
      {links.map((l) => {
        const isActive = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href)
        return (
          <Link
            key={l.href}
            href={l.href}
            ref={(el) => { if (el) linkRefs.current.set(l.href, el) }}
            className={`relative z-10 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
              isActive
                ? "text-white"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            {l.label}
          </Link>
        )
      })}
    </nav>
  )
}

// ── Main header ───────────────────────────────────────────────────────────────
export default function NavHeader({ isLoggedIn, isOrganizer, navLinks, panelLinks, logoutAction }: Props) {
  const [scrolled, setScrolled] = useState(false)
  const prevY = useRef(0)

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY
      setScrolled(y > 44)
      prevY.current = y
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header className="sticky top-0 z-50 relative">
      {/* ── Background layer (glass on scroll, gradient at top) ── */}
      <div
        className={`absolute inset-0 transition-all duration-300 ${
          scrolled
            ? "bg-white/80 dark:bg-[#08090c]/85 backdrop-blur-xl shadow-sm shadow-black/8"
            : "navbar-bg shadow-md shadow-black/5 dark:shadow-black/30"
        }`}
      />

      {/* Orange accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-orange-500 to-transparent z-10" />
      {/* Border */}
      <div className="absolute inset-0 border-b border-black/8 dark:border-white/8 pointer-events-none" />

      {/* ── Desktop full-bleed decorative layer (fades on scroll) ── */}
      <div
        className="hidden sm:block absolute inset-0 overflow-hidden pointer-events-none z-[2]"
        style={{ opacity: scrolled ? 0 : 1, transition: "opacity 0.3s ease" }}
      >
        {/* Texture + gradients */}
        <div className="hero-stripes absolute inset-0" />
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-orange-500/[0.04] to-transparent" />

        {/* Glow blobs — both edges */}
        <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute -top-8 -left-8  w-40 h-40 rounded-full bg-orange-500/[0.06] blur-3xl" />

        {/* Edge accent lines */}
        <div className="absolute left-0  top-4 bottom-4 w-px bg-gradient-to-b from-transparent via-orange-500/30 to-transparent" />
        <div className="absolute right-0 top-4 bottom-4 w-px bg-gradient-to-b from-transparent via-orange-500/50 to-transparent" />

        {/* ── LEFT: fan of speed lines + flame cluster ── */}
        <svg
          aria-hidden="true"
          viewBox="0 0 260 64"
          className="absolute left-0 top-0 h-full w-[260px] text-orange-500/[0.09] dark:text-orange-500/[0.14]"
          fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"
        >
          {/* Fan of speed lines from left edge */}
          <line x1="0" y1="10" x2="200" y2="20" strokeWidth="1" />
          <line x1="0" y1="18" x2="240" y2="25" strokeWidth="1.2" />
          <line x1="0" y1="26" x2="255" y2="30" strokeWidth="1.5" />
          <line x1="0" y1="34" x2="255" y2="38" strokeWidth="1.5" />
          <line x1="0" y1="42" x2="240" y2="44" strokeWidth="1.2" />
          <line x1="0" y1="50" x2="190" y2="52" strokeWidth="1" />
          <line x1="0" y1="58" x2="120" y2="60" strokeWidth="0.8" />
          {/* Flame cluster at far left */}
          <path d="M 6 64 C 2 52 0 42 4 30 C 6 22 13 26 11 14 C 15 26 22 20 19 32 C 22 22 30 24 27 36 C 30 26 36 30 33 42 C 38 30 44 34 40 48 C 36 62 28 66 6 64" strokeWidth="1.2" />
          <path d="M 18 64 C 16 54 20 46 16 36" strokeWidth="1" />
          <path d="M 30 62 C 28 50 34 42 30 34" strokeWidth="1" />
        </svg>

        {/* ── RIGHT: flame storm + football ── */}
        <svg
          aria-hidden="true"
          viewBox="0 0 320 90"
          className="absolute right-0 bottom-[-22px] h-[90px] w-[320px] text-orange-500/[0.11] dark:text-orange-500/[0.18]"
          fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"
        >
          {/* Speed lines entering from left */}
          <line x1="0"  y1="32" x2="55"  y2="35" strokeWidth="1" />
          <line x1="0"  y1="40" x2="65"  y2="44" strokeWidth="1.2" />
          <line x1="0"  y1="48" x2="50"  y2="53" strokeWidth="1" />
          {/* Tall main flames (left of ball) */}
          <path d="M 90  88 C 85 70 74 58 81 40 C 85 27 96 32 93 14" strokeWidth="1.8" />
          <path d="M 107 88 C 104 72 109 60 104 44 C 100 32 91 35 93 16" strokeWidth="1.8" />
          {/* Medium secondary flames */}
          <path d="M 75  84 C 70 68 62 56 70 44 C 73 36 81 40 79 28" strokeWidth="1.4" />
          <path d="M 122 84 C 127 68 132 58 126 46" strokeWidth="1.4" />
          <path d="M 136 80 C 140 66 145 56 139 46" strokeWidth="1.4" />
          {/* Small wispy flames */}
          <path d="M 62  78 C 58 66 54 56 60 46" strokeWidth="1" />
          <path d="M 150 76 C 154 64 158 56 153 48" strokeWidth="1" />
          <path d="M 160 72 C 164 62 167 54 162 46" strokeWidth="1" />
          {/* Football: cx=228 cy=56 r=32 */}
          {/* Outer circle */}
          <circle cx="228" cy="56" r="32" strokeWidth="2.5" />
          {/* Curved panel lines — 3 arcs suggesting ball surface */}
          <path d="M 210 30 C 220 38 226 50 222 64" strokeWidth="1.4" />
          <path d="M 228 24 C 236 34 240 48 234 64" strokeWidth="1.4" />
          <path d="M 244 28 C 250 38 252 52 246 66" strokeWidth="1.4" />
          {/* Horizontal band */}
          <path d="M 197 50 C 210 46 226 46 246 50 C 252 52 255 56 250 60" strokeWidth="1.2" />
          {/* Top seam dot */}
          <circle cx="228" cy="26" r="2.5" fill="currentColor" strokeWidth="0" />
        </svg>

        {/* "DB" watermark */}
        <div
          className="absolute -bottom-2 right-0 font-black italic leading-none select-none text-orange-500/[0.055] dark:text-orange-500/[0.09]"
          style={{ fontSize: "84px" }}
          aria-hidden
        >
          DB
        </div>
      </div>

      {/* ── Mobile hero — collapses on scroll ── */}
      <div
        className="sm:hidden relative overflow-hidden"
        style={{
          height:     scrolled ? 0 : 144,
          opacity:    scrolled ? 0 : 1,
          transition: "height 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease",
        }}
      >
        <div className="hero-stripes absolute inset-0 pointer-events-none" />
        <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />
        <div className="absolute right-0 top-6 bottom-6 w-px bg-gradient-to-b from-transparent via-orange-500/50 to-transparent pointer-events-none" />
        <div
          className="absolute -bottom-3 right-4 font-black italic leading-none select-none pointer-events-none text-orange-500/[0.055] dark:text-orange-500/[0.09]"
          style={{ fontSize: "110px" }}
          aria-hidden
        >
          DB
        </div>
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1">
          {isLoggedIn && <PushButton />}
          <ThemeToggle />
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-orange-500/[0.04] to-transparent pointer-events-none" />
        <div className="relative z-10 flex items-center h-full px-5">
          <Link href="/" className="shrink-0 mr-4">
            <Image
              src="/donlogo.png" alt="Don Bosco Premier League"
              width={64} height={64} quality={100} priority unoptimized
              className="logo-img w-16 h-16 object-contain block"
            />
          </Link>
          <div>
            <p className="font-black italic text-orange-500 leading-none tracking-tight" style={{ fontSize: "2.1rem" }}>
              Don Bosco
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="block h-px w-6 bg-orange-500/40" />
              <p className="text-[9px] font-bold tracking-[0.32em] uppercase text-zinc-400 dark:text-zinc-500">Premier League</p>
              <span className="block h-px w-6 bg-orange-500/40" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile compact bar (appears when scrolled) ── */}
      <div
        className="sm:hidden relative z-10 flex items-center justify-between px-4 overflow-hidden"
        style={{
          height:     scrolled ? 56 : 0,
          opacity:    scrolled ? 1 : 0,
          transition: "height 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease",
          pointerEvents: scrolled ? "auto" : "none",
        }}
      >
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <Image
            src="/donlogo.png" alt="Don Bosco Premier League"
            width={36} height={36} quality={100} unoptimized
            className="logo-img w-9 h-9 object-contain block"
          />
          <span className="font-black italic text-orange-500 text-lg leading-none">Don Bosco</span>
        </Link>
        <div className="flex items-center gap-1">
          {isLoggedIn && <PushButton />}
          <ThemeToggle />
          <MobileMenu
            navLinks={navLinks}
            panelLinks={panelLinks}
            isLoggedIn={isLoggedIn}
            isOrganizer={isOrganizer}
            logoutAction={logoutAction}
          />
        </div>
      </div>

      {/* ── Desktop navbar ── */}
      <div className="hidden sm:block relative z-10 mx-auto max-w-5xl px-4">
        <div className="flex items-center h-16">

          {/* Left — text branding */}
          <Link href="/" className="shrink-0">
            <p className="font-black italic text-orange-500 leading-none tracking-tight" style={{ fontSize: "1.65rem" }}>
              Don Bosco
            </p>
            <div className="flex items-center gap-2 mt-[5px]">
              <span className="block h-px w-5 bg-orange-500/40" />
              <p className="text-[7px] font-bold tracking-[0.30em] uppercase text-zinc-400 dark:text-zinc-500">Premier League</p>
              <span className="block h-px w-5 bg-orange-500/40" />
            </div>
          </Link>

          {/* Center — nav links (flex-1 → no overlap with controls) */}
          <div className="flex-1 flex justify-center">
            <SlidingNavLinks links={navLinks} />
          </div>

          {/* Right — controls (shrink-0 so they never squeeze nav) */}
          <div className="flex items-center gap-1 shrink-0">
            {isOrganizer && <PanelDropdown links={panelLinks} />}
            {isLoggedIn ? (
              <>
                <Link
                  href="/moj-profil"
                  className="hidden lg:block rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-white/8 transition-colors"
                >
                  Mój profil
                </Link>
                <PushButton />
                <form action={logoutAction} className="hidden lg:block">
                  <button
                    type="submit"
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-white/8 transition-colors"
                  >
                    Wyloguj
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/rejestracja"
                  className="hidden lg:block rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-white/8 transition-colors"
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
            {/* hamburger only at sm–md (nav links hidden at those sizes) */}
            <div className="md:hidden">
              <MobileMenu
                navLinks={navLinks}
                panelLinks={panelLinks}
                isLoggedIn={isLoggedIn}
                isOrganizer={isOrganizer}
                logoutAction={logoutAction}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
