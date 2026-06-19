"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  CheckCircle2,
  CreditCard,
  Loader2,
  XCircle,
} from "lucide-react";
import { formatMoney } from "@/lib/utils";
import type { PublicPaymentPlan } from "@/lib/queries";

const controlClass =
  "w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-teal";
const labelClass = "mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300";

interface PayFormProps {
  club: { name: string; slug: string };
  plans: PublicPaymentPlan[];
  preselectedPlanId: string | null;
  status: string | null;
}

export function PayForm({ club, plans, preselectedPlanId, status }: PayFormProps) {
  const t = useTranslations("Pay");
  const tPayments = useTranslations("Payments");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(
    preselectedPlanId ?? (plans.length === 1 ? plans[0].id : null),
  );
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) ?? null;

  // Success state
  if (status === "success") {
    return (
      <div className="rounded-2xl border border-green-200 dark:border-green-900 bg-white dark:bg-slate-900 p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
          <CheckCircle2 size={32} className="text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-brand-navy">
          {t("paySuccess")}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
          {t("paySuccessDetail", { club: club.name })}
        </p>
      </div>
    );
  }

  // Cancelled state
  if (status === "cancelled") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 p-3 text-sm text-amber-800 dark:text-amber-200">
          <XCircle size={16} />
          {t("payCancelled")}
        </div>
        {/* Re-render the form so the user can try again */}
        <PayFormInner
          club={club}
          plans={plans}
          selectedPlanId={selectedPlanId}
          setSelectedPlanId={setSelectedPlanId}
          selectedPlan={selectedPlan}
          studentName={studentName}
          setStudentName={setStudentName}
          studentEmail={studentEmail}
          setStudentEmail={setStudentEmail}
          loading={loading}
          setLoading={setLoading}
          error={error}
          setError={setError}
          t={t}
          tPayments={tPayments}
        />
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center">
        <div className="mb-3 text-4xl">💳</div>
        <h2 className="text-lg font-bold text-brand-navy">
          {t("noPlansTitle")}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
          {t("noPlansBody", { club: club.name })}
        </p>
      </div>
    );
  }

  return (
    <PayFormInner
      club={club}
      plans={plans}
      selectedPlanId={selectedPlanId}
      setSelectedPlanId={setSelectedPlanId}
      selectedPlan={selectedPlan}
      studentName={studentName}
      setStudentName={setStudentName}
      studentEmail={studentEmail}
      setStudentEmail={setStudentEmail}
      loading={loading}
      setLoading={setLoading}
      error={error}
      setError={setError}
      t={t}
      tPayments={tPayments}
    />
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function PayFormInner({
  club,
  plans,
  selectedPlanId,
  setSelectedPlanId,
  selectedPlan,
  studentName,
  setStudentName,
  studentEmail,
  setStudentEmail,
  loading,
  setLoading,
  error,
  setError,
  t,
  tPayments,
}: {
  club: { name: string; slug: string };
  plans: PublicPaymentPlan[];
  selectedPlanId: string | null;
  setSelectedPlanId: (id: string | null) => void;
  selectedPlan: PublicPaymentPlan | null;
  studentName: string;
  setStudentName: (v: string) => void;
  studentEmail: string;
  setStudentEmail: (v: string) => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
  error: string;
  setError: (v: string) => void;
  t: any;
  tPayments: any;
}) {
  const disabled = !selectedPlanId || !studentName.trim() || loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (disabled) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clubSlug: club.slug,
          planId: selectedPlanId,
          studentName: studentName.trim(),
          studentEmail: studentEmail.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? t("payError"));
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("payError"));
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Plan selection */}
      {plans.length > 1 && !selectedPlanId && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-brand-navy">
            {t("selectPlan")}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {plans.map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlanId(plan.id)}
                className="flex flex-col gap-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 text-left transition-all hover:border-brand-teal hover:shadow-md"
              >
                <span className="font-semibold text-brand-navy">
                  {plan.name}
                </span>
                {plan.description && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {plan.description}
                  </span>
                )}
                <span className="mt-2 text-xl font-bold text-brand-teal">
                  {formatMoney(plan.amount, plan.currency)}
                  <span className="text-sm font-normal text-slate-400">
                    {tPayments(`intervalShort.${plan.interval}`)}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected plan + form */}
      {(selectedPlanId || plans.length === 1) && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Plan card */}
          {selectedPlan && (
            <div className="flex items-center gap-4 rounded-xl border border-brand-teal/30 bg-brand-teal/5 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-teal/10 text-brand-teal">
                <CreditCard size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-brand-navy">
                  {selectedPlan.name}
                </p>
                {selectedPlan.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedPlan.description}
                  </p>
                )}
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xl font-bold text-brand-teal">
                  {formatMoney(selectedPlan.amount, selectedPlan.currency)}
                </p>
                <p className="text-xs text-slate-400">
                  {tPayments(`interval.${selectedPlan.interval}`)}
                </p>
              </div>
              {plans.length > 1 && (
                <button
                  type="button"
                  onClick={() => setSelectedPlanId(null)}
                  className="shrink-0 text-xs text-slate-400 hover:text-brand-navy"
                >
                  {t("changePlan")}
                </button>
              )}
            </div>
          )}

          {/* Student details */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
            <div>
              <label htmlFor="studentName" className={labelClass}>
                {t("yourName")} *
              </label>
              <input
                id="studentName"
                type="text"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder={t("yourNamePlaceholder")}
                className={controlClass}
              />
            </div>
            <div>
              <label htmlFor="studentEmail" className={labelClass}>
                {t("yourEmail")}{" "}
                <span className="text-xs font-normal text-slate-400">
                  ({t("optional")})
                </span>
              </label>
              <input
                id="studentEmail"
                type="email"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                placeholder={t("yourEmailPlaceholder")}
                className={controlClass}
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={disabled}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-teal px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CreditCard size={16} />
            )}
            {loading ? t("redirecting") : t("payNow")}
          </button>
        </form>
      )}
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */
