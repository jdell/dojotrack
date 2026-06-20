import { Skeleton } from "@/components/skeleton";

export default function SparringLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Eyebrow + title + button */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Skeleton className="h-3 w-16 mb-2" />
          <Skeleton className="h-7 w-36 mb-2" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>

      {/* Session cards list */}
      <ul className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <li key={i}>
            <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
              <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-32" />
              </div>
              <div className="shrink-0 space-y-1 text-right">
                <Skeleton className="h-4 w-8 ml-auto" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
