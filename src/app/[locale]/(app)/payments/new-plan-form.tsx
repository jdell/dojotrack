"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Loader2, Plus, X } from "lucide-react";
import type { BillingInterval } from "@prisma/client";
import { BILLING_INTERVAL_LABELS } from "@/lib/constants";

const INTERVALS: BillingInterval[] = [
  "MONTHLY",
  "QUARTERLY",
  "ANNUAL",
  "ONE_TIME",
];

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-teal";
const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

/** Collapsible create-plan form. POSTs to /api/payment-plans, then refreshes. */
export function NewPlanForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    amount: "",
    interval: "MONTHLY" as BillingInterval,
    description: "",
  });

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/payment-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          amount: Number(form.amount),
          interval: form.interval,
          description: form.description || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create the plan.");
      setForm({ name: "", amount: "", interval: "MONTHLY", description: "" });
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the plan.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-teal px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90"
      >
        <Plus size={15} />
        Add plan
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-teal/80 px-3 py-1.5 text-sm font-semibold text-white"
      >
        <Plus size={15} />
        Add plan
      </button>
      <form
        onSubmit={handleSubmit}
        className="absolute right-0 z-10 mt-2 w-80 space-y-3 rounded-xl border border-border bg-card p-4 shadow-lg"
      >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-brand-navy">New plan</p>
        <button
          type="button"
          aria-label="Close"
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
      <div>
        <label className={labelClass}>Plan name</label>
        <input
          type="text"
          required
          placeholder="Adults Unlimited"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          className={inputClass}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Price</label>
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
          <label className={labelClass}>Billing</label>
          <select
            value={form.interval}
            onChange={(e) => update("interval", e.target.value)}
            className={`${inputClass} bg-white`}
          >
            {INTERVALS.map((i) => (
              <option key={i} value={i}>
                {BILLING_INTERVAL_LABELS[i].label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className={labelClass}>Description</label>
        <input
          type="text"
          placeholder="Optional"
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          className={inputClass}
        />
      </div>
      <button
        type="submit"
        disabled={loading || !form.name.trim() || !form.amount}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-teal px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90 disabled:opacity-50"
      >
        {loading && <Loader2 size={15} className="animate-spin" />}
        {loading ? "Saving…" : "Create plan"}
      </button>
      </form>
    </div>
  );
}
