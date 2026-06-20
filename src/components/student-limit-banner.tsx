"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, Loader2 } from "lucide-react";
import { FREE_STUDENT_LIMIT } from "@/lib/tier";

interface StudentLimitBannerProps {
  studentCount: number;
  clubTier: "FREE" | "PRO";
}

/**
 * Shown on the students page when a FREE-tier club approaches or reaches the
 * 30-student limit.
 */
export function StudentLimitBanner({
  studentCount,
  clubTier,
}: StudentLimitBannerProps) {
  const t = useTranslations("Platform");
  const [loading, setLoading] = useState(false);

  if (clubTier === "PRO") return null;
  if (studentCount < FREE_STUDENT_LIMIT - 5) return null; // show when within 5

  const atLimit = studentCount >= FREE_STUDENT_LIMIT;

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch("/api/platform/subscribe", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`rounded-lg border p-4 flex items-center gap-3 ${
        atLimit
          ? "border-red-200 bg-red-50"
          : "border-amber-200 bg-amber-50"
      }`}
    >
      <AlertTriangle
        size={18}
        className={atLimit ? "text-red-600" : "text-amber-600"}
      />
      <div className="flex-1">
        <p
          className={`text-sm font-semibold ${
            atLimit ? "text-red-800" : "text-amber-800"
          }`}
        >
          {atLimit
            ? t("studentLimit")
            : t("studentLimitApproaching", {
                count: studentCount,
                limit: FREE_STUDENT_LIMIT,
              })}
        </p>
        <p
          className={`text-xs ${atLimit ? "text-red-700" : "text-amber-700"}`}
        >
          {t("upgradeToAddMore")}
        </p>
      </div>
      <button
        type="button"
        onClick={handleUpgrade}
        disabled={loading}
        className="shrink-0 rounded-lg bg-brand-teal px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-teal/90 disabled:opacity-50"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : t("upgradeButton")}
      </button>
    </div>
  );
}
