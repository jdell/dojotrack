import { Skeleton } from "@/components/skeleton";

export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Eyebrow + title */}
      <div>
        <Skeleton className="h-3 w-16 mb-2" />
        <Skeleton className="h-7 w-32 mb-2" />
        <Skeleton className="h-4 w-56" />
      </div>

      {/* Settings form fields */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
        <Skeleton className="h-10 w-28 rounded-lg mt-2" />
      </div>

      {/* Upgrade banner placeholder */}
      <Skeleton className="h-24 w-full rounded-xl" />

      {/* Stripe connect placeholder */}
      <Skeleton className="h-20 w-full rounded-xl" />
    </div>
  );
}
