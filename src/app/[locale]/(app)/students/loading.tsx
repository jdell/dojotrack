import { Skeleton, SkeletonTable } from "@/components/skeleton";

export default function StudentsLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Eyebrow + title + buttons */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Skeleton className="h-3 w-16 mb-2" />
          <Skeleton className="h-7 w-36 mb-2" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-36 rounded-lg" />
        </div>
      </div>

      {/* Search bar */}
      <Skeleton className="h-10 w-full rounded-lg" />

      {/* Table: name, belt, attendance, payment, joined */}
      <SkeletonTable rows={5} cols={5} />
    </div>
  );
}
