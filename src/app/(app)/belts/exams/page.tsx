import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CalendarClock, GraduationCap } from "lucide-react";
import type { ExamStatus } from "@prisma/client";
import { getCurrentClub, getExams, type ExamRow } from "@/lib/queries";
import { isDbConfigured } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Grading exams — DojoTrack" };

export const dynamic = "force-dynamic";

export default async function ExamsPage() {
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
          Back to belts
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Gradings</p>
            <h1 className="text-2xl font-bold text-brand-navy">Grading exams</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Schedule gradings, enter results, and promote students.
            </p>
          </div>
          {club && (
            <Link
              href="/belts/exams/new"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-teal px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90"
            >
              <GraduationCap size={16} />
              Schedule exam
            </Link>
          )}
        </div>
      </div>

      {!club ? (
        <NotConfigured />
      ) : upcoming.length === 0 && past.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <div className="mx-auto mb-3 text-4xl">🥋</div>
          <h2 className="text-lg font-bold text-brand-navy">No exams yet</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Schedule your first grading to test candidates and award belts.
          </p>
          <Link
            href="/belts/exams/new"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-teal px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90"
          >
            Schedule exam
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <ExamGroup title="Upcoming" exams={upcoming} emptyHint="None scheduled." />
          <ExamGroup title="Past" exams={past} emptyHint="No past exams." />
        </div>
      )}
    </div>
  );
}

function ExamGroup({
  title,
  exams,
  emptyHint,
}: {
  title: string;
  exams: ExamRow[];
  emptyHint: string;
}) {
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
                    {exam.candidateCount}{" "}
                    {exam.candidateCount === 1 ? "candidate" : "candidates"}
                    {exam.passCount > 0 ? ` · ${exam.passCount} passed` : ""}
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

const STATUS_META: Record<ExamStatus, { label: string; className: string }> = {
  SCHEDULED: { label: "Scheduled", className: "bg-blue-100 text-blue-800" },
  IN_PROGRESS: { label: "In progress", className: "bg-amber-100 text-amber-800" },
  COMPLETED: { label: "Completed", className: "bg-green-100 text-green-800" },
  CANCELLED: { label: "Cancelled", className: "bg-slate-100 text-slate-600" },
};

export function ExamStatusBadge({ status }: { status: ExamStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

function NotConfigured() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
      <div className="mx-auto mb-3 text-4xl">🥋</div>
      <h2 className="text-lg font-bold text-brand-navy">
        Grading exams aren&apos;t available yet
      </h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        Connect a database to schedule gradings and promote students.
      </p>
    </div>
  );
}
