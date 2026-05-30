"use server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { createSession, deleteSession } from "@/lib/session"

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
  redirect("/")
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
    data: { firstName, lastName, email, passwordHash, role: "PLAYER" },
  })

  await createSession(user.id, user.role)
  redirect("/")
}

export async function logout() {
  await deleteSession()
  redirect("/logowanie")
}
