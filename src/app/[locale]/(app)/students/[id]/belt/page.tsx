import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Trophy,
} from "lucide-react";
import { getBeltProgress, getCurrentClub } from "@/lib/queries";
import { isDbConfigured } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { BeltBadge } from "@/components/belt-badge";
import { BeltProgressChecklist } from "./belt-progress-checklist";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Students" });
  return { title: `${t("beltProgress")} — EntrenaDojo` };
}

export const dynamic = "force-dynamic";

export default async function StudentBeltPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("Students");

  if (!isDbConfigured()) return <NotConfigured studentId={id} />;

  const club = await getCurrentClub();
  if (!club) notFound();

  const progress = await getBeltProgress(id, club.id);
  if (!progress) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/students/${id}`}
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-navy"
        >
          <ArrowLeft size={15} />
          {t("backToProfile")}
        </Link>
        <p className="eyebrow">{t("beltProgressionEyebrow")}</p>
        <h1 className="text-2xl font-bold text-brand-navy">
          {progress.studentName}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <BeltBadge
            name={progress.currentBelt?.name ?? null}
            color={progress.currentBelt?.color ?? null}
          />
          {progress.nextBelt && (
            <span className="inline-flex items-center gap-1.5">
              <Trophy size={14} className="text-brand-gold" />
              {t("workingToward", { belt: progress.nextBelt.name })}
            </span>
          )}
        </div>
      </div>

      {progress.eligible && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800">
          <CheckCircle2 size={18} />
          {t("readyToGrade", { belt: progress.nextBelt?.name ?? "" })}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          icon={<Clock size={18} />}
          label={t("statTimeAtBelt")}
          value={t("monthsValue", { count: progress.monthsAtCurrentBelt })}
          hint={t("statSince", { date: formatDate(progress.sinceDate) })}
        />
        <StatCard
          icon={<CalendarDays size={18} />}
          label={t("statClassesAttended")}
          value={String(progress.totalClasses)}
          hint={t("statAllTime")}
        />
      </div>

      {progress.nextBelt ? (
        <BeltProgressChecklist
          studentId={id}
          nextBeltName={progress.nextBelt.name}
          requirements={progress.requirements}
          totalCount={progress.totalCount}
          studentDateOfBirth={progress.dateOfBirth}
        />
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
          <div className="mx-auto mb-2 text-3xl">🏆</div>
          <p className="text-sm font-medium text-brand-navy">
            {t("topOfLadderTitle")}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("topOfLadderBody", { name: progress.studentName })}
          </p>
        </div>
      )}

      {/* Belt history */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-brand-navy">
          {t("beltHistory")}
        </h2>
        {progress.history.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            {t("noBeltHistory")}
          </p>
        ) : (
          <ol className="relative space-y-4 border-l border-border pl-6">
            {progress.history.map((h, i) => {
              const isLast = i === progress.history.length - 1;
              return (
                <li key={`${h.beltName}-${h.date}-${i}`} className="relative">
                  <span
                    className="absolute -left-[1.95rem] top-0.5 h-4 w-4 rounded-full border-2 border-white shadow"
                    style={{ backgroundColor: h.color }}
                    aria-hidden
                  />
                  <p className="text-sm font-semibold text-brand-navy">
                    {h.beltName}
                    {isLast && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-brand-teal/10 px-2 py-0.5 text-[0.65rem] font-semibold text-brand-teal">
                        {t("currentBadge")}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {h.via === "enrollment" ? t("viaEnrolled") : t("viaPromoted")}{" "}
                    · {formatDate(h.date)}
                  </p>
                </li>
              );
            })}
          </ol>
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

async function NotConfigured({ studentId }: { studentId: string }) {
  const t = await getTranslations("Students");
  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/students/${studentId}`}
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-navy"
      >
        <ArrowLeft size={15} />
        {t("backToProfile")}
      </Link>
      <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
        <div className="mx-auto mb-3 text-4xl">🥋</div>
        <h2 className="text-lg font-bold text-brand-navy">
          {t("beltUnavailableTitle")}
        </h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          {t("beltUnavailableBody")}
        </p>
      </div>
    </div>
  );
}
