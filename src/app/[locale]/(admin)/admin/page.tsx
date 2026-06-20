import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { isDbConfigured } from "@/lib/db";
import {
  Building2,
  CreditCard,
  DollarSign,
  TrendingUp,
  Users,
  AlertTriangle,
} from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Admin" });
  return { title: `${t("adminDashboard")} — EntrenaDojo` };
}

export const dynamic = "force-dynamic";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  hint?: string;
}

function StatCard({ label, value, icon: Icon, hint }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold text-brand-navy">{value}</p>
          {hint && (
            <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
        <div className="rounded-lg bg-brand-teal/10 p-2">
          <Icon size={20} className="text-brand-teal" />
        </div>
      </div>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const t = await getTranslations("Admin");

  let stats = {
    totalClubs: 0,
    totalStudents: 0,
    proClubs: 0,
    platformRevenue: 0,
    recentClubs: [] as {
      id: string;
      name: string;
      slug: string;
      tier: string;
      studentCount: number;
      createdAt: string;
    }[],
    pastDueClubs: [] as {
      id: string;
      name: string;
      slug: string;
      platformCurrentPeriodEnd: string | null;
    }[],
  };

  if (isDbConfigured()) {
    try {
      const now = new Date();
      const [totalClubs, totalStudents, proClubs, recentClubs, pastDueClubs] =
        await Promise.all([
          prisma.club.count(),
          prisma.student.count({ where: { active: true } }),
          prisma.club.count({ where: { tier: "PRO" } }),
          prisma.club.findMany({
            orderBy: { createdAt: "desc" },
            take: 10,
            select: {
              id: true,
              name: true,
              slug: true,
              tier: true,
              createdAt: true,
              _count: { select: { students: true } },
            },
          }),
          prisma.club.findMany({
            where: {
              tier: "PRO",
              platformCurrentPeriodEnd: { lt: now },
              platformSubscriptionId: { not: null },
            },
            select: {
              id: true,
              name: true,
              slug: true,
              platformCurrentPeriodEnd: true,
            },
          }),
        ]);

      stats = {
        totalClubs,
        totalStudents,
        proClubs,
        platformRevenue: proClubs * 29,
        recentClubs: recentClubs.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          tier: c.tier,
          studentCount: c._count.students,
          createdAt: c.createdAt.toISOString(),
        })),
        pastDueClubs: pastDueClubs.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          platformCurrentPeriodEnd:
            c.platformCurrentPeriodEnd?.toISOString() ?? null,
        })),
      };
    } catch {
      // Fall through with empty stats.
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <p className="eyebrow">{t("platformAdmin")}</p>
        <h1 className="text-2xl font-bold text-brand-navy">
          {t("adminDashboard")}
        </h1>
      </div>

      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("totalClubs")}
          value={stats.totalClubs}
          icon={Building2}
        />
        <StatCard
          label={t("totalStudents")}
          value={stats.totalStudents}
          icon={Users}
        />
        <StatCard
          label={t("platformRevenue")}
          value={`$${stats.platformRevenue}/mo`}
          icon={DollarSign}
          hint={`${stats.proClubs} ${t("activeSubscriptions")}`}
        />
        <StatCard
          label={t("activeSubscriptions")}
          value={stats.proClubs}
          icon={TrendingUp}
        />
      </div>

      {/* Past-due clubs */}
      {stats.pastDueClubs.length > 0 && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-amber-600" />
            <h2 className="text-sm font-bold uppercase tracking-wide text-amber-800">
              {t("pastDueSubscriptions")}
            </h2>
          </div>
          <ul className="space-y-2">
            {stats.pastDueClubs.map((c) => (
              <li key={c.id} className="flex items-center justify-between">
                <Link
                  href={`/admin/clubs/${c.id}`}
                  className="text-sm font-medium text-amber-900 hover:underline"
                >
                  {c.name}
                </Link>
                {c.platformCurrentPeriodEnd && (
                  <span className="text-xs text-amber-700">
                    {t("expired")}{" "}
                    {new Date(c.platformCurrentPeriodEnd).toLocaleDateString()}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Recent club signups */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-brand-navy">
            {t("recentSignups")}
          </h2>
          <Link
            href="/admin/clubs"
            className="text-xs font-medium text-brand-teal hover:underline"
          >
            {t("viewAllClubs")}
          </Link>
        </div>

        {stats.recentClubs.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noClubsYet")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 pr-4">{t("clubName")}</th>
                  <th className="pb-2 pr-4">{t("clubTier")}</th>
                  <th className="pb-2 pr-4">{t("totalStudents")}</th>
                  <th className="pb-2">{t("created")}</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentClubs.map((c) => (
                  <tr key={c.id} className="border-b border-border/50 last:border-0">
                    <td className="py-2.5 pr-4">
                      <Link
                        href={`/admin/clubs/${c.id}`}
                        className="font-medium text-brand-navy hover:underline"
                      >
                        {c.name}
                      </Link>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
                          c.tier === "PRO"
                            ? "bg-brand-teal/10 text-brand-teal"
                            : "bg-gray-100 text-gray-600",
                        )}
                      >
                        {c.tier === "PRO" ? t("pro") : t("free")}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-muted-foreground">
                      {c.studentCount}
                    </td>
                    <td className="py-2.5 text-muted-foreground">
                      {new Date(c.createdAt).toLocaleDateString()}
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

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}
