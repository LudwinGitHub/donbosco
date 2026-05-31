import { Skeleton } from "@/app/ui/skeleton"

export default function MeczDetailLoading() {
  return (
    <div className="space-y-6">

      {/* Back / breadcrumb link */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-3" />
        <Skeleton className="h-4 w-16" />
      </div>

      {/* Scoreboard */}
      <div className="h-32 rounded-xl border border-zinc-200 bg-white p-6 flex items-center justify-between gap-4">
        {/* Home team */}
        <div className="flex flex-1 flex-col items-start gap-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        {/* Score / date */}
        <div className="flex shrink-0 flex-col items-center gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
        {/* Away team */}
        <div className="flex flex-1 flex-col items-end gap-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>

      {/* Goals section */}
      <section className="space-y-2">
        <Skeleton className="h-3.5 w-16" />
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white divide-y divide-zinc-50">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="grid grid-cols-[1fr_72px_1fr] items-center gap-1 px-4 py-2.5">
              <div className="flex flex-col items-end gap-1">
                {i % 2 === 0 ? <Skeleton className="h-3.5 w-28" /> : null}
              </div>
              <div className="flex flex-col items-center gap-1">
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-2 w-2 rounded-full" />
              </div>
              <div className="flex flex-col items-start gap-1">
                {i % 2 !== 0 ? <Skeleton className="h-3.5 w-28" /> : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Lineup section */}
      <section className="space-y-2">
        <Skeleton className="h-3.5 w-12" />
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <div className="grid grid-cols-2 divide-x divide-zinc-100">
            {Array.from({ length: 2 }).map((_, col) => (
              <div key={col} className="p-4 space-y-2">
                <div className="flex items-center gap-1.5 mb-3">
                  <Skeleton className="h-2.5 w-2.5 rounded-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
                {Array.from({ length: 5 }).map((_, j) => (
                  <Skeleton key={j} className={`h-3 ${j % 2 === 0 ? "w-24" : "w-32"}`} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Registration section */}
      <section className="space-y-2">
        <Skeleton className="h-3.5 w-20" />
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 space-y-3">
          <Skeleton className="h-9 w-32 rounded-lg" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-40" />
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}
