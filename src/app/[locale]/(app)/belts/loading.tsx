import { Skeleton } from "@/components/skeleton";

export default function BeltsLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Eyebrow + title + button */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Skeleton className="h-3 w-16 mb-2" />
          <Skeleton className="h-7 w-40 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>

      {/* Belt rank rows */}
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <Skeleton className="h-6 w-6 rounded-full shrink-0" />
            <Skeleton className="h-4 w-32 flex-1" />
            <Skeleton className="h-3 w-16 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
