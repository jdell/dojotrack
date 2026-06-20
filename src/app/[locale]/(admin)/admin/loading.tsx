import { Skeleton, SkeletonTable } from "@/components/skeleton";

export default function AdminDashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Eyebrow + title */}
      <div>
        <Skeleton className="h-3 w-24 mb-2" />
        <Skeleton className="h-7 w-48" />
      </div>

      {/* 4 metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-7 w-16" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-9 w-9 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Recent signups table */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-24" />
        </div>
        <SkeletonTable rows={5} cols={4} />
      </div>
    </div>
  );
}
