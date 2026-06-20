import { Skeleton, SkeletonTable } from "@/components/skeleton";

export default function MyProfileLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Profile card */}
      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-48" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-4 w-36" />
              </div>
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
          <Skeleton className="h-9 w-40 rounded-lg" />
        </div>
      </section>

      {/* Belt progress placeholder */}
      <Skeleton className="h-24 w-full rounded-xl" />

      {/* Membership card */}
      <section className="space-y-3">
        <Skeleton className="h-5 w-36" />
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-40" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </section>

      {/* Available plans grid */}
      <section className="space-y-3">
        <Skeleton className="h-5 w-36" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </section>

      {/* Upcoming classes */}
      <section className="space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </section>

      {/* Attendance table */}
      <section className="space-y-3">
        <Skeleton className="h-5 w-40" />
        <SkeletonTable rows={5} cols={3} />
      </section>
    </div>
  );
}
