import { Skeleton } from "@/app/ui/skeleton"

export default function MeczeLoading() {
  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* Season tabs */}
      <div className="flex gap-1.5">
        <Skeleton className="h-8 w-16 rounded-lg" />
        <Skeleton className="h-8 w-16 rounded-lg" />
        <Skeleton className="h-8 w-16 rounded-lg" />
      </div>

      {/* Round sections */}
      {Array.from({ length: 3 }).map((_, roundIdx) => (
        <section key={roundIdx} className="space-y-2">
          {/* Round header */}
          <Skeleton className="h-3.5 w-20" />
          {/* Match rows */}
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white divide-y divide-zinc-100">
            {Array.from({ length: 2 }).map((_, matchIdx) => (
              <div key={matchIdx} className="h-16 px-4 flex items-center gap-4">
                <Skeleton className="h-3 w-20 hidden sm:block" />
                <div className="flex flex-1 items-center justify-between gap-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-3 w-8 hidden sm:block" />
              </div>
            ))}
          </div>
        </section>
      ))}

    </div>
  )
}
