"use client"

import { useState, useEffect } from "react"
import { subscribePush, unsubscribePush } from "@/app/actions/push"

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64  = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const output  = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) output[i] = rawData.charCodeAt(i)
  return output
}

export default function PushButton() {
  const [supported,  setSupported]  = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [loading,    setLoading]    = useState(false)

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return
    setSupported(true)
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(!!sub))
  }, [])

  async function toggle() {
    setLoading(true)
    try {
      if (subscribed) {
        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.getSubscription()
        await sub?.unsubscribe()
        await unsubscribePush(sub?.endpoint ?? "")
        setSubscribed(false)
      } else {
        const permission = await Notification.requestPermission()
        if (permission !== "granted") return
        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly:   true,
          applicationServerKey: urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
          ),
        })
        const j = JSON.parse(JSON.stringify(sub))
        await subscribePush({ endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth })
        setSubscribed(true)
      }
    } finally {
      setLoading(false)
    }
  }

  if (!supported) return null

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={subscribed ? "Wyłącz powiadomienia push" : "Włącz powiadomienia push"}
      className="rounded-md px-2 py-1.5 text-base leading-none transition-colors hover:bg-zinc-100 disabled:opacity-50"
    >
      {subscribed ? "🔔" : "🔕"}
    </button>
  )
}
