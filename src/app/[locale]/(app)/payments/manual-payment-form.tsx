"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Loader2, Plus, X, Banknote } from "lucide-react";
import { formatMoney } from "@/lib/utils";
import type { PaymentPlanRow, StudentOption } from "@/lib/queries";

const METHODS = ["cash", "bank_transfer", "bizum", "other"] as const;

const controlClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-teal";
const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

/**
 * Collapsible form to record a manual (cash/Bizum/bank transfer) payment.
 * POSTs to /api/payments/manual, then refreshes the page.
 */
export function ManualPaymentForm({
  students,
  plans,
}: {
  students: StudentOption[];
  plans: PaymentPlanRow[];
}) {
  const t = useTranslations("Payments");
  const tc = useTranslations("Common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    studentId: "",
    planId: "",
    amount: "",
    paymentMethod: "cash" as string,
    description: "",
    paidAt: new Date().toISOString().slice(0, 10),
  });

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Auto-fill amount when a plan is selected.
  function handlePlanChange(planId: string) {
    setForm((f) => {
      const plan = plans.find((p) => p.id === planId);
      return {
        ...f,
        planId,
        amount: plan ? String(plan.amount) : f.amount,
      };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/payments/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: form.studentId,
          planId: form.planId || null,
          amount: Number(form.amount),
          paymentMethod: form.paymentMethod,
          description: form.description || null,
          paidAt: form.paidAt
            ? new Date(form.paidAt).toISOString()
            : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("manualPaymentError"));
      setForm({
        studentId: "",
        planId: "",
        amount: "",
        paymentMethod: "cash",
        description: "",
        paidAt: new Date().toISOString().slice(0, 10),
      });
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("manualPaymentError"),
      );
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-brand-teal bg-white px-3 py-1.5 text-sm font-semibold text-brand-teal transition-colors hover:bg-brand-teal/5"
      >
        <Plus size={15} />
        {t("recordPayment")}
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-brand-navy">
          {t("manualPaymentTitle")}
        </p>
        <button
          type="button"
          aria-label={tc("close")}
          onClick={() => setOpen(false)}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted"
        >
          <X size={15} />
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className={labelClass}>{t("checkout.member")}</label>
          <select
            required
            value={form.studentId}
            onChange={(e) => update("studentId", e.target.value)}
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
          <label className={labelClass}>
            {t("checkout.plan")}{" "}
            <span className="text-xs text-muted-foreground">
              ({tc("optional")})
            </span>
          </label>
          <select
            value={form.planId}
            onChange={(e) => handlePlanChange(e.target.value)}
            className={controlClass}
          >
            <option value="">—</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {formatMoney(p.amount, p.currency)}
                {t(`intervalShort.${p.interval}`)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>{t("table.amount")}</label>
            <input
              type="number"
              min={0}
              step="0.01"
              required
              placeholder="50.00"
              value={form.amount}
              onChange={(e) => update("amount", e.target.value)}
              className={controlClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t("paymentMethodLabel")}</label>
            <select
              value={form.paymentMethod}
              onChange={(e) => update("paymentMethod", e.target.value)}
              className={controlClass}
            >
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {t(`method.${m}`)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>{t("table.date")}</label>
            <input
              type="date"
              value={form.paidAt}
              onChange={(e) => update("paidAt", e.target.value)}
              className={controlClass}
            />
          </div>
          <div>
            <label className={labelClass}>
              {t("form.description")}{" "}
              <span className="text-xs text-muted-foreground">
                ({tc("optional")})
              </span>
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder={tc("optional")}
              className={controlClass}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !form.studentId || !form.amount}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-teal px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Banknote size={16} />
          )}
          {loading ? tc("saving") : t("recordPayment")}
        </button>
      </form>
    </div>
  );
}
