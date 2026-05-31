"use client"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useState, useRef, useEffect } from "react"

type NavItem = { href: string; label: string }

export function NavLinks({ links }: { links: NavItem[] }) {
  const pathname = usePathname()
  return (
    <nav className="hidden md:flex items-center gap-0.5">
      {links.map((l) => {
        const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href)
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "bg-zinc-900 text-white"
                : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
            }`}
          >
            {l.label}
          </Link>
        )
      })}
    </nav>
  )
}

type PanelLink = { href: string; label: string; icon: string }

export function PanelDropdown({ links }: { links: PanelLink[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const isActive = links.some((l) => pathname.startsWith(l.href))

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative hidden md:block">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
          isActive || open
            ? "bg-amber-100 text-amber-800"
            : "text-amber-700 hover:bg-amber-50"
        }`}
      >
        Panel
        <svg
          className={`h-3.5 w-3.5 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-44 rounded-xl border border-zinc-200 bg-white py-1 shadow-lg shadow-zinc-200/60 z-50">
          {links.map((l) => {
            const active = pathname.startsWith(l.href)
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-amber-50 text-amber-800 font-medium"
                    : "text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                <span className="text-base leading-none">{l.icon}</span>
                {l.label}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

type MobileMenuProps = {
  navLinks: NavItem[]
  panelLinks: PanelLink[]
  isLoggedIn: boolean
  isOrganizer: boolean
  logoutAction: () => Promise<void>
}

export function MobileMenu({
  navLinks,
  panelLinks,
  isLoggedIn,
  isOrganizer,
  logoutAction,
}: MobileMenuProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="md:hidden flex items-center justify-center h-8 w-8 rounded-lg text-zinc-600 hover:bg-zinc-100 transition-colors"
        aria-label={open ? "Zamknij menu" : "Otwórz menu"}
      >
        {open ? (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {open && (
        <div className="md:hidden absolute left-0 right-0 top-full border-b border-zinc-200 bg-white shadow-lg shadow-zinc-200/40 z-40">
          <nav className="mx-auto max-w-5xl px-4 py-3 space-y-0.5">
            {navLinks.map((l) => {
              const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href)
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  {l.label}
                </Link>
              )
            })}

            {isLoggedIn && (
              <>
                <div className="my-2 border-t border-zinc-100" />
                <Link
                  href="/moj-profil"
                  className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    pathname === "/moj-profil"
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  Mój profil
                </Link>
              </>
            )}

            {isOrganizer && (
              <>
                <div className="my-2 border-t border-zinc-100" />
                <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Panel organizatora
                </p>
                {panelLinks.map((l) => {
                  const active = pathname.startsWith(l.href)
                  return (
                    <Link
                      key={l.href}
                      href={l.href}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        active
                          ? "bg-amber-100 text-amber-800"
                          : "text-amber-700 hover:bg-amber-50"
                      }`}
                    >
                      <span>{l.icon}</span>
                      {l.label}
                    </Link>
                  )
                })}
              </>
            )}

            {isLoggedIn ? (
              <>
                <div className="my-2 border-t border-zinc-100" />
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="w-full flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-500 hover:bg-zinc-100 transition-colors text-left"
                  >
                    Wyloguj się
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className="my-2 border-t border-zinc-100" />
                <Link
                  href="/rejestracja"
                  className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
                >
                  Zarejestruj się
                </Link>
                <Link
                  href="/logowanie"
                  className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-100 transition-colors"
                >
                  Zaloguj się
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </>
  )
}
