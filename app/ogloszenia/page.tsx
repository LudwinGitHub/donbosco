import { prisma } from "@/lib/prisma"
import { getOptionalSession } from "@/lib/dal"
import AnnouncementsSection from "./announcements-section"

export default async function AnnouncementsPage() {
  const [session, announcements] = await Promise.all([
    getOptionalSession(),
    prisma.announcement.findMany({
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      include: {
        author: { select: { firstName: true, lastName: true } },
        reactions: { select: { type: true, userId: true } },
      },
    }),
  ])

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Ogłoszenia</h1>
        <p className="text-sm text-zinc-500 mt-1">Komunikaty od organizatora ligi</p>
      </div>
      <AnnouncementsSection
        announcements={announcements}
        currentUserId={session?.userId ?? null}
        isOrganizer={session?.role === "ORGANIZER"}
      />
    </div>
  )
}
