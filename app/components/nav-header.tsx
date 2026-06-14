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
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <Image
              src="/donlogo.png" alt="Don Bosco Premier League"
              width={56} height={56} quality={100} priority unoptimized
              className="logo-img w-14 h-14 object-contain block"
            />
            <span className="font-extrabold tracking-tight leading-tight">
              <span className="text-base text-orange-500 italic">Don Bosco</span>
              <span className="block text-[10px] font-bold tracking-widest uppercase text-zinc-400 dark:text-zinc-500">Premier League</span>
            </span>
          </Link>

          <SlidingNavLinks links={navLinks} />

          <div className="flex items-center gap-1">
            {isOrganizer && <PanelDropdown links={panelLinks} />}
            {isLoggedIn ? (
              <>
                <Link
                  href="/moj-profil"
                  className="hidden md:block rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-white/8 transition-colors"
                >
                  Mój profil
                </Link>
                <PushButton />
                <form action={logoutAction} className="hidden md:block">
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
                  className="hidden md:block rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-white/8 transition-colors"
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
              isLoggedIn={isLoggedIn}
              isOrganizer={isOrganizer}
              logoutAction={logoutAction}
            />
          </div>
        </div>
      </div>
    </header>
  )
}
