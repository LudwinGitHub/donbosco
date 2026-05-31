import { Skeleton } from "@/app/ui/skeleton"

export default function MojProfilLoading() {
  return (
    <div className="mx-auto max-w-lg space-y-6">

      {/* Page header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-44" />
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1.5 border-b border-zinc-100 pb-4">
        <Skeleton className="h-8 w-16 rounded-lg" />
        <Skeleton className="h-8 w-32 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>

      {/* Profile card */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-40" />
        </div>
        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-4 border-t border-zinc-100 pt-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      </div>

      {/* Registrations section */}
      <div className="space-y-3">
        <Skeleton className="h-3.5 w-24" />
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white divide-y divide-zinc-100">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-3.5 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
