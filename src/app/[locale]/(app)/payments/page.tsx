import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  CheckCircle2,
  CreditCard,
  TrendingUp,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import type { MembershipStatus, PaymentStatus } from "@prisma/client";
import {
  getCurrentClub,
  getPaymentDashboard,
  getStudentOptions,
} from "@/lib/queries";
import { isDbConfigured } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/utils";
import { NewPlanForm } from "./new-plan-form";
import { CheckoutPanel } from "./checkout-panel";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Payments" });
  return { title: `${t("title")} — DojoTrack` };
}

export const dynamic = "force-dynamic";

const MEMBER_STATUS: Record<MembershipStatus, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  TRIALING: "bg-blue-100 text-blue-800",
  PAST_DUE: "bg-red-100 text-red-800",
  CANCELLED: "bg-slate-100 text-slate-600",
  INCOMPLETE: "bg-amber-100 text-amber-800",
};

const PAYMENT_STATUS: Record<PaymentStatus, string> = {
  PAID: "bg-green-100 text-green-800",
  PENDING: "bg-amber-100 text-amber-800",
  FAILED: "bg-red-100 text-red-800",
  REFUNDED: "bg-slate-100 text-slate-600",
};

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const t = await getTranslations("Payments");
  const club = isDbConfigured() ? await getCurrentClub() : null;
  const data = club
    ? await getPaymentDashboard(club.id)
    : null;
  const students = club ? await getStudentOptions(club.id) : [];
  const activePlans = data?.plans.filter((p) => p.active) ?? [];
  const currency = data?.currency ?? "usd";

  const metrics = [
    {
      label: t("metrics.monthlyRevenue"),
      value: data ? formatMoney(data.monthlyRevenue, currency) : "—",
      hint: t("metrics.monthlyRevenueHint"),
      icon: TrendingUp,
    },
    {
      label: t("metrics.totalCollected"),
      value: data ? formatMoney(data.totalCollected, currency) : "—",
      hint: t("metrics.totalCollectedHint"),
      icon: Wallet,
    },
    {
      label: t("metrics.activeMembers"),
      value: data ? String(data.activeMembers) : "—",
      hint: t("metrics.activeMembersHint"),
      icon: Users,
    },
    {
      label: t("metrics.pastDue"),
      value: data ? String(data.pastDueCount) : "—",
      hint: t("metrics.pastDueHint"),
      icon: CreditCard,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">{t("eyebrow")}</p>
          <h1 className="text-2xl font-bold text-brand-navy">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
      </div>

      {status === "success" && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          <CheckCircle2 size={16} />
          {t("checkoutSuccess")}
        </div>
      )}
      {status === "cancelled" && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <XCircle size={16} />
          {t("checkoutCancelled")}
        </div>
      )}

      {!club ? (
        <NotConfigured />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map(({ label, value, hint, icon: Icon }) => (
              <div
                key={label}
                className="rounded-xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    {label}
                  </span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-teal/10 text-brand-teal">
                    <Icon size={18} />
                  </span>
                </div>
                <p className="mt-3 text-3xl font-bold tracking-tight text-brand-navy">
                  {value}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
              </div>
            ))}
          </div>

          {!data?.stripeConfigured && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              {t.rich("stripeNotConfigured", {
                code: (chunks) => (
                  <code className="rounded bg-amber-100 px-1">{chunks}</code>
                ),
              })}
            </div>
          )}

          <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-brand-navy">
                  {t("plansHeading")}
                </h2>
                <NewPlanForm />
              </div>
              {activePlans.length === 0 && (data?.plans.length ?? 0) === 0 ? (
                <p className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
                  {t("plansEmpty")}
                </p>
              ) : (
                <ul className="space-y-2">
                  {(data?.plans ?? []).map((plan) => {
                    return (
                      <li
                        key={plan.id}
                        className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-teal/10 text-brand-teal">
                          <CreditCard size={18} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-brand-navy">
                            {plan.name}
                            {!plan.active && (
                              <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[0.65rem] font-semibold text-slate-600">
                                {t("inactive")}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t("memberCount", { count: plan.activeMembers })}
                            {plan.description ? ` · ${plan.description}` : ""}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-bold text-brand-navy">
                            {formatMoney(plan.amount, plan.currency)}
                            <span className="text-xs font-normal text-muted-foreground">
                              {t(`intervalShort.${plan.interval}`)}
                            </span>
                          </p>
                          <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                            {t(`interval.${plan.interval}`)}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-bold text-brand-navy">
                {t("chargeMember")}
              </h2>
              <CheckoutPanel
                students={students}
                plans={activePlans}
                stripeConfigured={data?.stripeConfigured ?? false}
              />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-brand-navy">
              {t("membersHeading")}
            </h2>
            {(data?.members.length ?? 0) === 0 ? (
              <p className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
                {t("membersEmpty")}
              </p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-4 py-3 font-semibold">
                        {t("table.member")}
                      </th>
                      <th className="px-4 py-3 font-semibold">
                        {t("table.plan")}
                      </th>
                      <th className="px-4 py-3 font-semibold">
                        {t("table.status")}
                      </th>
                      <th className="px-4 py-3 font-semibold">
                        {t("table.renews")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.members ?? []).map((m) => {
                      return (
                        <tr
                          key={m.membershipId}
                          className="border-b border-border last:border-0 hover:bg-muted/20"
                        >
                          <td className="px-4 py-3 font-medium text-brand-navy">
                            {m.studentName}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {m.planName}{" "}
                            <span className="text-xs">
                              ({formatMoney(m.amount, currency)}
                              {t(`intervalShort.${m.interval}`)})
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${MEMBER_STATUS[m.status]}`}
                            >
                              {t(`membershipStatus.${m.status}`)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {m.currentPeriodEnd
                              ? formatDate(m.currentPeriodEnd)
                              : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-brand-navy">
              {t("recentPaymentsHeading")}
            </h2>
            {(data?.recentPayments.length ?? 0) === 0 ? (
              <p className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
                {t("paymentsEmpty")}
              </p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-4 py-3 font-semibold">
                        {t("table.date")}
                      </th>
                      <th className="px-4 py-3 font-semibold">
                        {t("table.member")}
                      </th>
                      <th className="px-4 py-3 font-semibold">
                        {t("table.for")}
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
                    {(data?.recentPayments ?? []).map((p) => {
                      return (
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
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${PAYMENT_STATUS[p.status]}`}
                            >
                              {t(`paymentStatus.${p.status}`)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-brand-navy">
                            {formatMoney(p.amount, p.currency)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

async function NotConfigured() {
  const t = await getTranslations("Payments");
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
      <div className="mx-auto mb-3 text-4xl">💳</div>
      <h2 className="text-lg font-bold text-brand-navy">
        {t("notAvailableTitle")}
      </h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        {t("notAvailableBody")}
      </p>
    </div>
  );
}
