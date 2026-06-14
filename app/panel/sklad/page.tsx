import { prisma } from "@/lib/prisma"
import { verifySession } from "@/lib/dal"
import { redirect } from "next/navigation"
import SlotList from "./slot-list"

export default async function GroupPage() {
  const session = await verifySession()
  if (session.role !== "ORGANIZER") redirect("/")

  const [slots, usersWithoutSlot] = await Promise.all([
    prisma.matchGroupSlot.findMany({
      include: { user: { select: { id: true, firstName: true, lastName: true, player: { select: { nickname: true } } } } },
      orderBy: { position: "asc" },
    }),
    prisma.user.findMany({
      where: {
        groupSlot: null,
        player: { isNot: null },
      },
      select: { id: true, firstName: true, lastName: true, player: { select: { nickname: true } } },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
  ])

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Skład bazowy</h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          Pozycje 1–14 to grupa grająca. Reszta to rezerwa. Lista wypełnia się automatycznie przy tworzeniu meczu.
        </p>
      </div>

      <SlotList
        slots={slots.map((s) => ({
          userId: s.userId,
          position: s.position,
          name: `${s.user.firstName} ${s.user.lastName}`,
          nickname: s.user.player?.nickname ?? null,
        }))}
        availableUsers={usersWithoutSlot.map((u) => ({
          id: u.id,
          name: `${u.firstName} ${u.lastName}`,
          nickname: u.player?.nickname ?? null,
        }))}
      />
    </div>
  )
}
