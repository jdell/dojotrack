import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, MapPin, Receipt } from "lucide-react";
import { getCurrentClub, getExamDetail } from "@/lib/queries";
import { isDbConfigured } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { ExamStatusBadge } from "../page";
import { ExamResults } from "./exam-results";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Belts" });
  return { title: `${t("metaExam")} — EntrenaDojo` };
}

export const dynamic = "force-dynamic";

export default async function ExamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("Belts");

  if (!isDbConfigured()) return <NotConfigured />;

  const club = await getCurrentClub();
  if (!club) notFound();

  const exam = await getExamDetail(id, club.id);
  if (!exam) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/belts/exams"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-navy"
        >
          <ArrowLeft size={15} />
          {t("backToExams")}
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="eyebrow">{t("gradingFor")}</p>
            <h1 className="flex items-center gap-2.5 text-2xl font-bold text-brand-navy">
              <span
                className="h-4 w-10 rounded-full border border-black/10"
                style={{ backgroundColor: exam.targetBeltColor }}
                aria-hidden
              />
              {exam.targetBeltName}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CalendarClock size={14} className="text-brand-teal" />
                {formatDate(exam.date)}
              </span>
              {exam.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={14} />
                  {exam.location}
                </span>
              )}
              {exam.fee != null && (
                <span className="inline-flex items-center gap-1.5">
                  <Receipt size={14} />
                  {t("examFee", { amount: exam.fee.toFixed(2) })}
                </span>
              )}
            </div>
          </div>
          <ExamStatusBadge status={exam.status} />
        </div>
        {exam.notes && (
          <p className="mt-3 rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
            {exam.notes}
          </p>
        )}
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-brand-navy">
            {t("candidates")}
          </h2>
          <Link
            href={`/belts/${exam.targetBeltId}`}
            className="text-sm font-medium text-brand-teal hover:underline"
          >
            {t("viewRequirements")}
          </Link>
        </div>
        <ExamResults
          examId={exam.id}
          completed={exam.status === "COMPLETED"}
          candidates={exam.candidates}
        />
      </section>
    </div>
  );
}

async function NotConfigured() {
  const t = await getTranslations("Belts");
  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/belts/exams"
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-navy"
      >
        <ArrowLeft size={15} />
        {t("backToExams")}
      </Link>
      <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
        <div className="mx-auto mb-3 text-4xl">🥋</div>
        <h2 className="text-lg font-bold text-brand-navy">
          {t("examNotAvailable")}
        </h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          {t("connectDbResults")}
        </p>
      </div>
    </div>
  );
}
