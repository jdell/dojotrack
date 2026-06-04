"use client";

import { useMemo, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import {
  CalendarDays,
  Clock,
  Loader2,
  MapPin,
  User as UserIcon,
} from "lucide-react";
import type { BookingStatus } from "@prisma/client";
import type { ClassCard, CurrentStudent } from "@/lib/queries";
import { LevelBadge } from "@/components/level-badge";
import { disciplineMeta } from "@/lib/constants";
import { DAY_ORDER, DAY_SHORT, formatTime } from "@/lib/schedule";

interface ClassesViewProps {
  classes: ClassCard[];
  student: CurrentStudent | null;
}

/**
 * Weekly schedule with a Week/List toggle. Each class shows its time, name,
 * discipline, instructor, level, and enrolment. When a (demo) student is in
 * context, each card carries a book/cancel control with waitlist support.
 */
export function ClassesView({ classes, student }: ClassesViewProps) {
  const [view, setView] = useState<"week" | "list">("week");

  const byDay = useMemo(() => {
    const map = new Map<string, ClassCard[]>();
    for (const day of DAY_ORDER) map.set(day, []);
    for (const c of classes) map.get(c.dayOfWeek)?.push(c);
    return map;
  }, [classes]);

  if (classes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
        <div className="mx-auto mb-3 text-4xl">📅</div>
        <h2 className="text-lg font-bold text-brand-navy">No classes yet</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          Build your weekly timetable. Add your first class and students will be
          able to book and check in.
        </p>
        <Link
          href="/classes/new"
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-teal px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90"
        >
          Add class
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        {student && (
          <p className="text-xs text-muted-foreground">
            Booking as{" "}
            <span className="font-medium text-brand-navy">
              {student.fullName}
            </span>
          </p>
        )}
        <div className="ml-auto inline-flex rounded-lg border border-border bg-card p-0.5 text-sm">
          {(["week", "list"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`rounded-md px-3 py-1.5 font-medium capitalize transition-colors ${
                view === v
                  ? "bg-brand-teal text-white"
                  : "text-muted-foreground hover:text-brand-navy"
              }`}
            >
              {v} view
            </button>
          ))}
        </div>
      </div>

      {view === "week" ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
          {DAY_ORDER.map((day) => {
            const dayClasses = byDay.get(day) ?? [];
            return (
              <div key={day} className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {DAY_SHORT[day]}
                </p>
                {dayClasses.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-card p-4 text-center text-xs text-muted-foreground">
                    No classes
                  </div>
                ) : (
                  dayClasses.map((c) => (
                    <ClassCardItem key={c.id} card={c} student={student} />
                  ))
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {DAY_ORDER.flatMap((day) => byDay.get(day) ?? []).map((c) => (
            <ClassCardItem key={c.id} card={c} student={student} listView />
          ))}
        </div>
      )}
    </div>
  );
}

function ClassCardItem({
  card,
  student,
  listView = false,
}: {
  card: ClassCard;
  student: CurrentStudent | null;
  listView?: boolean;
}) {
  const discipline = disciplineMeta(card.discipline);
  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
      <div
        className={listView ? "flex flex-wrap items-center gap-x-4 gap-y-2" : ""}
      >
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-xs font-medium text-brand-teal">
            <Clock size={12} />
            {formatTime(card.startTime)} – {formatTime(card.endTime)}
            {listView && (
              <span className="text-muted-foreground">
                · {DAY_SHORT[card.dayOfWeek]}
              </span>
            )}
          </p>
          <Link
            href={`/classes/${card.id}`}
            className="mt-1 block truncate font-semibold text-brand-navy hover:text-brand-teal"
          >
            {card.name}
          </Link>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {discipline.emoji} {discipline.label}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <LevelBadge level={card.level} />
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <UserIcon size={12} />
              {card.instructorName ?? "Unassigned"}
            </span>
          </div>
          {card.location && (
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin size={12} />
              {card.location}
            </p>
          )}
        </div>

        <div className="mt-3 flex shrink-0 items-center justify-between gap-3 sm:mt-0">
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium ${
              card.isFull ? "text-amber-600" : "text-muted-foreground"
            }`}
            title="Enrolled / capacity"
          >
            <CalendarDays size={12} />
            {card.enrolledCount}/{card.maxStudents}
            {card.isFull && " · Full"}
          </span>
        </div>
      </div>

      {student && (
        <div className="mt-3 border-t border-border pt-3">
          <BookButton card={card} studentId={student.id} />
        </div>
      )}
    </div>
  );
}

function BookButton({
  card,
  studentId,
}: {
  card: ClassCard;
  studentId: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<BookingStatus | null>(
    card.bookingStatus,
  );
  const [position, setPosition] = useState<number | null>(
    card.waitlistPosition,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function book() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classScheduleId: card.id, studentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not book the class.");
      setStatus(data.booking.status);
      setPosition(data.waitlistPosition ?? null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not book.");
    } finally {
      setLoading(false);
    }
  }

  async function cancel() {
    if (!card.nextSessionId) {
      setStatus(null);
      setPosition(null);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/bookings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classSessionId: card.nextSessionId,
          studentId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not cancel.");
      setStatus(null);
      setPosition(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not cancel.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1.5">
      {status === "BOOKED" ? (
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
            Booked
          </span>
          <button
            type="button"
            onClick={cancel}
            disabled={loading}
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-red-600 disabled:opacity-50"
          >
            {loading ? "…" : "Cancel"}
          </button>
        </div>
      ) : status === "WAITLISTED" ? (
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
            Waitlist{position ? ` · #${position}` : ""}
          </span>
          <button
            type="button"
            onClick={cancel}
            disabled={loading}
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-red-600 disabled:opacity-50"
          >
            {loading ? "…" : "Leave"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={book}
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-teal px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-teal/90 disabled:opacity-50"
        >
          {loading && <Loader2 size={13} className="animate-spin" />}
          {card.isFull ? "Join waitlist" : "Book"}
        </button>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
