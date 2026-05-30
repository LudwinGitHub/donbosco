import "server-only"
import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

export type SessionPayload = {
  userId: string
  role: "ORGANIZER" | "PLAYER"
  expiresAt: Date
}

const encodedKey = new TextEncoder().encode(process.env.SESSION_SECRET)
const COOKIE_NAME = "session"
const DURATION_MS = 7 * 24 * 60 * 60 * 1000

export async function encrypt(payload: SessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey)
}

export async function decrypt(token: string | undefined = "") {
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ["HS256"],
    })
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export async function createSession(userId: string, role: "ORGANIZER" | "PLAYER") {
  const expiresAt = new Date(Date.now() + DURATION_MS)
  const token = await encrypt({ userId, role, expiresAt })
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  })
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  return decrypt(token)
}
