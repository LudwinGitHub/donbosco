"use server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { createSession, deleteSession } from "@/lib/session"
import { verifySession } from "@/lib/dal"
import { sendVerificationEmail } from "@/lib/email"

// ─── Schemas ─────────────────────────────────────────────────────────────────

const LoginSchema = z.object({
  email: z.string().email({ message: "Nieprawidłowy adres email." }).trim(),
  password: z.string().min(1, { message: "Podaj hasło." }),
})

const SignupSchema = z.object({
  firstName: z.string().min(2, { message: "Imię musi mieć co najmniej 2 znaki." }).trim(),
  lastName: z.string().min(2, { message: "Nazwisko musi mieć co najmniej 2 znaki." }).trim(),
  email: z.string().email({ message: "Nieprawidłowy adres email." }).trim(),
  password: z
    .string()
    .min(8, { message: "Hasło musi mieć co najmniej 8 znaków." })
    .regex(/[a-zA-Z]/, { message: "Hasło musi zawierać co najmniej jedną literę." })
    .regex(/[0-9]/, { message: "Hasło musi zawierać co najmniej jedną cyfrę." }),
})

export type AuthFormState =
  | { errors?: Record<string, string[]>; message?: string }
  | undefined

// ─── Actions ─────────────────────────────────────────────────────────────────

export async function login(state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { email, password } = parsed.data

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return { message: "Nieprawidłowy email lub hasło." }
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash)
  if (!passwordMatch) {
    return { message: "Nieprawidłowy email lub hasło." }
  }

  await createSession(user.id, user.role)
  redirect(`/?toast=${encodeURIComponent("Zalogowano pomyślnie")}`)
}

export async function signup(state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = SignupSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { firstName, lastName, email, password } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { errors: { email: ["Konto z tym adresem email już istnieje."] } }
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { firstName, lastName, email, passwordHash, role: "PLAYER", emailVerified: false },
  })

  createVerificationToken(user.id).then((token) => {
    sendVerificationEmail(user.email, user.firstName, token).catch(() => {})
  }).catch(() => {})

  await createSession(user.id, user.role)
  redirect(`/?toast=${encodeURIComponent("Konto utworzone — witaj!")}`)
}

export async function logout() {
  await deleteSession()
  redirect("/logowanie")
}

// ─── Verification token ───────────────────────────────────────────────────────

export async function createVerificationToken(userId: string): Promise<string> {
  // Delete any existing token first
  await prisma.emailVerificationToken.deleteMany({ where: { userId } })
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const record = await prisma.emailVerificationToken.create({
    data: { userId, expiresAt },
  })
  return record.token
}

// ─── Change password ──────────────────────────────────────────────────────────

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: "Podaj aktualne hasło." }),
  newPassword: z
    .string()
    .min(8, { message: "Hasło musi mieć co najmniej 8 znaków." })
    .regex(/[a-zA-Z]/, { message: "Hasło musi zawierać co najmniej jedną literę." })
    .regex(/[0-9]/, { message: "Hasło musi zawierać co najmniej jedną cyfrę." }),
  confirmPassword: z.string(),
})

export async function changePassword(
  state: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const session = await verifySession()

  const parsed = ChangePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  })
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors }
  const { currentPassword, newPassword, confirmPassword } = parsed.data

  if (newPassword !== confirmPassword)
    return { errors: { confirmPassword: ["Hasła nie są identyczne."] } }

  const user = await prisma.user.findUnique({ where: { id: session.userId } })
  if (!user) return { message: "Użytkownik nie istnieje." }

  const ok = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!ok) return { errors: { currentPassword: ["Nieprawidłowe aktualne hasło."] } }

  const hash = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({ where: { id: session.userId }, data: { passwordHash: hash } })

  redirect(`/moj-profil?toast=${encodeURIComponent("Hasło zostało zmienione")}`)
}
