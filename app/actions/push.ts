"use server"

import { prisma } from "@/lib/prisma"
import { getOptionalSession } from "@/lib/dal"

export async function subscribePush(sub: {
  endpoint: string
  p256dh:   string
  auth:     string
}) {
  const session = await getOptionalSession()
  await prisma.pushSubscription.upsert({
    where:  { endpoint: sub.endpoint },
    update: { p256dh: sub.p256dh, auth: sub.auth, userId: session?.userId ?? null },
    create: { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth, userId: session?.userId ?? null },
  })
}

export async function unsubscribePush(endpoint: string) {
  if (!endpoint) return
  await prisma.pushSubscription.deleteMany({ where: { endpoint } })
}
