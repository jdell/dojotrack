import { cn } from "@/lib/utils";

interface BeltBadgeProps {
  name: string | null;
  /** Hex colour of the belt, e.g. "#2563EB". */
  color?: string | null;
  className?: string;
}

/**
 * A small belt indicator: a colour swatch plus the rank name. Renders a muted
 * "No belt" pill when a student hasn't been assigned a rank yet.
 */
export function BeltBadge({ name, color, className }: BeltBadgeProps) {
  if (!name) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-xs font-medium text-muted-foreground",
          className,
        )}
      >
        No belt
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-medium text-brand-navy",
        className,
      )}
    >
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full border border-black/10"
        style={{ backgroundColor: color ?? "#e5e7eb" }}
        aria-hidden="true"
      />
      {name}
    </span>
  );
}
