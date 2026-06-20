"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Crown, Loader2, Sparkles } from "lucide-react";
import { PRO_PRICE_MONTHLY } from "@/lib/tier";

interface UpgradeBannerProps {
  clubTier: "FREE" | "PRO";
}

const PRO_FEATURES = [
  "unlimitedStudents",
  "stripeConnect",
  "competitions",
  "sparring",
  "exams",
  "emailNotifications",
] as const;

export function UpgradeBanner({ clubTier }: UpgradeBannerProps) {
  const t = useTranslations("Platform");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (clubTier === "PRO") {
    return (
      <section className="rounded-xl border border-green-200 bg-green-50 p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-green-100 p-2">
            <Crown size={20} className="text-green-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-green-800">
              {t("currentPlan")}: {t("proPlan")}
            </h2>
            <p className="text-xs text-green-700">{t("manageSubscription")}</p>
          </div>
        </div>
      </section>
    );
  }

  async function handleUpgrade() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/platform/subscribe", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Could not start checkout.");
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout.");
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-brand-teal/20 bg-gradient-to-br from-brand-teal/5 to-brand-teal/10 p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="rounded-lg bg-brand-teal/10 p-2.5">
          <Sparkles size={24} className="text-brand-teal" />
        </div>
        <div className="flex-1 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-brand-navy">
              {t("upgradeToPro")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("proFeatures")}
            </p>
          </div>

          <ul className="grid gap-2 sm:grid-cols-2">
            {PRO_FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm">
                <Check size={16} className="shrink-0 text-brand-teal" />
                <span className="text-brand-navy">{t(`feature_${feature}`)}</span>
              </li>
            ))}
          </ul>

          <div className="flex items-end gap-4">
            <div>
              <span className="text-3xl font-bold text-brand-navy">
                ${PRO_PRICE_MONTHLY}
              </span>
              <span className="text-sm text-muted-foreground">
                {t("proPrice")}
              </span>
            </div>
            <button
              type="button"
              onClick={handleUpgrade}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-teal px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90 disabled:opacity-50"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {t("upgradeButton")}
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <p className="text-xs text-muted-foreground">
            {t("currentPlan")}: {t("freePlan")} · {t("haveCoupon")}
          </p>
        </div>
      </div>
    </section>
  );
}
