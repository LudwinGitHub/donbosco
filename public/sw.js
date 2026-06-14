const CACHE = "dbpl-v1"

// ── Lifecycle ──────────────────────────────────────────────────────────────────

self.addEventListener("install", () => self.skipWaiting())

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// ── Fetch — needed for Chrome's PWA install criteria ──────────────────────────

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return
  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith("/api/")) return

  // Static assets (hashed filenames) — cache first, very safe
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(event.request).then(
        (hit) =>
          hit ||
          fetch(event.request).then((res) => {
            if (res.ok) caches.open(CACHE).then((c) => c.put(event.request, res.clone()))
            return res
          })
      )
    )
    return
  }

  // Public assets (/donlogo.png etc.) — cache first
  if (
    url.pathname.match(/\.(png|jpg|svg|ico|webp|woff2?)$/)
  ) {
    event.respondWith(
      caches.match(event.request).then(
        (hit) =>
          hit ||
          fetch(event.request).then((res) => {
            if (res.ok) caches.open(CACHE).then((c) => c.put(event.request, res.clone()))
            return res
          })
      )
    )
    return
  }

  // HTML navigation — network first, fall back to cache
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res.ok) caches.open(CACHE).then((c) => c.put(event.request, res.clone()))
          return res
        })
        .catch(() => caches.match(event.request))
    )
  }
})

// ── Push notifications ─────────────────────────────────────────────────────────

self.addEventListener("push", (event) => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title || "Don Bosco PL", {
      body:    data.body,
      icon:    data.icon || "/logo-cropped.png",
      badge:   "/logo-cropped.png",
      vibrate: [100, 50, 100],
      data:    { url: data.url || "/" },
    })
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url = event.notification.data?.url || "/"
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((list) => {
        for (const client of list) {
          if ("focus" in client) { client.navigate(url); return client.focus() }
        }
        return clients.openWindow(url)
      })
  )
})
