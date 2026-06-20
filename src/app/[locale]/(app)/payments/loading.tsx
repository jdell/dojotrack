import { Skeleton, SkeletonTable } from "@/components/skeleton";

export default function PaymentsLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Eyebrow + title */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Skeleton className="h-3 w-16 mb-2" />
          <Skeleton className="h-7 w-36 mb-2" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>

      {/* 4 metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-9 w-9 rounded-lg" />
            </div>
            <Skeleton className="mt-3 h-9 w-20" />
            <Skeleton className="mt-1 h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Plans + checkout panel */}
      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-6 w-16 shrink-0 rounded-full" />
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="space-y-3">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        </div>
      </section>

      {/* Members table */}
      <section className="space-y-3">
        <Skeleton className="h-5 w-28" />
        <SkeletonTable rows={4} cols={4} />
      </section>

      {/* Recent payments table */}
      <section className="space-y-3">
        <Skeleton className="h-5 w-40" />
        <SkeletonTable rows={4} cols={4} />
      </section>
    </div>
  );
}
