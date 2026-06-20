import { Skeleton } from "@/components/skeleton";

export default function ClassesLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Eyebrow + title + button */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Skeleton className="h-3 w-16 mb-2" />
          <Skeleton className="h-7 w-36 mb-2" />
          <Skeleton className="h-4 w-52" />
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>

      {/* Class cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-36" />
          </div>
        ))}
      </div>
    </div>
  );
}
