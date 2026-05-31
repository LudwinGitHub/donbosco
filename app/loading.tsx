import { Skeleton } from "@/app/ui/skeleton"

export default function HomeLoading() {
  return (
    <div className="space-y-8">

      {/* Dashboard cards — 2×2 grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl border border-zinc-200 bg-white" />
        ))}
      </div>

      {/* Standings section */}
      <div className="space-y-4">
        {/* Title */}
        <div className="space-y-2">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-24" />
        </div>

        {/* Season tabs */}
        <div className="flex gap-1.5">
          <Skeleton className="h-8 w-16 rounded-lg" />
          <Skeleton className="h-8 w-16 rounded-lg" />
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          {/* Header row */}
          <div className="flex items-center gap-4 border-b border-zinc-100 bg-zinc-50 px-4 py-3">
            <Skeleton className="h-3 w-4" />
            <Skeleton className="h-3 w-24" />
            <div className="ml-auto flex gap-6">
              <Skeleton className="h-3 w-6 hidden sm:block" />
              <Skeleton className="h-3 w-6 hidden sm:block" />
              <Skeleton className="h-3 w-6 hidden sm:block" />
              <Skeleton className="h-3 w-8 hidden sm:block" />
              <Skeleton className="h-3 w-8" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          {/* Data rows */}
          {[
            ["w-20", "w-32"], ["w-16", "w-28"], ["w-24", "w-20"],
            ["w-20", "w-36"], ["w-16", "w-28"], ["w-28", "w-20"],
            ["w-20", "w-24"], ["w-16", "w-32"],
          ].map(([numW, nameW], i) => (
            <div key={i} className="flex items-center gap-4 border-b border-zinc-100 last:border-0 px-4 py-3">
              <Skeleton className={`h-3 ${numW}`} />
              <Skeleton className={`h-3 ${nameW}`} />
              <div className="ml-auto flex gap-6">
                <Skeleton className="h-3 w-6 hidden sm:block" />
                <Skeleton className="h-3 w-6 hidden sm:block" />
                <Skeleton className="h-3 w-6 hidden sm:block" />
                <Skeleton className="h-3 w-8 hidden sm:block" />
                <Skeleton className="h-3 w-8" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
