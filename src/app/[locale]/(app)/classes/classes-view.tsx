"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import {
  CalendarDays,
  Clock,
  Loader2,
  MapPin,
  Swords,
  User as UserIcon,
} from "lucide-react";
import type { BookingStatus } from "@prisma/client";
import type { ClassCard, CurrentStudent } from "@/lib/queries";
import { LevelBadge } from "@/components/level-badge";
import { disciplineMeta } from "@/lib/constants";
import { DAY_ORDER, formatTime } from "@/lib/schedule";

interface ClassesViewProps {
  classes: ClassCard[];
  student: CurrentStudent | null;
  /** When true, the booking UI (book/cancel/waitlist) is hidden. */
  isAdminOrOwner?: boolean;
}

/**
 * Weekly schedule with a Week/List toggle. Each class shows its time, name,
 * discipline, instructor, level, and enrolment. When a student is in
 * context (and the viewer is not an admin/owner), each card carries a
 * book/cancel control with waitlist support.
 */
export function ClassesView({
  classes,
  student,
  isAdminOrOwner = false,
}: ClassesViewProps) {
  const t = useTranslations("Classes");
  const [view, setView] = useState<"week" | "list">("week");

  const byDay = useMemo(() => {
    const map = new Map<string, ClassCard[]>();
    for (const day of DAY_ORDER) map.set(day, []);
    for (const c of classes) map.get(c.dayOfWeek)?.push(c);
    return map;
  }, [classes]);

  /** Whether to show the booking controls on cards. */
  const showBooking = Boolean(student) && !isAdminOrOwner;

  if (classes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
        <div className="mx-auto mb-3 text-4xl">📅</div>
        <h2 className="text-lg font-bold text-brand-navy">{t("emptyTitle")}</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          {t("emptyBody")}
        </p>
        {isAdminOrOwner && (
          <Link
            href="/classes/new"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-teal px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90"
          >
            {t("addClass")}
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        {showBooking && (
          <p className="text-xs text-muted-foreground">
            {t.rich("bookingAs", {
              name: student!.fullName,
              strong: (chunks) => (
                <span className="font-medium text-brand-navy">{chunks}</span>
              ),
            })}
          </p>
        )}
        <div className="ml-auto inline-flex rounded-lg border border-border bg-card p-0.5 text-sm">
          {(["week", "list"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                view === v
                  ? "bg-brand-teal text-white"
                  : "text-muted-foreground hover:text-brand-navy"
              }`}
            >
              {t(`view.${v}`)}
            </button>
          ))}
        </div>
      </div>

      {view === "week" ? (
        <WeekView
          byDay={byDay}
          student={student}
          showBooking={showBooking}
          t={t}
        />
      ) : (
        <ListView
          byDay={byDay}
          student={student}
          showBooking={showBooking}
          t={t}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Week view — 7-column grid                                                 */
/* -------------------------------------------------------------------------- */

function WeekView({
  byDay,
  student,
  showBooking,
  t,
}: {
  byDay: Map<string, ClassCard[]>;
  student: CurrentStudent | null;
  showBooking: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
      {DAY_ORDER.map((day) => {
        const dayClasses = byDay.get(day) ?? [];
        return (
          <div key={day} className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t(`dayShort.${day}`)}
            </p>
            {dayClasses.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card p-4 text-center text-xs text-muted-foreground">
                {t("noClasses")}
              </div>
            ) : (
              dayClasses.map((c) => (
                <WeekCardItem
                  key={c.id}
                  card={c}
                  student={student}
                  showBooking={showBooking}
                />
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Compact card used inside the 7-column week grid. */
function WeekCardItem({
  card,
  student,
  showBooking,
}: {
  card: ClassCard;
  student: CurrentStudent | null;
  showBooking: boolean;
}) {
  const t = useTranslations("Classes");
  const discipline = disciplineMeta(card.discipline);
  return (
    <div className="group rounded-xl border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md">
      <p className="flex items-center gap-1.5 text-xs font-medium text-brand-teal">
        <Clock size={12} />
        {formatTime(card.startTime)} – {formatTime(card.endTime)}
      </p>
      <Link
        href={`/classes/${card.id}`}
        className="mt-1 block truncate font-semibold text-brand-navy transition-colors group-hover:text-brand-teal"
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
          {card.instructorName ?? t("unassigned")}
        </span>
      </div>
      {card.location && (
        <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin size={12} />
          {card.location}
        </p>
      )}

      <div className="mt-2 flex items-center justify-between">
        <span
          className={`inline-flex items-center gap-1 text-xs font-medium ${
            card.isFull ? "text-amber-600" : "text-muted-foreground"
          }`}
          title={t("enrolledCapacity")}
        >
          <CalendarDays size={12} />
          {card.enrolledCount}/{card.maxStudents}
          {card.isFull && ` · ${t("full")}`}
        </span>
      </div>

      {showBooking && student && (
        <div className="mt-3 border-t border-border pt-3">
          <BookButton card={card} studentId={student.id} />
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  List view — horizontal rows grouped by day (matches public page style)    */
/* -------------------------------------------------------------------------- */

function ListView({
  byDay,
  student,
  showBooking,
  t,
}: {
  byDay: Map<string, ClassCard[]>;
  student: CurrentStudent | null;
  showBooking: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
}) {
  const activeDays = DAY_ORDER.filter(
    (day) => (byDay.get(day) ?? []).length > 0,
  );

  return (
    <div className="space-y-6">
      {activeDays.map((day) => {
        const dayClasses = byDay.get(day) ?? [];
        return (
          <div key={day}>
            <h3 className="mb-3 text-base font-bold text-brand-navy">
              {t(`day.${day}`)}
            </h3>
            <div className="space-y-2">
              {dayClasses.map((c) => (
                <ListRowItem
                  key={c.id}
                  card={c}
                  student={student}
                  showBooking={showBooking}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Horizontal row used in the list view — mirrors the public schedule row. */
function ListRowItem({
  card,
  student,
  showBooking,
}: {
  card: ClassCard;
  student: CurrentStudent | null;
  showBooking: boolean;
}) {
  const t = useTranslations("Classes");
  const discipline = disciplineMeta(card.discipline);

  return (
    <div className="group flex flex-col rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center">
      <div className="flex flex-1 items-center gap-4 px-4 py-3 sm:px-5">
        {/* Time */}
        <div className="w-28 shrink-0">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-brand-navy">
            <Clock size={14} className="text-brand-teal" />
            {formatTime(card.startTime)} – {formatTime(card.endTime)}
          </p>
        </div>

        {/* Divider */}
        <div className="hidden h-10 w-px shrink-0 bg-border sm:block" />

        {/* Class info */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/classes/${card.id}`}
              className="text-sm font-semibold text-brand-navy transition-colors group-hover:text-brand-teal"
            >
              {card.name}
            </Link>
            <LevelBadge level={card.level} />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Swords size={12} className="shrink-0" />
              {discipline.emoji} {discipline.label}
            </span>
            <span className="flex items-center gap-1">
              <UserIcon size={12} className="shrink-0" />
              {card.instructorName ?? t("unassigned")}
            </span>
            {card.location && (
              <span className="flex items-center gap-1">
                <MapPin size={12} className="shrink-0" />
                {card.location}
              </span>
            )}
          </div>
        </div>

        {/* Capacity */}
        <div className="shrink-0">
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium ${
              card.isFull ? "text-amber-600" : "text-muted-foreground"
            }`}
            title={t("enrolledCapacity")}
          >
            <CalendarDays size={12} />
            {card.enrolledCount}/{card.maxStudents}
            {card.isFull && ` · ${t("full")}`}
          </span>
        </div>
      </div>

      {/* Booking action — separate row on mobile, inline on desktop */}
      {showBooking && student && (
        <div className="border-t border-border px-4 py-2.5 sm:border-l sm:border-t-0 sm:px-4 sm:py-3">
          <BookButton card={card} studentId={student.id} />
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Book / cancel / waitlist button                                            */
/* -------------------------------------------------------------------------- */

function BookButton({
  card,
  studentId,
}: {
  card: ClassCard;
  studentId: string;
}) {
  const t = useTranslations("Classes");
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
      if (!res.ok) throw new Error(data.error ?? t("bookError"));
      setStatus(data.booking.status);
      setPosition(data.waitlistPosition ?? null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("bookError"));
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
      if (!res.ok) throw new Error(data.error ?? t("cancelError"));
      setStatus(null);
      setPosition(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("cancelError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1.5">
      {status === "BOOKED" ? (
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
            {t("booked")}
          </span>
          <button
            type="button"
            onClick={cancel}
            disabled={loading}
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-red-600 disabled:opacity-50"
          >
            {loading ? "…" : t("cancel")}
          </button>
        </div>
      ) : status === "WAITLISTED" ? (
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
            {position
              ? t("waitlistPosition", { position })
              : t("waitlist")}
          </span>
          <button
            type="button"
            onClick={cancel}
            disabled={loading}
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-red-600 disabled:opacity-50"
          >
            {loading ? "…" : t("leave")}
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
          {card.isFull ? t("joinWaitlist") : t("book")}
        </button>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
