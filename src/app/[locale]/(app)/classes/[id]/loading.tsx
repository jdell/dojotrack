import { Skeleton } from "@/components/skeleton";

export default function ClassDetailLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Back link + title */}
      <div>
        <Skeleton className="mb-3 h-4 w-36" />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-7 w-52 mb-2" />
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
          <Skeleton className="h-9 w-20 rounded-lg" />
        </div>
      </div>

      {/* 3 stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-9 rounded-lg" />
            </div>
            <Skeleton className="mt-3 h-9 w-16" />
            <Skeleton className="mt-1 h-3 w-28" />
          </div>
        ))}
      </div>

      {/* Sessions + QR sidebar */}
      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        <div className="space-y-4">
          <Skeleton className="h-5 w-40" />
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
        <aside className="space-y-3">
          <div className="rounded-xl border border-border bg-card p-5 text-center shadow-sm space-y-3">
            <Skeleton className="h-5 w-32 mx-auto" />
            <Skeleton className="h-[180px] w-[180px] mx-auto rounded-lg" />
            <Skeleton className="h-3 w-36 mx-auto" />
          </div>
        </aside>
      </div>
    </div>
  );
}
