import "server-only"
import { cache } from "react"
import { redirect } from "next/navigation"
import { getSession } from "./session"

export type SessionUser = {
  userId: string
  role: "ORGANIZER" | "PLAYER"
}

export const verifySession = cache(async (): Promise<SessionUser> => {
  const session = await getSession()
  if (!session?.userId) redirect("/logowanie")
  return { userId: session.userId, role: session.role }
})

export const getOptionalSession = cache(async (): Promise<SessionUser | null> => {
  const session = await getSession()
  if (!session?.userId) return null
  return { userId: session.userId, role: session.role }
})
