import type { Metadata } from "next";
import Link from "next/link";
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

export const metadata: Metadata = { title: "Student — DojoTrack" };

export const dynamic = "force-dynamic";

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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
          Back to roster
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Member</p>
            <h1 className="text-2xl font-bold text-brand-navy">
              {student.fullName}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <BeltBadge name={student.beltName} color={student.beltColor} />
              <span>Member since {formatDate(student.joinDate)}</span>
              {!student.active && (
                <span className="rounded-full bg-muted/60 px-2 py-0.5 text-xs">
                  Inactive
                </span>
              )}
            </div>
          </div>
          <Link
            href={`/students/${id}/belt`}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-teal px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90"
          >
            <Award size={16} />
            Belt progress
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<CalendarDays size={18} />}
          label="Classes attended"
          value={String(student.totalClasses)}
          hint="All time"
        />
        <StatCard
          icon={<Flame size={18} />}
          label="Current streak"
          value={`${student.streakWeeks} ${student.streakWeeks === 1 ? "week" : "weeks"}`}
          hint="Consecutive weeks training"
        />
        <StatCard
          icon={<Trophy size={18} />}
          label="Belt"
          value={student.beltName ?? "—"}
          hint="Current rank"
        />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-brand-navy">Attendance history</h2>
        {student.history.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No check-ins recorded yet.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Class</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Method</th>
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
                          <QrCode size={13} /> Self check-in
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Manual
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

function NotConfigured() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/students"
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-navy"
      >
        <ArrowLeft size={15} />
        Back to roster
      </Link>
      <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
        <div className="mx-auto mb-3 text-4xl">🥋</div>
        <h2 className="text-lg font-bold text-brand-navy">
          Profiles aren&apos;t available yet
        </h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          Connect a database to see attendance history and streaks.
        </p>
      </div>
    </div>
  );
}
