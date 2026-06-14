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

        {/* ── LEFT: speed lines fan ── */}
        <svg
          aria-hidden="true"
          viewBox="0 0 260 64"
          className="absolute left-0 top-0 h-full w-[260px] text-orange-500/[0.08] dark:text-orange-500/[0.12]"
          fill="none" stroke="currentColor" strokeLinecap="round"
        >
          <line x1="0" y1="8"  x2="190" y2="18" strokeWidth="0.8" />
          <line x1="0" y1="18" x2="235" y2="24" strokeWidth="1" />
          <line x1="0" y1="26" x2="252" y2="30" strokeWidth="1.3" />
          <line x1="0" y1="34" x2="256" y2="36" strokeWidth="1.5" />
          <line x1="0" y1="42" x2="248" y2="44" strokeWidth="1.3" />
          <line x1="0" y1="50" x2="210" y2="51" strokeWidth="1" />
          <line x1="0" y1="58" x2="150" y2="59" strokeWidth="0.8" />
          {/* zigzag flame silhouette at left edge */}
          <path d="M 0 64 L 6 46 L 12 56 L 18 32 L 24 48 L 30 18 L 36 38 L 42 24 L 48 40 L 54 30 L 60 46 L 66 36 L 72 48" strokeWidth="1.6" />
          <path d="M 0 64 L 10 54 L 18 60 L 26 44 L 34 56 L 42 36 L 50 50 L 60 42 L 70 52" strokeWidth="1.1" />
        </svg>

        {/* ── RIGHT: layered fire crown + radiating lines + football ── */}
        <svg
          aria-hidden="true"
          viewBox="0 0 390 96"
          className="absolute right-0 bottom-[-24px] h-[96px] w-[390px] text-orange-500/[0.11] dark:text-orange-500/[0.18]"
          fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"
        >
          {/* ── LAYER 1 — outer flame crown (tallest zigzag) ── */}
          <path
            d="M 0 96 L 14 68 L 26 80 L 40 50 L 54 70 L 68 32 L 82 56 L 96 14 L 110 50 L 122 10 L 136 44 L 148 14 L 162 46 L 174 20 L 188 52 L 200 28 L 212 54 L 224 40 L 236 58 L 248 50"
            strokeWidth="2.2"
          />
          {/* ── LAYER 2 — mid flame zigzag ── */}
          <path
            d="M 0 96 L 10 76 L 18 84 L 30 60 L 42 74 L 56 42 L 70 62 L 84 28 L 98 56 L 112 22 L 126 50 L 140 30 L 154 54 L 166 38 L 180 58 L 194 44 L 208 60 L 224 50 L 238 60 L 248 54"
            strokeWidth="1.6"
          />
          {/* ── LAYER 3 — inner base zigzag ── */}
          <path
            d="M 0 96 L 18 84 L 36 90 L 58 74 L 78 86 L 100 66 L 122 78 L 144 68 L 166 78 L 188 70 L 210 76 L 234 70 L 248 66"
            strokeWidth="1.1"
          />
          {/* ── SPIKE LINES (individual flame tongues) ── */}
          <line x1="68"  y1="80" x2="52"  y2="22" strokeWidth="1.6" />
          <line x1="96"  y1="82" x2="88"  y2="12" strokeWidth="1.8" />
          <line x1="122" y1="80" x2="120" y2="8"  strokeWidth="2" />
          <line x1="148" y1="80" x2="152" y2="12" strokeWidth="2" />
          <line x1="174" y1="80" x2="186" y2="16" strokeWidth="1.8" />
          <line x1="200" y1="82" x2="212" y2="24" strokeWidth="1.6" />
          <line x1="44"  y1="78" x2="30"  y2="36" strokeWidth="1.4" />
          <line x1="224" y1="78" x2="236" y2="36" strokeWidth="1.4" />
          {/* ── RADIATING LINES FROM FOOTBALL ── */}
          <line x1="280" y1="38" x2="232" y2="20" strokeWidth="1.2" />
          <line x1="272" y1="28" x2="218" y2="10" strokeWidth="1" />
          <line x1="260" y1="22" x2="202" y2="6"  strokeWidth="1" />
          <line x1="258" y1="52" x2="200" y2="52" strokeWidth="1.2" />
          <line x1="272" y1="66" x2="228" y2="80" strokeWidth="1" />
          <line x1="282" y1="72" x2="252" y2="86" strokeWidth="1" />
          <line x1="264" y1="40" x2="214" y2="26" strokeWidth="1" />
          <line x1="264" y1="64" x2="218" y2="76" strokeWidth="1" />
          {/* ── FOOTBALL: cx=314 cy=52 r=32 ── */}
          <circle cx="314" cy="52" r="32" strokeWidth="2.5" />
          {/* pentagon inner r=16, top vertex up */}
          <polygon points="314,36 329,47 324,65 304,65 299,47" strokeWidth="1.6" />
          <line x1="314" y1="36" x2="314" y2="20" strokeWidth="1.5" />
          <line x1="329" y1="47" x2="344" y2="42" strokeWidth="1.5" />
          <line x1="324" y1="65" x2="334" y2="78" strokeWidth="1.5" />
          <line x1="304" y1="65" x2="294" y2="78" strokeWidth="1.5" />
          <line x1="299" y1="47" x2="284" y2="42" strokeWidth="1.5" />
        </svg>

        {/* "DB" watermark */}
        <div
          className="absolute -bottom-2 right-0 font-black italic leading-none select-none text-orange-500/[0.05] dark:text-orange-500/[0.08]"
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
