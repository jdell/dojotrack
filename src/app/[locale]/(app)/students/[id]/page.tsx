import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Award,
  CalendarDays,
  Flame,
  QrCode,
  Trophy,
} from "lucide-react";
import { getStudentProfile } from "@/lib/queries";
import { isDbConfigured } from "@/lib/db";
import { disciplineMeta } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { BeltBadge } from "@/components/belt-badge";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Students" });
  return { title: `${t("memberEyebrow")} — DojoTrack` };
}

export const dynamic = "force-dynamic";

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("Students");

  if (!isDbConfigured()) return <NotConfigured />;

  const student = await getStudentProfile(id);
  if (!student) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href="/students"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-navy"
        >
          <ArrowLeft size={15} />
          {t("backToRoster")}
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">{t("memberEyebrow")}</p>
            <h1 className="text-2xl font-bold text-brand-navy">
              {student.fullName}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <BeltBadge name={student.beltName} color={student.beltColor} />
              <span>
                {t("memberSince", { date: formatDate(student.joinDate) })}
              </span>
              {!student.active && (
                <span className="rounded-full bg-muted/60 px-2 py-0.5 text-xs">
                  {t("status.inactive")}
                </span>
              )}
            </div>
          </div>
          <Link
            href={`/students/${id}/belt`}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-teal px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90"
          >
            <Award size={16} />
            {t("beltProgress")}
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<CalendarDays size={18} />}
          label={t("statClassesAttended")}
          value={String(student.totalClasses)}
          hint={t("statAllTime")}
        />
        <StatCard
          icon={<Flame size={18} />}
          label={t("statCurrentStreak")}
          value={t("weeksValue", { count: student.streakWeeks })}
          hint={t("statConsecutiveWeeks")}
        />
        <StatCard
          icon={<Trophy size={18} />}
          label={t("colBelt")}
          value={student.beltName ?? "—"}
          hint={t("statCurrentRank")}
        />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-brand-navy">
          {t("attendanceHistory")}
        </h2>
        {student.history.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            {t("noCheckIns")}
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">{t("colClass")}</th>
                  <th className="px-4 py-3 font-semibold">{t("colDate")}</th>
                  <th className="px-4 py-3 font-semibold">{t("colMethod")}</th>
                </tr>
              </thead>
              <tbody>
                {student.history.map((h) => (
                  <tr
                    key={h.id}
                    className="border-b border-border last:border-0 hover:bg-muted/20"
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-brand-navy">
                        {h.className}
                      </span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {disciplineMeta(h.discipline).emoji}{" "}
                        {disciplineMeta(h.discipline).label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(h.date)}
                    </td>
                    <td className="px-4 py-3">
                      {h.method === "QR_SCAN" ? (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <QrCode size={13} /> {t("methodSelfCheckIn")}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {t("methodManual")}
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

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-teal/10 text-brand-teal">
          {icon}
        </span>
      </div>
      <p className="mt-3 truncate text-2xl font-bold tracking-tight text-brand-navy">
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

async function NotConfigured() {
  const t = await getTranslations("Students");
  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/students"
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-navy"
      >
        <ArrowLeft size={15} />
        {t("backToRoster")}
      </Link>
      <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
        <div className="mx-auto mb-3 text-4xl">🥋</div>
        <h2 className="text-lg font-bold text-brand-navy">
          {t("profilesUnavailableTitle")}
        </h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          {t("profilesUnavailableBody")}
        </p>
      </div>
    </div>
  );
}
