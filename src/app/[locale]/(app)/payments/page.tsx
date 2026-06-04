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
import { BILLING_INTERVAL_LABELS } from "@/lib/constants";
import { formatDate, formatMoney } from "@/lib/utils";
import { NewPlanForm } from "./new-plan-form";
import { CheckoutPanel } from "./checkout-panel";

export const metadata: Metadata = { title: "Payments — DojoTrack" };

export const dynamic = "force-dynamic";

const MEMBER_STATUS: Record<
  MembershipStatus,
  { label: string; className: string }
> = {
  ACTIVE: { label: "Active", className: "bg-green-100 text-green-800" },
  TRIALING: { label: "Trialing", className: "bg-blue-100 text-blue-800" },
  PAST_DUE: { label: "Past due", className: "bg-red-100 text-red-800" },
  CANCELLED: { label: "Cancelled", className: "bg-slate-100 text-slate-600" },
  INCOMPLETE: { label: "Incomplete", className: "bg-amber-100 text-amber-800" },
};

const PAYMENT_STATUS: Record<
  PaymentStatus,
  { label: string; className: string }
> = {
  PAID: { label: "Paid", className: "bg-green-100 text-green-800" },
  PENDING: { label: "Pending", className: "bg-amber-100 text-amber-800" },
  FAILED: { label: "Failed", className: "bg-red-100 text-red-800" },
  REFUNDED: { label: "Refunded", className: "bg-slate-100 text-slate-600" },
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
      label: "Monthly revenue",
      value: data ? formatMoney(data.monthlyRevenue, currency) : "—",
      hint: "Collected this month",
      icon: TrendingUp,
    },
    {
      label: "Total collected",
      value: data ? formatMoney(data.totalCollected, currency) : "—",
      hint: "All time",
      icon: Wallet,
    },
    {
      label: "Active members",
      value: data ? String(data.activeMembers) : "—",
      hint: "On a paid plan",
      icon: Users,
    },
    {
      label: "Past due",
      value: data ? String(data.pastDueCount) : "—",
      hint: "Need attention",
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
            Membership plans, member billing, and revenue at a glance.
          </p>
        </div>
      </div>

      {status === "success" && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          <CheckCircle2 size={16} />
          Checkout complete — the payment will appear once Stripe confirms it.
        </div>
      )}
      {status === "cancelled" && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <XCircle size={16} />
          Checkout cancelled. No charge was made.
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
              Stripe isn&apos;t configured yet. Add{" "}
              <code className="rounded bg-amber-100 px-1">STRIPE_SECRET_KEY</code>{" "}
              to enable live checkout. You can still set up plans below.
            </div>
          )}

          <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-brand-navy">Plans</h2>
                <NewPlanForm />
              </div>
              {activePlans.length === 0 && (data?.plans.length ?? 0) === 0 ? (
                <p className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
                  No plans yet. Add a membership plan to start billing members.
                </p>
              ) : (
                <ul className="space-y-2">
                  {(data?.plans ?? []).map((plan) => {
                    const interval = BILLING_INTERVAL_LABELS[plan.interval];
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
                                Inactive
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {plan.activeMembers}{" "}
                            {plan.activeMembers === 1 ? "member" : "members"}
                            {plan.description ? ` · ${plan.description}` : ""}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-bold text-brand-navy">
                            {formatMoney(plan.amount, plan.currency)}
                            <span className="text-xs font-normal text-muted-foreground">
                              {interval.short}
                            </span>
                          </p>
                          <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                            {interval.label}
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
                Charge a member
              </h2>
              <CheckoutPanel
                students={students}
                plans={activePlans}
                stripeConfigured={data?.stripeConfigured ?? false}
              />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-brand-navy">Members</h2>
            {(data?.members.length ?? 0) === 0 ? (
              <p className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
                No members on a plan yet. Charge a member to start a
                subscription.
              </p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-4 py-3 font-semibold">Member</th>
                      <th className="px-4 py-3 font-semibold">Plan</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Renews</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.members ?? []).map((m) => {
                      const meta = MEMBER_STATUS[m.status];
                      const interval = BILLING_INTERVAL_LABELS[m.interval];
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
                              {interval.short})
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.className}`}
                            >
                              {meta.label}
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
              Recent payments
            </h2>
            {(data?.recentPayments.length ?? 0) === 0 ? (
              <p className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
                No payments recorded yet.
              </p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-4 py-3 font-semibold">Date</th>
                      <th className="px-4 py-3 font-semibold">Member</th>
                      <th className="px-4 py-3 font-semibold">For</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 text-right font-semibold">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.recentPayments ?? []).map((p) => {
                      const meta = PAYMENT_STATUS[p.status];
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
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.className}`}
                            >
                              {meta.label}
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

function NotConfigured() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
      <div className="mx-auto mb-3 text-4xl">💳</div>
      <h2 className="text-lg font-bold text-brand-navy">
        Payments aren&apos;t available yet
      </h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        Connect a database (and Stripe) to set up plans and bill members.
      </p>
    </div>
  );
}
