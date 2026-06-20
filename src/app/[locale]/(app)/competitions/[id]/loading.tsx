import { Skeleton } from "@/components/skeleton";

export default function CompetitionDetailLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Back link + title */}
      <div>
        <Skeleton className="mb-3 h-4 w-40" />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-7 w-52 mb-2" />
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-9 w-20 rounded-lg" />
          </div>
        </div>
        <Skeleton className="mt-3 h-16 w-full rounded-lg" />
      </div>

      {/* Medal counts */}
      <div className="flex flex-wrap gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 shadow-sm">
            <Skeleton className="h-7 w-7 rounded" />
            <div className="space-y-1">
              <Skeleton className="h-5 w-6" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        ))}
      </div>

      {/* Results table placeholder */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-28 rounded-lg" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-border last:border-0 pb-3">
            <Skeleton className="h-4 w-8 shrink-0" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
