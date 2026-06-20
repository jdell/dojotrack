"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Crown, Loader2, Lock } from "lucide-react";
import { PRO_PRICE_MONTHLY } from "@/lib/tier";

interface ProGateProps {
  feature: string;
  children: React.ReactNode;
  clubTier: "FREE" | "PRO";
}

/**
 * Wraps content that requires the PRO tier. When the club is on FREE, renders
 * an upgrade overlay instead of the children.
 */
export function ProGate({ feature, children, clubTier }: ProGateProps) {
  const t = useTranslations("Platform");
  const [loading, setLoading] = useState(false);

  if (clubTier === "PRO") {
    return <>{children}</>;
  }

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
    <div className="relative">
      <div className="pointer-events-none select-none opacity-30 blur-[2px]">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="rounded-xl border border-border bg-card/95 p-8 shadow-lg text-center max-w-sm backdrop-blur-sm">
          <div className="mx-auto mb-3 rounded-full bg-brand-teal/10 p-3 w-fit">
            <Lock size={24} className="text-brand-teal" />
          </div>
          <h3 className="text-lg font-bold text-brand-navy">
            {t("upgradeToPro")}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t(`featureGate_${feature}`)}
          </p>
          <button
            type="button"
            onClick={handleUpgrade}
            disabled={loading}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-teal px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Crown size={16} />
            )}
            {t("upgradeButton")} — ${PRO_PRICE_MONTHLY}/{t("proPrice")}
          </button>
        </div>
      </div>
    </div>
  );
}
