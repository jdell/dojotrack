"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Eye, X } from "lucide-react";

interface ImpersonationBannerProps {
  clubName: string;
}

/**
 * Fixed banner shown at the top of every page while a platform admin is
 * impersonating a club. Provides a clear visual indicator and an exit button
 * that clears the impersonation cookie and redirects back to the admin panel.
 */
export function ImpersonationBanner({ clubName }: ImpersonationBannerProps) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function stopImpersonating() {
    setLoading(true);
    try {
      await fetch("/api/admin/stop-impersonating", { method: "POST" });
      router.push("/admin/clubs");
      router.refresh();
    } catch {
      // If the request fails, reload anyway to clear stale state.
      window.location.href = "/admin/clubs";
    }
  }

  return (
    <div className="sticky top-0 z-50 flex items-center justify-center gap-3 bg-brand-teal px-4 py-2 text-sm font-medium text-white shadow-md">
      <Eye size={16} className="shrink-0" />
      <span>
        {t("viewingAs")}: <strong>{clubName}</strong>
      </span>
      <button
        type="button"
        onClick={stopImpersonating}
        disabled={loading}
        className="ml-2 inline-flex items-center gap-1 rounded-md bg-white/20 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-white/30 disabled:opacity-50"
      >
        <X size={14} />
        {t("exitImpersonation")}
      </button>
    </div>
  );
}
