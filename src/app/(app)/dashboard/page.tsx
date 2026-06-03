import type { Metadata } from "next";
import { Award, CalendarDays, TrendingUp, Users } from "lucide-react";

export const metadata: Metadata = { title: "Dashboard — DojoTrack" };

const METRICS = [
  {
    label: "Total students",
    value: "—",
    hint: "Active members",
    icon: Users,
  },
  {
    label: "Classes this week",
    value: "—",
    hint: "On the schedule",
    icon: CalendarDays,
  },
  {
    label: "Belt promotions",
    value: "—",
    hint: "Last 30 days",
    icon: Award,
  },
  {
    label: "Monthly revenue",
    value: "—",
    hint: "Collected this month",
    icon: TrendingUp,
  },
];

export default function DashboardPage() {
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
        {METRICS.map(({ label, value, hint, icon: Icon }) => (
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

      <section className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
        <div className="mx-auto mb-3 text-4xl">📋</div>
        <h2 className="text-lg font-bold text-brand-navy">No activity yet</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          Recent check-ins, promotions, and payments will appear here once your
          club is up and running.
        </p>
      </section>
    </div>
  );
}
