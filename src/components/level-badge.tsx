import type { ClassLevel } from "@prisma/client";
import { cn } from "@/lib/utils";

const LEVEL_META: Record<ClassLevel, { label: string; className: string }> = {
  BEGINNER: { label: "Beginner", className: "bg-green-100 text-green-800" },
  INTERMEDIATE: {
    label: "Intermediate",
    className: "bg-blue-100 text-blue-800",
  },
  ADVANCED: { label: "Advanced", className: "bg-purple-100 text-purple-800" },
  ALL_LEVELS: { label: "All levels", className: "bg-slate-100 text-slate-700" },
};

/** A small pill indicating the skill level a class targets. */
export function LevelBadge({
  level,
  className,
}: {
  level: ClassLevel;
  className?: string;
}) {
  const meta = LEVEL_META[level];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        meta.className,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}
