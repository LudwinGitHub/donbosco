import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

export default async function WeryfikacjaPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  if (!token) {
    return <ErrorPage message="Brak tokenu weryfikacyjnego." />
  }

  const record = await prisma.emailVerificationToken.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!record) {
    return <ErrorPage message="Link weryfikacyjny jest nieprawidłowy lub już został użyty." />
  }

  if (record.expiresAt < new Date()) {
    return (
      <ErrorPage message="Link weryfikacyjny wygasł. Zaloguj się i wygeneruj nowy z profilu." />
    )
  }

  // Verify the user
  await prisma.user.update({ where: { id: record.userId }, data: { emailVerified: true } })
  await prisma.emailVerificationToken.delete({ where: { id: record.id } })

  redirect(`/moj-profil?toast=${encodeURIComponent("Email zweryfikowany — witaj!")}`)
}

function ErrorPage({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-sm space-y-4 text-center">
      <h1 className="text-2xl font-bold">Weryfikacja email</h1>
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6">
        <p className="text-sm text-red-700">{message}</p>
      </div>
      <Link href="/moj-profil" className="text-sm text-zinc-500 hover:underline">
        ← Wróć do profilu
      </Link>
    </div>
  )
}
