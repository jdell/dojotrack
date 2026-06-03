import type { Metadata } from "next";
import Link from "next/link";
import {
  Award,
  CalendarDays,
  Clock,
  GraduationCap,
  TrendingUp,
  Users,
} from "lucide-react";
import { getCurrentClub, getDashboard } from "@/lib/queries";
import { disciplineMeta } from "@/lib/constants";
import { formatTime } from "@/lib/schedule";
import { formatDate, formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard — DojoTrack" };

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const club = await getCurrentClub();
  const data = club
    ? await getDashboard(club.id)
    : {
        totalStudents: 0,
        classesThisWeek: 0,
        eligibleForPromotion: 0,
        monthlyRevenue: 0,
        currency: "usd",
        todayClasses: [],
        upcomingExams: [],
      };

  const metrics = [
    {
      label: "Total students",
      value: club ? String(data.totalStudents) : "—",
      hint: "Active members",
      icon: Users,
    },
    {
      label: "Classes this week",
      value: club ? String(data.classesThisWeek) : "—",
      hint: "On the schedule",
      icon: CalendarDays,
    },
    {
      label: "Eligible for promotion",
      value: club ? String(data.eligibleForPromotion) : "—",
      hint: "Ready to grade",
      icon: Award,
    },
    {
      label: "Monthly revenue",
      value: club ? formatMoney(data.monthlyRevenue, data.currency) : "—",
      hint: "Collected this month",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <p className="eyebrow">Overview</p>
        <h1 className="text-2xl font-bold text-brand-navy">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A snapshot of your club. Metrics populate once students and classes
          are added.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(({ label, value, hint, icon: Icon }) => (
          <div
            key={label}
            className="rounded-xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                {label}
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-teal/10 text-brand-teal">
                <Icon size={18} />
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight text-brand-navy">
              {value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          </div>
        ))}
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-brand-navy">
            Today&apos;s classes
          </h2>
          <Link
            href="/classes"
            className="text-sm font-medium text-brand-teal hover:underline"
          >
            View schedule
          </Link>
        </div>

        {data.todayClasses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
            <div className="mx-auto mb-3 text-4xl">🗓️</div>
            <h3 className="text-lg font-bold text-brand-navy">
              No classes scheduled today
            </h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              Today&apos;s timetable is clear. Check-in counts will appear here
              on class days.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Class</th>
                  <th className="px-4 py-3 font-semibold">Time</th>
                  <th className="px-4 py-3 font-semibold">Booked</th>
                  <th className="px-4 py-3 font-semibold">Checked in</th>
                </tr>
              </thead>
              <tbody>
                {data.todayClasses.map((c) => {
                  const discipline = disciplineMeta(c.discipline);
                  return (
                    <tr
                      key={c.id}
                      className="border-b border-border last:border-0 hover:bg-muted/20"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/classes/${c.id}`}
                          className="font-medium text-brand-navy hover:text-brand-teal"
                        >
                          {c.name}
                        </Link>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {discipline.emoji} {discipline.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock size={13} className="text-brand-teal" />
                          {formatTime(c.startTime)} – {formatTime(c.endTime)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {c.enrolledCount}/{c.maxStudents}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-brand-teal/10 px-2.5 py-0.5 text-xs font-semibold text-brand-teal">
                          {c.checkedInCount} in
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-brand-navy">Upcoming exams</h2>
          <Link
            href="/belts/exams"
            className="text-sm font-medium text-brand-teal hover:underline"
          >
            All exams
          </Link>
        </div>

        {data.upcomingExams.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
            <div className="mx-auto mb-3 text-4xl">🥋</div>
            <h3 className="text-lg font-bold text-brand-navy">
              No gradings scheduled
            </h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              Schedule a grading exam to test candidates and award belts.
            </p>
            <Link
              href="/belts/exams/new"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-teal px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90"
            >
              <GraduationCap size={16} />
              Schedule exam
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {data.upcomingExams.map((exam) => (
              <li key={exam.id}>
                <Link
                  href={`/belts/exams/${exam.id}`}
                  className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-brand-teal/40"
                >
                  <span
                    className="h-9 w-2 shrink-0 rounded-full border border-black/10"
                    style={{ backgroundColor: exam.targetBeltColor }}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-brand-navy">
                      {exam.targetBeltName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(exam.date)}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {exam.candidateCount}{" "}
                    {exam.candidateCount === 1 ? "candidate" : "candidates"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
