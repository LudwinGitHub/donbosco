"use client"
import { useEffect, useState } from "react"
import Image from "next/image"

const DISMISS_KEY  = "pwa_install_dismissed"
const DISMISS_DAYS = 14

interface BeforeInstallPromptEvent extends Event {
  prompt(): void
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

type Mode = "android" | "ios" | null

export default function InstallBanner() {
  const [mode, setMode]               = useState<Mode>(null)
  const [deferredPrompt, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as { standalone?: boolean }).standalone === true
    ) return

    const ts = localStorage.getItem(DISMISS_KEY)
    if (ts && Date.now() - parseInt(ts) < DISMISS_DAYS * 86_400_000) return

    const ios =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent))

    if (ios) {
      const t = setTimeout(() => setMode("ios"), 4000)
      return () => clearTimeout(t)
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setMode("android")
    }
    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const dismiss = () => {
    setMode(null)
    localStorage.setItem(DISMISS_KEY, Date.now().toString())
  }

  const install = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === "accepted") setMode(null)
    setDeferred(null)
  }

  if (!mode) return null

  // ── iOS — modal pośrodku ekranu (baner na dole zasłaniał przycisk Share w Safari) ──
  if (mode === "ios") {
    return (
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center p-6 sm:hidden"
        style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
        onClick={dismiss}
      >
        <div
          className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Nagłówek */}
          <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-zinc-100">
            <Image
              src="/logo-cropped.png" alt="Don Bosco PL"
              width={44} height={44}
              className="logo-img rounded-xl object-contain shrink-0"
              unoptimized
            />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-zinc-900 leading-snug">Zainstaluj aplikację</p>
              <p className="text-xs text-zinc-400 mt-0.5">Don Bosco Premier League</p>
            </div>
            <button
              onClick={dismiss}
              className="shrink-0 p-2 rounded-xl text-zinc-300 hover:text-zinc-500 hover:bg-zinc-100 transition-colors"
              aria-label="Zamknij"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Kroki */}
          <div className="px-5 py-4 space-y-3">
            <Step n={1}>
              Kliknij{" "}
              <IconShare className="inline-block align-middle mx-1 text-blue-500" />
              <strong className="font-semibold text-zinc-800">Udostępnij</strong>
              {" "}na pasku narzędzi Safari na dole ekranu
            </Step>
            <Step n={2}>
              Przewiń w dół i kliknij{" "}
              <strong className="font-semibold text-zinc-800">Dodaj do ekranu głównego</strong>
              {" "}
              <IconPlus className="inline-block align-middle mx-0.5" />
            </Step>
            <Step n={3}>
              Kliknij <strong className="font-semibold text-zinc-800">Dodaj</strong> w prawym górnym rogu
            </Step>
          </div>

          {/* Strzałka wskazująca na dół (gdzie jest Share) */}
          <div className="flex items-center gap-2 mx-5 mb-4 px-3 py-2 rounded-xl bg-blue-50 border border-blue-100">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-blue-400 shrink-0">
              <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
            </svg>
            <p className="text-xs text-blue-600">Przycisk Udostępnij znajdziesz na pasku Safari poniżej</p>
          </div>

          <div className="px-5 pb-5">
            <button
              onClick={dismiss}
              className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-700 active:scale-[0.98] transition-all"
            >
              Rozumiem
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Android — baner na dole ────────────────────────────────────────────────────
  return (
    <div
      className="fixed left-4 right-4 z-[65] sm:left-auto sm:right-6 sm:w-80 rounded-2xl border border-zinc-200 bg-white shadow-2xl"
      style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="flex items-start gap-3 p-4">
        <Image
          src="/logo-cropped.png" alt="Don Bosco PL"
          width={40} height={40}
          className="logo-img rounded-xl object-contain shrink-0"
          unoptimized
        />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-zinc-900 leading-snug">Don Bosco Premier League</p>
          <p className="mt-1 text-xs text-zinc-500 leading-relaxed">
            Zainstaluj aplikację — działa jak natywna, bez przeglądarki
          </p>
        </div>
        <button
          onClick={dismiss}
          aria-label="Zamknij"
          className="shrink-0 -mt-0.5 -mr-0.5 p-1.5 rounded-lg text-zinc-300 hover:text-zinc-500 hover:bg-zinc-100 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <div className="px-4 pb-4">
        <button
          onClick={install}
          className="w-full rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 active:scale-[0.98] transition-all"
        >
          Zainstaluj aplikację
        </button>
      </div>
    </div>
  )
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="shrink-0 w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center mt-0.5">
        {n}
      </span>
      <p className="text-sm text-zinc-600 leading-relaxed">{children}</p>
    </div>
  )
}

function IconShare({ className = "" }: { className?: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  )
}

function IconPlus({ className = "" }: { className?: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  )
}
