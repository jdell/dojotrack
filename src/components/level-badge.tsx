"use client";

import { useTranslations } from "next-intl";
import type { ClassLevel } from "@prisma/client";
import { cn } from "@/lib/utils";

const LEVEL_CLASS: Record<ClassLevel, string> = {
  BEGINNER: "bg-green-100 text-green-800",
  INTERMEDIATE: "bg-blue-100 text-blue-800",
  ADVANCED: "bg-purple-100 text-purple-800",
  ALL_LEVELS: "bg-slate-100 text-slate-700",
};

/** A small pill indicating the skill level a class targets. */
export function LevelBadge({
  level,
  className,
}: {
  level: ClassLevel;
  className?: string;
}) {
  const t = useTranslations("Classes");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        LEVEL_CLASS[level],
        className,
      )}
    >
      {t(`level.${level}`)}
    </span>
  );
}
