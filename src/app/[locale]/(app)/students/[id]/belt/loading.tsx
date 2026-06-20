import { Skeleton } from "@/components/skeleton";

export default function BeltProgressLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back link + title */}
      <div>
        <Skeleton className="mb-3 h-4 w-32" />
        <Skeleton className="h-3 w-28 mb-2" />
        <Skeleton className="h-7 w-48 mb-2" />
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-4 w-44" />
        </div>
      </div>

      {/* 2 stat cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-9 w-9 rounded-lg" />
            </div>
            <Skeleton className="mt-3 h-7 w-20" />
            <Skeleton className="mt-1 h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Requirements checklist */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
        <Skeleton className="h-5 w-44 mb-4" />
        {/* Progress bar */}
        <Skeleton className="h-2.5 w-full rounded-full" />
        <div className="space-y-3 pt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-5 w-5 shrink-0 rounded" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
      </div>

      {/* Belt history */}
      <section className="space-y-3">
        <Skeleton className="h-5 w-32" />
        <div className="relative space-y-4 border-l border-border pl-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="relative">
              <Skeleton className="absolute -left-[1.95rem] top-0.5 h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-28 mb-1" />
              <Skeleton className="h-3 w-40" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
