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
  const [mode, setMode]                   = useState<Mode>(null)
  const [deferredPrompt, setDeferred]     = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    // Already running as installed PWA
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as { standalone?: boolean }).standalone === true
    ) return

    // Dismissed recently
    const ts = localStorage.getItem(DISMISS_KEY)
    if (ts && Date.now() - parseInt(ts) < DISMISS_DAYS * 86_400_000) return

    // iOS / iPadOS detection
    const ios =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent))

    if (ios) {
      const t = setTimeout(() => setMode("ios"), 4000)
      return () => clearTimeout(t)
    }

    // Android / desktop Chrome — wait for beforeinstallprompt
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

  return (
    <div
      className="fixed left-4 right-4 z-[55] sm:left-auto sm:right-6 sm:w-80 rounded-2xl border border-zinc-200 bg-white shadow-2xl"
      style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="flex items-start gap-3 p-4">
        <Image
          src="/logo-cropped.png"
          alt="Don Bosco PL"
          width={40} height={40}
          className="logo-img rounded-xl object-contain shrink-0"
          unoptimized
        />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-zinc-900 leading-snug">Don Bosco Premier League</p>
          {mode === "ios" ? (
            <p className="mt-1 text-xs text-zinc-500 leading-relaxed">
              Kliknij{" "}
              <IconShare className="inline-block align-middle mx-0.5" />
              {" "}i wybierz{" "}
              <span className="font-semibold text-zinc-700">Dodaj do ekranu&nbsp;głównego</span>
            </p>
          ) : (
            <p className="mt-1 text-xs text-zinc-500 leading-relaxed">
              Zainstaluj aplikację — działa jak natywna, bez przeglądarki
            </p>
          )}
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

      {mode === "android" && (
        <div className="px-4 pb-4">
          <button
            onClick={install}
            className="w-full rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 active:scale-[0.98] transition-all"
          >
            Zainstaluj aplikację
          </button>
        </div>
      )}
    </div>
  )
}

function IconShare({ className = "" }: { className?: string }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={className}
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  )
}
