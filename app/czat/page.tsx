import { prisma } from "@/lib/prisma"
import { getOptionalSession } from "@/lib/dal"
import ChatWindow from "./chat-window"

export default async function ChatPage() {
  const [session, messages] = await Promise.all([
    getOptionalSession(),
    prisma.chatMessage.findMany({
      orderBy: { createdAt: "asc" },
      take: 100,
      include: { user: { select: { firstName: true, lastName: true } } },
    }),
  ])

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Czat ligowy</h1>
        <p className="text-sm text-zinc-500 mt-1">Rozmowy graczy Don Bosco Premier League</p>
      </div>
      <ChatWindow
        messages={messages}
        currentUserId={session?.userId ?? null}
        isOrganizer={session?.role === "ORGANIZER"}
      />
    </div>
  )
}
