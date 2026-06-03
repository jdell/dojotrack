import type { Metadata } from "next";
import { CalendarPlus } from "lucide-react";

export const metadata: Metadata = { title: "Classes — DojoTrack" };

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function ClassesPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Schedule</p>
          <h1 className="text-2xl font-bold text-brand-navy">Classes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Plan your weekly timetable and track attendance.
          </p>
        </div>
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-2 rounded-lg bg-brand-teal px-4 py-2 text-sm font-semibold text-white opacity-60"
          title="Coming soon"
        >
          <CalendarPlus size={16} />
          Add class
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {DAYS.map((day) => (
          <div
            key={day}
            className="rounded-xl border border-dashed border-border bg-card p-4 text-center"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {day}
            </p>
            <p className="mt-6 text-xs text-muted-foreground">No classes</p>
          </div>
        ))}
      </div>
    </div>
  );
}
