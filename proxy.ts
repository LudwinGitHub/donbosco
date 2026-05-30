import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { decrypt } from "@/lib/session"

const authRoutes = ["/logowanie", "/rejestracja"]
const protectedRoutes = ["/panel", "/moj-profil"]

export default async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname
  const cookie = request.cookies.get("session")?.value
  const session = await decrypt(cookie)
  const isLoggedIn = !!session?.userId

  if (protectedRoutes.some((r) => path.startsWith(r)) && !isLoggedIn) {
    return NextResponse.redirect(new URL("/logowanie", request.nextUrl))
  }

  if (authRoutes.includes(path) && isLoggedIn) {
    return NextResponse.redirect(new URL("/", request.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
}
