import { Skeleton, SkeletonTable } from "@/components/skeleton";

export default function StudentDetailLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Back link */}
      <div>
        <Skeleton className="mb-3 h-4 w-32" />
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-7 w-48 mb-2" />
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-4 w-36" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-32 rounded-lg" />
          </div>
        </div>
      </div>

      {/* 3 stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-9 w-9 rounded-lg" />
            </div>
            <Skeleton className="mt-3 h-7 w-16" />
            <Skeleton className="mt-1 h-3 w-24" />
          </div>
        ))}
      </div>

      {/* Attendance history table */}
      <section className="space-y-3">
        <Skeleton className="h-5 w-44" />
        <SkeletonTable rows={5} cols={3} />
      </section>
    </div>
  );
}
