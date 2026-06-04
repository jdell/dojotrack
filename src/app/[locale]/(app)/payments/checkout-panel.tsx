"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CreditCard, Loader2 } from "lucide-react";
import { formatMoney } from "@/lib/utils";
import type { PaymentPlanRow, StudentOption } from "@/lib/queries";

const controlClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-teal";
const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

/**
 * Start a Stripe Checkout Session for a student + plan. On success the browser
 * is redirected to Stripe's hosted checkout; the webhook records the result.
 */
export function CheckoutPanel({
  students,
  plans,
  stripeConfigured,
}: {
  students: StudentOption[];
  plans: PaymentPlanRow[];
  stripeConfigured: boolean;
}) {
  const t = useTranslations("Payments");
  const [studentId, setStudentId] = useState("");
  const [planId, setPlanId] = useState(plans[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const disabled =
    !stripeConfigured ||
    students.length === 0 ||
    plans.length === 0 ||
    !studentId ||
    !planId ||
    loading;

  async function startCheckout() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, planId }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? t("checkoutError"));
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("checkoutError"));
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      {plans.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("checkout.noPlans")}
        </p>
      ) : (
        <>
          <div>
            <label className={labelClass}>{t("checkout.member")}</label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className={controlClass}
            >
              <option value="">{t("checkout.selectMember")}</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>{t("checkout.plan")}</label>
            <select
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              className={controlClass}
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {formatMoney(p.amount, p.currency)}
                  {t(`intervalShort.${p.interval}`)}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="button"
            onClick={startCheckout}
            disabled={disabled}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-teal px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CreditCard size={16} />
            )}
            {loading ? t("checkout.redirecting") : t("checkout.start")}
          </button>
          {!stripeConfigured && (
            <p className="text-xs text-muted-foreground">
              {t("checkout.connectStripe")}
            </p>
          )}
        </>
      )}
    </div>
  );
}
