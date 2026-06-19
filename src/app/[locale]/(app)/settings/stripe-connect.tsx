"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, ExternalLink, Loader2, Zap } from "lucide-react";

interface StripeConnectStatus {
  connected: boolean;
  onboarded: boolean;
  dashboardUrl: string | null;
}

/**
 * Stripe Connect onboarding card for the settings page. Shows one of three
 * states: not connected, connected but incomplete, or fully onboarded.
 */
export function StripeConnect({
  initialConnected,
  initialOnboarded,
}: {
  initialConnected: boolean;
  initialOnboarded: boolean;
}) {
  const t = useTranslations("Settings");
  const [status, setStatus] = useState<StripeConnectStatus>({
    connected: initialConnected,
    onboarded: initialOnboarded,
    dashboardUrl: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // On mount (and after returning from Stripe), refresh the onboarding status.
  useEffect(() => {
    if (!initialConnected && !initialOnboarded) return;
    fetch("/api/stripe/connect")
      .then((r) => r.json())
      .then((data) => {
        if (data.connected !== undefined) setStatus(data);
      })
      .catch(() => {});
  }, [initialConnected, initialOnboarded]);

  async function startConnect() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/connect", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? t("stripeConnectError"));
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("stripeConnectError"));
      setLoading(false);
    }
  }

  return (
    <section className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-sm font-bold uppercase tracking-wide text-brand-navy">
        {t("stripeConnectTitle")}
      </h2>
      <p className="text-sm text-muted-foreground">
        {t("stripeConnectDesc")}
      </p>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {status.onboarded ? (
        /* Fully onboarded */
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
          <CheckCircle2 size={20} className="text-green-600" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-green-800">
              {t("stripeConnected")}
            </p>
          </div>
          {status.dashboardUrl && (
            <a
              href={status.dashboardUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-green-300 bg-white px-3 py-1.5 text-sm font-medium text-green-800 transition-colors hover:bg-green-50"
            >
              {t("stripeDashboard")}
              <ExternalLink size={14} />
            </a>
          )}
        </div>
      ) : status.connected ? (
        /* Connected but onboarding not complete */
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <Zap size={20} className="text-amber-600" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">
              {t("stripeIncomplete")}
            </p>
          </div>
          <button
            type="button"
            onClick={startConnect}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {t("stripeCompleteSetup")}
          </button>
        </div>
      ) : (
        /* Not connected at all */
        <button
          type="button"
          onClick={startConnect}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-teal px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Zap size={16} />
          )}
          {t("stripeConnectButton")}
        </button>
      )}
    </section>
  );
}
