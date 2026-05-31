import { Skeleton } from "@/app/ui/skeleton"

export default function GraczeLoading() {
  return (
    <div className="space-y-5">

      {/* Page header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-4 w-36" />
      </div>

      {/* Season tabs */}
      <div className="flex gap-1.5">
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-8 w-16 rounded-lg" />
        <Skeleton className="h-8 w-16 rounded-lg" />
      </div>

      {/* Top player stat cards */}
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-zinc-200 bg-white p-4 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-7 w-12" />
          </div>
        ))}
      </div>

      {/* Players table */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-zinc-100 bg-zinc-50 px-4 py-3">
          <Skeleton className="h-3 w-6" />
          <Skeleton className="h-3 w-20" />
          <div className="ml-auto flex gap-8">
            <Skeleton className="h-3 w-6" />
            <Skeleton className="h-3 w-6" />
            <Skeleton className="h-3 w-6" />
          </div>
        </div>
        {/* Rows */}
        {[
          ["w-32", "w-24"], ["w-28", "w-20"], ["w-36", "w-16"],
          ["w-24", "w-28"], ["w-32", "w-20"], ["w-28", "w-32"],
          ["w-20", "w-24"], ["w-36", "w-16"],
        ].map(([nameW, _nicknameW], i) => (
          <div key={i} className="flex items-center gap-4 border-b border-zinc-100 last:border-0 px-4 py-3">
            <Skeleton className="h-3 w-6" />
            <Skeleton className={`h-3 ${nameW}`} />
            <div className="ml-auto flex gap-8">
              <Skeleton className="h-3 w-6" />
              <Skeleton className="h-3 w-6" />
              <Skeleton className="h-3 w-6" />
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
