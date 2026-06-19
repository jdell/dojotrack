"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Banknote, CreditCard, Search } from "lucide-react";
import type { PaymentStatus } from "@prisma/client";
import { formatDate, formatMoney } from "@/lib/utils";

interface PaymentRowData {
  id: string;
  studentName: string | null;
  planName: string | null;
  description: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: string | null;
  recordedByName: string | null;
  paidAt: string | null;
  createdAt: string;
}

const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  PAID: "bg-green-100 text-green-800",
  PENDING: "bg-amber-100 text-amber-800",
  FAILED: "bg-red-100 text-red-800",
  REFUNDED: "bg-slate-100 text-slate-600",
};

const STATUS_OPTIONS: ("ALL" | PaymentStatus)[] = [
  "ALL",
  "PAID",
  "PENDING",
  "FAILED",
  "REFUNDED",
];
const METHOD_OPTIONS = [
  "ALL",
  "stripe",
  "cash",
  "bizum",
  "bank_transfer",
  "other",
] as const;

interface PaymentsTableProps {
  payments: PaymentRowData[];
  currency: string;
}

export function PaymentsTable({ payments, currency }: PaymentsTableProps) {
  const t = useTranslations("Payments");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | PaymentStatus>(
    "ALL",
  );
  const [methodFilter, setMethodFilter] = useState<string>("ALL");

  const filtered = useMemo(() => {
    let result = payments;
    const q = query.trim().toLowerCase();
    if (q)
      result = result.filter(
        (p) => p.studentName?.toLowerCase().includes(q) ?? false,
      );
    if (statusFilter !== "ALL")
      result = result.filter((p) => p.status === statusFilter);
    if (methodFilter !== "ALL")
      result = result.filter((p) => p.paymentMethod === methodFilter);
    return result;
  }, [payments, query, statusFilter, methodFilter]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPayments")}
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-teal"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "ALL" | PaymentStatus)
          }
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-teal"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt === "ALL"
                ? `${t("filterStatus")}: ${t("filterAll")}`
                : t(`paymentStatus.${opt}`)}
            </option>
          ))}
        </select>
        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-teal"
        >
          {METHOD_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt === "ALL"
                ? `${t("filterMethod")}: ${t("filterAll")}`
                : t(`method.${opt}`)}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
          {t("paymentsEmpty")}
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-semibold">{t("table.date")}</th>
                <th className="px-4 py-3 font-semibold">
                  {t("table.member")}
                </th>
                <th className="px-4 py-3 font-semibold">{t("table.for")}</th>
                <th className="px-4 py-3 font-semibold">
                  {t("table.method")}
                </th>
                <th className="px-4 py-3 font-semibold">
                  {t("table.status")}
                </th>
                <th className="px-4 py-3 text-right font-semibold">
                  {t("table.amount")}
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-border last:border-0 hover:bg-muted/20"
                >
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(p.paidAt ?? p.createdAt)}
                  </td>
                  <td className="px-4 py-3 font-medium text-brand-navy">
                    {p.studentName ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {p.planName ?? p.description ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {p.paymentMethod ? (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        {p.paymentMethod === "stripe" ? (
                          <CreditCard size={12} />
                        ) : (
                          <Banknote size={12} />
                        )}
                        {t(`method.${p.paymentMethod}`)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${PAYMENT_STATUS_STYLES[p.status]}`}
                    >
                      {t(`paymentStatus.${p.status}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-brand-navy">
                    {formatMoney(p.amount, p.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
