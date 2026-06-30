import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { isDbConfigured } from "@/lib/db";
import { ArrowLeft, Building2 } from "lucide-react";
import { TierSwitcher } from "./tier-switcher";
import { ImpersonateButton } from "./impersonate-button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "Admin" });
  if (!isDbConfigured()) return { title: `${t("clubs")} — EntrenaDojo Admin` };
  const club = await prisma.club.findUnique({
    where: { id },
    select: { name: true },
  });
  return {
    title: `${club?.name ?? t("clubs")} — EntrenaDojo Admin`,
  };
}

export const dynamic = "force-dynamic";

export default async function AdminClubDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("Admin");

  if (!isDbConfigured()) return notFound();

  const club = await prisma.club.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          students: true,
          paymentPlans: true,
          payments: true,
          classSchedules: true,
          competitions: true,
          sparringSessions: true,
          gradingExams: true,
        },
      },
      users: {
        where: { role: "OWNER" },
        take: 1,
        select: { fullName: true, email: true, phone: true },
      },
    },
  });

  if (!club) return notFound();

  const owner = club.users[0] ?? null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/admin/clubs"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand-navy"
      >
        <ArrowLeft size={14} />
        {t("backToClubs")}
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <p className="eyebrow">{t("clubDetail")}</p>
          <h1 className="text-2xl font-bold text-brand-navy">{club.name}</h1>
          <p className="text-sm text-muted-foreground">{club.slug}</p>
        </div>
        <TierSwitcher clubId={club.id} currentTier={club.tier} />
      </div>

      {/* Overview grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <InfoCard label={t("totalStudents")} value={String(club._count.students)} />
        <InfoCard label={t("plans")} value={String(club._count.paymentPlans)} />
        <InfoCard label={t("payments")} value={String(club._count.payments)} />
        <InfoCard label={t("classSchedules")} value={String(club._count.classSchedules)} />
        <InfoCard label={t("competitions")} value={String(club._count.competitions)} />
        <InfoCard label={t("gradingExams")} value={String(club._count.gradingExams)} />
      </div>

      {/* Owner info */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-brand-navy">
          {t("owner")}
        </h2>
        {owner ? (
          <div className="text-sm space-y-1">
            <p className="font-medium text-brand-navy">{owner.fullName}</p>
            {owner.email && <p className="text-muted-foreground">{owner.email}</p>}
            {owner.phone && <p className="text-muted-foreground">{owner.phone}</p>}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("noOwner")}</p>
        )}
      </section>

      {/* Club details */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-brand-navy">
          {t("clubInfo")}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 text-sm">
          <Detail label={t("email")} value={club.email} />
          <Detail label={t("phone")} value={club.phone} />
          <Detail label={t("city")} value={club.city} />
          <Detail label={t("country")} value={club.country} />
          <Detail label={t("disciplines")} value={club.disciplines.join(", ")} />
          <Detail label={t("created")} value={club.createdAt.toLocaleDateString()} />
        </div>
      </section>

      {/* Stripe / Platform billing */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-brand-navy">
          {t("stripeStatus")}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 text-sm">
          <Detail
            label={t("stripeConnect")}
            value={
              club.stripeOnboarded
                ? t("connected")
                : club.stripeAccountId
                  ? t("incomplete")
                  : t("notConnected")
            }
          />
          <Detail label={t("stripeAccountId")} value={club.stripeAccountId} />
          <Detail label={t("subscription")} value={club.platformSubscriptionId} />
          <Detail
            label={t("periodEnd")}
            value={club.platformCurrentPeriodEnd?.toLocaleDateString() ?? null}
          />
        </div>
      </section>

      {/* Impersonate */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-brand-navy">{t("impersonate")}</p>
            <p className="text-xs text-muted-foreground">{t("impersonateHint")}</p>
          </div>
          <ImpersonateButton clubId={club.id} clubName={club.name} />
        </div>
      </section>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold text-brand-navy">{value}</p>
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="font-medium text-brand-navy">{value || "—"}</p>
    </div>
  );
}
