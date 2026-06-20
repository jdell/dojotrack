import { Skeleton, SkeletonCard, SkeletonTable } from "@/components/skeleton";

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Eyebrow + title */}
      <div>
        <Skeleton className="h-3 w-20 mb-2" />
        <Skeleton className="h-7 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* 4 metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-9 rounded-lg" />
            </div>
            <Skeleton className="mt-3 h-9 w-20" />
            <Skeleton className="mt-1 h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Today's classes section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-28" />
        </div>
        <SkeletonTable rows={3} cols={4} />
      </section>

      {/* Upcoming exams section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
              <Skeleton className="h-9 w-2 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-3 w-20 shrink-0" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
