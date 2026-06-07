"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

type Props = {
  isLoggedIn: boolean
  isOrganizer: boolean
  logoutAction: () => Promise<void>
}

function active(pathname: string, href: string) {
  if (href === "/") return pathname === "/"
  return pathname.startsWith(href)
}

export default function BottomNav({ isLoggedIn, isOrganizer, logoutAction }: Props) {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  return (
    <>
      {/* ── Overlay "Więcej" ── */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm sm:hidden"
          onClick={() => setMoreOpen(false)}
        >
          <div
            className="fixed left-4 right-4 rounded-2xl bg-white dark:bg-[#11141a] border border-zinc-200 dark:border-white/8 shadow-2xl p-3 space-y-0.5"
            style={{ bottom: "calc(5rem + env(safe-area-inset-bottom, 0px))" }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Nawigacja</p>
            <MoreLink href="/glosowanie"  label="Głosowanie"  emoji="🗳️" isActive={active(pathname, "/glosowanie")}  onClose={() => setMoreOpen(false)} />
            <MoreLink href="/ogloszenia"  label="Ogłoszenia"  emoji="📢" isActive={active(pathname, "/ogloszenia")}  onClose={() => setMoreOpen(false)} />
            {isOrganizer && (
              <>
                <div className="h-px bg-zinc-100 dark:bg-white/6 mx-2 my-1" />
                <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Panel</p>
                <MoreLink href="/panel/losowanie" label="Losowanie"      emoji="🎲" isActive={active(pathname, "/panel/losowanie")} onClose={() => setMoreOpen(false)} />
                <MoreLink href="/panel/sezony"    label="Sezony"         emoji="🏆" isActive={active(pathname, "/panel/sezony")}    onClose={() => setMoreOpen(false)} />
                <MoreLink href="/panel/gracze"    label="Gracze (panel)" emoji="👥" isActive={active(pathname, "/panel/gracze")}    onClose={() => setMoreOpen(false)} />
              </>
            )}
            <div className="h-px bg-zinc-100 dark:bg-white/6 mx-2 my-1" />
            {isLoggedIn ? (
              <>
                <MoreLink href="/moj-profil" label="Mój profil" emoji="👤" isActive={active(pathname, "/moj-profil")} onClose={() => setMoreOpen(false)} />
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left"
                  >
                    <span className="text-base leading-none">🚪</span>
                    Wyloguj
                  </button>
                </form>
              </>
            ) : (
              <>
                <MoreLink href="/logowanie"   label="Zaloguj się"      emoji="🔑" isActive={false} onClose={() => setMoreOpen(false)} />
                <MoreLink href="/rejestracja" label="Zarejestruj się"  emoji="✍️" isActive={false} onClose={() => setMoreOpen(false)} />
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Floating pill ── */}
      <div
        className="fixed left-4 right-4 z-50 sm:hidden"
        style={{ bottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <nav className="flex items-center justify-around rounded-2xl bg-white/92 dark:bg-[#11141a]/92 backdrop-blur-xl border border-zinc-200/70 dark:border-white/8 shadow-xl shadow-black/10 dark:shadow-black/50 px-1 py-1.5">
          <NavItem href="/"            label="Tabela"  isActive={active(pathname, "/")}            icon={<IconHome />} />
          <NavItem href="/mecze"       label="Mecze"   isActive={active(pathname, "/mecze")}       icon={<IconCalendar />} />
          <NavItem href="/gracze"      label="Gracze"  isActive={active(pathname, "/gracze")}      icon={<IconUsers />} />
          <NavItem href="/statystyki"  label="Stat."   isActive={active(pathname, "/statystyki")}  icon={<IconChart />} />
          <button
            onClick={() => setMoreOpen((v) => !v)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-[52px] ${
              moreOpen
                ? "text-orange-500"
                : "text-zinc-400 dark:text-zinc-500"
            }`}
          >
            <IconMore />
            <span className="text-[10px] font-semibold">Więcej</span>
          </button>
        </nav>
      </div>
    </>
  )
}

function NavItem({
  href, label, isActive, icon,
}: {
  href: string; label: string; isActive: boolean; icon: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-[52px] ${
        isActive
          ? "text-orange-500"
          : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
      }`}
    >
      {icon}
      <span className="text-[10px] font-semibold">{label}</span>
    </Link>
  )
}

function MoreLink({
  href, label, emoji, isActive, onClose,
}: {
  href: string; label: string; emoji: string; isActive: boolean; onClose: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
        isActive
          ? "text-orange-500 bg-orange-500/8"
          : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5"
      }`}
    >
      <span className="text-base leading-none">{emoji}</span>
      {label}
    </Link>
  )
}

function IconHome() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function IconCalendar() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function IconUsers() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function IconChart() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  )
}

function IconMore() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </svg>
  )
}
