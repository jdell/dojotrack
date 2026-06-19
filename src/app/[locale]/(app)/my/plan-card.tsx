"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CreditCard, Loader2 } from "lucide-react";
import type { BillingInterval } from "@prisma/client";

interface PlanCardProps {
  planId: string;
  name: string;
  description: string | null;
  amount: number;
  currency: string;
  interval: BillingInterval;
  stripeReady: boolean;
}

export function PlanCard({
  planId,
  name,
  description,
  amount,
  currency,
  interval,
  stripeReady,
}: PlanCardProps) {
  const t = useTranslations("MyProfile");
  const tp = useTranslations("Payments");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatted = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).format(amount);

  async function handleSubscribe() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/my/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not start checkout.");
        setLoading(false);
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("Could not start checkout.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex-1">
        <h3 className="text-base font-bold text-brand-navy">{name}</h3>
        <p className="mt-1 text-2xl font-bold tracking-tight text-brand-navy">
          {formatted}
          <span className="text-sm font-normal text-muted-foreground">
            {tp(`intervalShort.${interval}`)}
          </span>
        </p>
        {description && (
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="mt-4">
        {error && (
          <p className="mb-2 text-xs text-red-600">{error}</p>
        )}
        <button
          type="button"
          onClick={handleSubscribe}
          disabled={loading || !stripeReady}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-teal px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <CreditCard size={16} />
          )}
          {loading ? tp("checkout.redirecting") : t("subscribe")}
        </button>
      </div>
    </div>
  );
}
