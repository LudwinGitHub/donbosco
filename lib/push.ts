import webpush from "web-push"
import { prisma } from "./prisma"

if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:mateusz.ludwin@gmail.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

export type PushPayload = {
  title: string
  body:  string
  url?:  string
}

export async function sendPushToAll(payload: PushPayload) {
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return

  const subs = await prisma.pushSubscription.findMany()
  if (subs.length === 0) return

  const data = JSON.stringify({ ...payload, icon: "/logo-cropped.png" })

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        data
      )
    )
  )

  const expiredEndpoints: string[] = []
  results.forEach((result, i) => {
    if (result.status === "rejected") {
      const err = result.reason as { statusCode?: number }
      if (err.statusCode === 410 || err.statusCode === 404) {
        expiredEndpoints.push(subs[i].endpoint)
      }
    }
  })

  if (expiredEndpoints.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint: { in: expiredEndpoints } } })
  }
}

export async function sendPushToAllExcept(excludeUserId: string, payload: PushPayload) {
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return

  const subs = await prisma.pushSubscription.findMany({
    where: { NOT: { userId: excludeUserId } },
  })
  if (subs.length === 0) return

  const data = JSON.stringify({ ...payload, icon: "/logo-cropped.png" })

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        data
      )
    )
  )

  const expiredEndpoints: string[] = []
  results.forEach((result, i) => {
    if (result.status === "rejected") {
      const err = result.reason as { statusCode?: number }
      if (err.statusCode === 410 || err.statusCode === 404) {
        expiredEndpoints.push(subs[i].endpoint)
      }
    }
  })

  if (expiredEndpoints.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint: { in: expiredEndpoints } } })
  }
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return

  const subs = await prisma.pushSubscription.findMany({ where: { userId } })
  if (subs.length === 0) return

  const data = JSON.stringify({ ...payload, icon: "/logo-cropped.png" })

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        data
      )
    )
  )

  const expiredEndpoints: string[] = []
  results.forEach((result, i) => {
    if (result.status === "rejected") {
      const err = result.reason as { statusCode?: number }
      if (err.statusCode === 410 || err.statusCode === 404) {
        expiredEndpoints.push(subs[i].endpoint)
      }
    }
  })

  if (expiredEndpoints.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint: { in: expiredEndpoints } } })
  }
}
