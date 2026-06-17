import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, CalendarClock, GraduationCap } from "lucide-react";
import type { ExamStatus } from "@prisma/client";
import { getCurrentClub, getExams, type ExamRow } from "@/lib/queries";
import { isDbConfigured } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Belts" });
  return { title: `${t("exams")} — EntrenaDojo` };
}

export const dynamic = "force-dynamic";

export default async function ExamsPage() {
  const t = await getTranslations("Belts");
  const club = isDbConfigured() ? await getCurrentClub() : null;
  const { upcoming, past } = club
    ? await getExams(club.id)
    : { upcoming: [], past: [] };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href="/belts"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-navy"
        >
          <ArrowLeft size={15} />
          {t("backToBelts")}
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">{t("gradings")}</p>
            <h1 className="text-2xl font-bold text-brand-navy">{t("exams")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("examsIntro")}
            </p>
          </div>
          {club && (
            <Link
              href="/belts/exams/new"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-teal px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90"
            >
              <GraduationCap size={16} />
              {t("newExam")}
            </Link>
          )}
        </div>
      </div>

      {!club ? (
        <NotConfigured />
      ) : upcoming.length === 0 && past.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <div className="mx-auto mb-3 text-4xl">🥋</div>
          <h2 className="text-lg font-bold text-brand-navy">{t("noExams")}</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            {t("noExamsHint")}
          </p>
          <Link
            href="/belts/exams/new"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-teal px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90"
          >
            {t("newExam")}
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <ExamGroup
            title={t("upcoming")}
            exams={upcoming}
            emptyHint={t("noneScheduled")}
          />
          <ExamGroup
            title={t("past")}
            exams={past}
            emptyHint={t("noPastExams")}
          />
        </div>
      )}
    </div>
  );
}

async function ExamGroup({
  title,
  exams,
  emptyHint,
}: {
  title: string;
  exams: ExamRow[];
  emptyHint: string;
}) {
  const t = await getTranslations("Belts");
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-brand-navy">{title}</h2>
      {exams.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
          {emptyHint}
        </p>
      ) : (
        <ul className="space-y-2">
          {exams.map((exam) => (
            <li key={exam.id}>
              <Link
                href={`/belts/exams/${exam.id}`}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-brand-teal/40"
              >
                <span
                  className="h-10 w-2 shrink-0 rounded-full border border-black/10"
                  style={{ backgroundColor: exam.targetBeltColor }}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-brand-navy">
                    {exam.targetBeltName}
                  </p>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarClock size={13} />
                    {formatDate(exam.date)}
                    {exam.location ? ` · ${exam.location}` : ""}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <ExamStatusBadge status={exam.status} />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("candidateCount", { count: exam.candidateCount })}
                    {exam.passCount > 0
                      ? ` · ${t("passedCount", { count: exam.passCount })}`
                      : ""}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const STATUS_CLASS: Record<ExamStatus, string> = {
  SCHEDULED: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-amber-100 text-amber-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-slate-100 text-slate-600",
};

export async function ExamStatusBadge({ status }: { status: ExamStatus }) {
  const t = await getTranslations("Belts");
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLASS[status]}`}
    >
      {t(`examStatus.${status}`)}
    </span>
  );
}

async function NotConfigured() {
  const t = await getTranslations("Belts");
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
      <div className="mx-auto mb-3 text-4xl">🥋</div>
      <h2 className="text-lg font-bold text-brand-navy">
        {t("examsNotAvailable")}
      </h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        {t("connectDbGradings")}
      </p>
    </div>
  );
}
