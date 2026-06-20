import { Skeleton, SkeletonTable } from "@/components/skeleton";

export default function AdminClubsLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Eyebrow + title */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-3 w-24 mb-2" />
          <Skeleton className="h-7 w-28" />
        </div>
      </div>

      {/* Search bar */}
      <div className="flex gap-2">
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 w-24 rounded-lg" />
      </div>

      {/* Clubs table */}
      <SkeletonTable rows={6} cols={7} />
    </div>
  );
}
