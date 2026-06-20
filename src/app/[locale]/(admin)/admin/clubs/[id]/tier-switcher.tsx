"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface TierSwitcherProps {
  clubId: string;
  currentTier: string;
}

export function TierSwitcher({ clubId, currentTier }: TierSwitcherProps) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function changeTier(newTier: string) {
    if (newTier === currentTier) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/clubs/${clubId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: newTier }),
      });
      if (res.ok) {
        router.refresh();
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
          currentTier === "PRO"
            ? "bg-brand-teal/10 text-brand-teal"
            : "bg-gray-100 text-gray-600"
        }`}
      >
        {currentTier === "PRO" ? t("pro") : t("free")}
      </span>
      <button
        type="button"
        onClick={() => changeTier(currentTier === "PRO" ? "FREE" : "PRO")}
        disabled={loading}
        className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-brand-navy transition-colors hover:bg-muted/50 disabled:opacity-50"
      >
        {loading
          ? "..."
          : currentTier === "PRO"
            ? t("downgradeToFree")
            : t("upgradeToPro")}
      </button>
    </div>
  );
}
