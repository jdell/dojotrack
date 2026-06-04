import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  Percent,
  QrCode,
  User as UserIcon,
} from "lucide-react";
import { getClassDetail, getCurrentClub, getStudents } from "@/lib/queries";
import { isDbConfigured } from "@/lib/db";
import { disciplineMeta } from "@/lib/constants";
import { DAY_LABELS, formatTime } from "@/lib/schedule";
import { checkinLink } from "@/lib/invite";
import { qrDataUrl } from "@/lib/qr";
import { LevelBadge } from "@/components/level-badge";
import { SessionManager } from "./session-manager";
import { ClassActions } from "./class-actions";

export const metadata: Metadata = { title: "Class — DojoTrack" };

export const dynamic = "force-dynamic";

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isDbConfigured()) return <NotConfigured />;

  const club = await getCurrentClub();
  if (!club) notFound();

  const detail = await getClassDetail(id, club.id);
  if (!detail) notFound();

  const students = (await getStudents(club.id)).map((s) => ({
    id: s.id,
    fullName: s.fullName,
  }));

  const discipline = disciplineMeta(detail.discipline);
  const timeLabel = `${formatTime(detail.startTime)} – ${formatTime(detail.endTime)}`;

  // QR for the next session that hasn't been cancelled.
  const nextSession = detail.sessions.find((s) => !s.cancelled) ?? null;
  const checkinUrl = nextSession ? checkinLink(nextSession.id) : null;
  const qr = checkinUrl ? await qrDataUrl(checkinUrl) : null;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Link
          href="/classes"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-navy"
        >
          <ArrowLeft size={15} />
          Back to schedule
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="eyebrow">{DAY_LABELS[detail.dayOfWeek]}s</p>
            <h1 className="text-2xl font-bold text-brand-navy">
              {detail.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Clock size={14} className="text-brand-teal" />
                {timeLabel}
              </span>
              <span>
                {discipline.emoji} {discipline.label}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <UserIcon size={14} />
                {detail.instructorName ?? "Unassigned"}
              </span>
              {detail.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={14} />
                  {detail.location}
                </span>
              )}
              <LevelBadge level={detail.level} />
            </div>
          </div>
          <ClassActions classId={detail.id} />
        </div>
      </div>

      {/* Attendance stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Percent size={18} />}
          label="Avg fill rate"
          value={`${Math.round(detail.stats.avgFillRate * 100)}%`}
          hint="Check-ins ÷ capacity"
        />
        <StatCard
          icon={<CalendarDays size={18} />}
          label="Sessions held"
          value={String(detail.stats.totalSessions)}
          hint="To date"
        />
        <StatCard
          icon={<UserIcon size={18} />}
          label="Total check-ins"
          value={String(detail.stats.totalCheckins)}
          hint="All sessions"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        {/* Upcoming sessions */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-brand-navy">
            Upcoming sessions
          </h2>
          {detail.sessions.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
              No upcoming sessions scheduled.
            </p>
          ) : (
            detail.sessions.map((session) => (
              <SessionManager
                key={session.id}
                session={session}
                students={students}
                maxStudents={detail.maxStudents}
                timeLabel={timeLabel}
              />
            ))
          )}
        </div>

        {/* Self check-in QR */}
        <aside className="space-y-3">
          <div className="rounded-xl border border-border bg-card p-5 text-center shadow-sm">
            <h2 className="flex items-center justify-center gap-2 text-sm font-semibold text-brand-navy">
              <QrCode size={16} className="text-brand-teal" />
              Self check-in
            </h2>
            {qr && checkinUrl ? (
              <>
                <Image
                  src={qr}
                  alt="Check-in QR code"
                  width={180}
                  height={180}
                  unoptimized
                  className="mx-auto mt-3 rounded-lg border border-border"
                />
                <p className="mt-3 text-xs text-muted-foreground">
                  Students scan to check in to the next session.
                </p>
                <code className="mt-2 block truncate rounded-md bg-muted/50 px-2 py-1 text-[0.65rem] text-muted-foreground">
                  {checkinUrl}
                </code>
              </>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">
                The QR code appears once an upcoming session is scheduled.
              </p>
            )}
          </div>
        </aside>
      </div>
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
      <p className="mt-3 text-3xl font-bold tracking-tight text-brand-navy">
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
        href="/classes"
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-navy"
      >
        <ArrowLeft size={15} />
        Back to schedule
      </Link>
      <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
        <div className="mx-auto mb-3 text-4xl">🥋</div>
        <h2 className="text-lg font-bold text-brand-navy">
          Class details aren&apos;t available yet
        </h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          Connect a database to view sessions, check students in, and track
          attendance.
        </p>
      </div>
    </div>
  );
}
