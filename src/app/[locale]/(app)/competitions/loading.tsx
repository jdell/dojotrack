import { Skeleton } from "@/components/skeleton";

export default function CompetitionsLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Eyebrow + title + button */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Skeleton className="h-3 w-20 mb-2" />
          <Skeleton className="h-7 w-44 mb-2" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-40 rounded-lg" />
      </div>

      {/* Competition cards grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
