import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { isDbConfigured } from "@/lib/db";
import { Building2 } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Admin" });
  return { title: `${t("clubs")} — EntrenaDojo Admin` };
}

export const dynamic = "force-dynamic";

export default async function AdminClubsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search } = await searchParams;
  const t = await getTranslations("Admin");

  let clubs: {
    id: string;
    name: string;
    slug: string;
    tier: string;
    studentCount: number;
    stripeConnected: boolean;
    stripeOnboarded: boolean;
    hasSubscription: boolean;
    createdAt: string;
  }[] = [];

  if (isDbConfigured()) {
    try {
      const where = search
        ? { name: { contains: search, mode: "insensitive" as const } }
        : {};
      const rows = await prisma.club.findMany({
        where,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          slug: true,
          tier: true,
          stripeAccountId: true,
          stripeOnboarded: true,
          platformSubscriptionId: true,
          createdAt: true,
          _count: { select: { students: true } },
        },
      });
      clubs = rows.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        tier: c.tier,
        studentCount: c._count.students,
        stripeConnected: Boolean(c.stripeAccountId),
        stripeOnboarded: c.stripeOnboarded,
        hasSubscription: Boolean(c.platformSubscriptionId),
        createdAt: c.createdAt.toISOString(),
      }));
    } catch {
      // Empty
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">{t("platformAdmin")}</p>
          <h1 className="text-2xl font-bold text-brand-navy">{t("clubs")}</h1>
        </div>
      </div>

      {/* Search */}
      <form className="flex gap-2" action="" method="GET">
        <input
          type="text"
          name="search"
          defaultValue={search ?? ""}
          placeholder={t("searchClubs")}
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
        />
        <button
          type="submit"
          className="rounded-lg bg-brand-teal px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90"
        >
          {t("search")}
        </button>
      </form>

      {clubs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <Building2 size={40} className="mx-auto mb-3 text-muted-foreground" />
          <h2 className="text-lg font-bold text-brand-navy">{t("noClubsYet")}</h2>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">{t("clubName")}</th>
                <th className="px-4 py-3">{t("clubTier")}</th>
                <th className="px-4 py-3">{t("totalStudents")}</th>
                <th className="px-4 py-3">{t("stripeStatus")}</th>
                <th className="px-4 py-3">{t("subscription")}</th>
                <th className="px-4 py-3">{t("created")}</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {clubs.map((c) => (
                <tr key={c.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/clubs/${c.id}`}
                      className="font-medium text-brand-navy hover:underline"
                    >
                      {c.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{c.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                        c.tier === "PRO"
                          ? "bg-brand-teal/10 text-brand-teal"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {c.tier === "PRO" ? t("pro") : t("free")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.studentCount}</td>
                  <td className="px-4 py-3">
                    {c.stripeOnboarded ? (
                      <span className="text-green-600 text-xs font-medium">{t("connected")}</span>
                    ) : c.stripeConnected ? (
                      <span className="text-amber-600 text-xs font-medium">{t("incomplete")}</span>
                    ) : (
                      <span className="text-gray-400 text-xs">{t("notConnected")}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {c.hasSubscription ? (
                      <span className="text-green-600 text-xs font-medium">{t("active")}</span>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/clubs/${c.id}`}
                      className="text-xs font-medium text-brand-teal hover:underline"
                    >
                      {t("viewDetails")}
                    </Link>
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
