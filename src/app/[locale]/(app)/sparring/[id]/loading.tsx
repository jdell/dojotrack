import { Skeleton } from "@/components/skeleton";

export default function SparringDetailLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back link + title */}
      <div>
        <Skeleton className="mb-3 h-4 w-36" />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Skeleton className="h-3 w-24 mb-2" />
            <Skeleton className="h-7 w-48 mb-2" />
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
          <Skeleton className="h-9 w-20 rounded-lg" />
        </div>
      </div>

      {/* Pairing grid */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-6 w-8 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
