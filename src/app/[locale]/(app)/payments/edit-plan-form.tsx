"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Loader2, X } from "lucide-react";
import type { BillingInterval } from "@prisma/client";

const INTERVALS: BillingInterval[] = [
  "MONTHLY",
  "QUARTERLY",
  "ANNUAL",
  "ONE_TIME",
];

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-teal";
const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

interface EditPlanFormProps {
  plan: {
    id: string;
    name: string;
    amount: string | number;
    currency: string;
    interval: BillingInterval;
    description: string | null;
    active: boolean;
  };
  onClose: () => void;
}

/** Inline edit form for an existing plan. PATCHes to /api/payment-plans/[id], then refreshes. */
export function EditPlanForm({ plan, onClose }: EditPlanFormProps) {
  const t = useTranslations("Payments");
  const tc = useTranslations("Common");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: plan.name,
    amount: String(Number(plan.amount)),
    interval: plan.interval,
    description: plan.description ?? "",
    active: plan.active,
  });

  function update<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/payment-plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          amount: Number(form.amount),
          interval: form.interval,
          description: form.description || null,
          active: form.active,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("form.updateError"));
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("form.updateError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="absolute right-0 z-10 mt-2 w-80 space-y-3 rounded-xl border border-border bg-card p-4 shadow-lg"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-brand-navy">{t("editPlan")}</p>
        <button
          type="button"
          aria-label={tc("close")}
          onClick={onClose}
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
      <div>
        <label className={labelClass}>{t("form.planName")}</label>
        <input
          type="text"
          required
          placeholder={t("form.planNamePlaceholder")}
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          className={inputClass}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>{t("form.price")}</label>
          <input
            type="number"
            min={0}
            step="0.01"
            required
            placeholder="49.00"
            value={form.amount}
            onChange={(e) => update("amount", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>{t("form.billing")}</label>
          <select
            value={form.interval}
            onChange={(e) => update("interval", e.target.value as BillingInterval)}
            className={`${inputClass} bg-white`}
          >
            {INTERVALS.map((i) => (
              <option key={i} value={i}>
                {t(`interval.${i}`)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className={labelClass}>{t("form.description")}</label>
        <input
          type="text"
          placeholder={tc("optional")}
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          className={inputClass}
        />
      </div>
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-slate-700">
          {t("status")}
        </label>
        <button
          type="button"
          role="switch"
          aria-checked={form.active}
          onClick={() => update("active", !form.active)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
            form.active ? "bg-brand-teal" : "bg-slate-300"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
              form.active ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
        <span className="text-xs text-muted-foreground">
          {form.active ? t("planActive") : t("planInactive")}
        </span>
      </div>
      <button
        type="submit"
        disabled={loading || !form.name.trim() || !form.amount}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-teal px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90 disabled:opacity-50"
      >
        {loading && <Loader2 size={15} className="animate-spin" />}
        {loading ? tc("saving") : t("updatePlan")}
      </button>
    </form>
  );
}
