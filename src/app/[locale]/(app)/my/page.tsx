import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { redirect } from "next/navigation";
import {
  Award,
  CreditCard,
  QrCode,
  User,
} from "lucide-react";
import { getAuthContext } from "@/lib/auth-context";
import { getMyStudentProfile } from "@/lib/queries";
import { isDbConfigured } from "@/lib/db";
import { isStripeConfigured } from "@/lib/stripe";
import { disciplineMeta } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { BeltBadge } from "@/components/belt-badge";
import { PlanCard } from "./plan-card";
import type { BillingInterval } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "MyProfile" });
  return { title: `${t("myProfile")} — EntrenaDojo` };
}

export const dynamic = "force-dynamic";

interface ActivePlan {
  id: string;
  name: string;
  description: string | null;
  amount: number;
  currency: string;
  interval: BillingInterval;
}

export default async function MyProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const t = await getTranslations("MyProfile");
  const tp = await getTranslations("Payments");
  const ts = await getTranslations("Students");

  const ctx = await getAuthContext();
  if (!ctx) {
    redirect("/login");
  }

  if (!isDbConfigured()) return <NotConfigured />;

  const profile = await getMyStudentProfile(ctx.user.id, ctx.club.id);
  if (!profile) {
    return <NoStudentProfile />;
  }

  // Fetch active plans for the club so the student can subscribe.
  let activePlans: ActivePlan[] = [];
  try {
    const plans = await prisma.paymentPlan.findMany({
      where: { clubId: ctx.club.id, active: true },
      orderBy: { createdAt: "asc" },
    });
    activePlans = plans.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      amount: Number(p.amount),
      currency: p.currency,
      interval: p.interval,
    }));
  } catch {
    // fall through — empty plans list
  }

  const stripeReady = isStripeConfigured();
  const resolvedParams = await searchParams;
  const activeMembership = profile.memberships.find(
    (m) => m.status === "ACTIVE" || m.status === "TRIALING",
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Checkout feedback */}
      {resolvedParams.status === "success" && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800">
          {tp("checkoutSuccess")}
        </div>
      )}
      {resolvedParams.status === "cancelled" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
          {tp("checkoutCancelled")}
        </div>
      )}

      {/* Profile card */}
      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-teal/10 text-brand-teal">
              <User size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-brand-navy">
                {profile.fullName}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <BeltBadge name={profile.beltName} color={profile.beltColor} />
                <span>
                  {t("memberSince", { date: formatDate(profile.joinDate) })}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {profile.clubName}
              </p>
            </div>
          </div>
          <Link
            href={`/students/${profile.id}/belt`}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-teal px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90"
          >
            <Award size={16} />
            {t("viewBeltProgress")}
          </Link>
        </div>
      </section>

      {/* Membership status */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-brand-navy">
          {t("myMembership")}
        </h2>
        {activeMembership ? (
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("activeMembership")}
                </p>
                <p className="mt-1 text-lg font-bold text-brand-navy">
                  {activeMembership.planName}
                </p>
              </div>
              <StatusBadge
                status={activeMembership.status}
                label={tp(`membershipStatus.${activeMembership.status}`)}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>
                {new Intl.NumberFormat(undefined, {
                  style: "currency",
                  currency: activeMembership.currency,
                }).format(activeMembership.amount)}
                {tp(`intervalShort.${activeMembership.interval}`)}
              </span>
              {activeMembership.currentPeriodEnd && (
                <span>
                  {t("nextBilling")}:{" "}
                  {formatDate(activeMembership.currentPeriodEnd)}
                </span>
              )}
              {activeMembership.cancelAtPeriodEnd && (
                <span className="text-amber-600">{t("cancelAtEnd")}</span>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
            <CreditCard
              size={32}
              className="mx-auto mb-2 text-muted-foreground"
            />
            <p className="text-sm font-medium text-brand-navy">
              {t("noMembership")}
            </p>
          </div>
        )}
      </section>

      {/* Available plans */}
      {activePlans.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-brand-navy">
            {t("availablePlans")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activePlans.map((plan) => (
              <PlanCard
                key={plan.id}
                planId={plan.id}
                name={plan.name}
                description={plan.description}
                amount={plan.amount}
                currency={plan.currency}
                interval={plan.interval}
                stripeReady={stripeReady}
              />
            ))}
          </div>
        </section>
      )}

      {/* Recent attendance */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-brand-navy">
          {t("recentAttendance")}
        </h2>
        {profile.recentAttendance.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            {t("noAttendance")}
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">{ts("colClass")}</th>
                  <th className="px-4 py-3 font-semibold">{ts("colDate")}</th>
                  <th className="px-4 py-3 font-semibold">{ts("colMethod")}</th>
                </tr>
              </thead>
              <tbody>
                {profile.recentAttendance.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b border-border last:border-0 hover:bg-muted/20"
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-brand-navy">
                        {a.className}
                      </span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {disciplineMeta(a.discipline).emoji}{" "}
                        {disciplineMeta(a.discipline).label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(a.date)}
                    </td>
                    <td className="px-4 py-3">
                      {a.method === "QR_SCAN" ? (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <QrCode size={13} /> {ts("methodSelfCheckIn")}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {ts("methodManual")}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatusBadge({ status, label }: { status: string; label: string }) {
  const colors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800",
    TRIALING: "bg-blue-100 text-blue-800",
    PAST_DUE: "bg-amber-100 text-amber-800",
    INCOMPLETE: "bg-gray-100 text-gray-600",
    CANCELLED: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors[status] ?? "bg-gray-100 text-gray-600"}`}
    >
      {label}
    </span>
  );
}

async function NotConfigured() {
  const t = await getTranslations("MyProfile");
  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
        <div className="mx-auto mb-3 text-4xl">🥋</div>
        <h2 className="text-lg font-bold text-brand-navy">
          {t("myProfile")}
        </h2>
      </div>
    </div>
  );
}

async function NoStudentProfile() {
  const t = await getTranslations("MyProfile");
  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
        <div className="mx-auto mb-3 text-4xl">🥋</div>
        <h2 className="text-lg font-bold text-brand-navy">
          {t("myProfile")}
        </h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          {t("noMembership")}
        </p>
      </div>
    </div>
  );
}
