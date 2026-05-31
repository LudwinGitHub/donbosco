import { Skeleton } from "@/app/ui/skeleton"

export default function StatystykiLoading() {
  return (
    <div className="space-y-8">

      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-8 w-36 rounded-lg" />
      </div>

      {/* All-time scorer ranking table */}
      <section className="space-y-3">
        <Skeleton className="h-3.5 w-40" />
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <div className="flex items-center gap-4 border-b border-zinc-100 bg-zinc-50 px-4 py-3">
            <Skeleton className="h-3 w-6" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-24 hidden sm:block" />
            <div className="ml-auto flex gap-6">
              <Skeleton className="h-3 w-6" />
              <Skeleton className="h-3 w-6" />
            </div>
          </div>
          {[["w-28", "w-20"], ["w-36", "w-16"], ["w-24", "w-28"], ["w-32", "w-20"], ["w-28", "w-24"]].map(
            ([nameW, teamW], i) => (
              <div key={i} className="flex items-center gap-4 border-b border-zinc-100 last:border-0 px-4 py-3">
                <Skeleton className="h-3 w-6" />
                <Skeleton className={`h-3 ${nameW}`} />
                <Skeleton className={`h-3 ${teamW} hidden sm:block`} />
                <div className="ml-auto flex gap-6">
                  <Skeleton className="h-3 w-6" />
                  <Skeleton className="h-3 w-6" />
                </div>
              </div>
            )
          )}
        </div>
      </section>

      {/* Match record cards */}
      <section className="space-y-3">
        <Skeleton className="h-3.5 w-28" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl border border-zinc-200 bg-white" />
          ))}
        </div>
      </section>

      {/* Season overview table */}
      <section className="space-y-3">
        <Skeleton className="h-3.5 w-44" />
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <div className="flex items-center gap-4 border-b border-zinc-100 bg-zinc-50 px-4 py-3">
            <Skeleton className="h-3 w-20" />
            <div className="ml-auto flex gap-6">
              <Skeleton className="h-3 w-8" />
              <Skeleton className="h-3 w-16 hidden sm:block" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b border-zinc-100 last:border-0 px-4 py-3">
              <Skeleton className="h-3 w-24" />
              <div className="ml-auto flex gap-6">
                <Skeleton className="h-3 w-8" />
                <Skeleton className="h-3 w-16 hidden sm:block" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
