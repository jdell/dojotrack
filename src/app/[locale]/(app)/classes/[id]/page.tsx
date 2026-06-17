import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
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
import { formatTime } from "@/lib/schedule";
import { checkinLink } from "@/lib/invite";
import { qrDataUrl } from "@/lib/qr";
import { LevelBadge } from "@/components/level-badge";
import { SessionManager } from "./session-manager";
import { ClassActions } from "./class-actions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Classes" });
  return { title: `${t("classTitle")} — EntrenaDojo` };
}

export const dynamic = "force-dynamic";

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("Classes");

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
          {t("backToSchedule")}
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="eyebrow">{t(`dayPlural.${detail.dayOfWeek}`)}</p>
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
                {detail.instructorName ?? t("unassigned")}
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
          label={t("avgFillRate")}
          value={`${Math.round(detail.stats.avgFillRate * 100)}%`}
          hint={t("avgFillRateHint")}
        />
        <StatCard
          icon={<CalendarDays size={18} />}
          label={t("sessionsHeld")}
          value={String(detail.stats.totalSessions)}
          hint={t("sessionsHeldHint")}
        />
        <StatCard
          icon={<UserIcon size={18} />}
          label={t("totalCheckins")}
          value={String(detail.stats.totalCheckins)}
          hint={t("totalCheckinsHint")}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        {/* Upcoming sessions */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-brand-navy">
            {t("upcomingSessions")}
          </h2>
          {detail.sessions.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
              {t("noUpcomingSessions")}
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
              {t("selfCheckin")}
            </h2>
            {qr && checkinUrl ? (
              <>
                <Image
                  src={qr}
                  alt={t("checkinQrAlt")}
                  width={180}
                  height={180}
                  unoptimized
                  className="mx-auto mt-3 rounded-lg border border-border"
                />
                <p className="mt-3 text-xs text-muted-foreground">
                  {t("scanToCheckin")}
                </p>
                <code className="mt-2 block truncate rounded-md bg-muted/50 px-2 py-1 text-[0.65rem] text-muted-foreground">
                  {checkinUrl}
                </code>
              </>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">
                {t("qrAppearsLater")}
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

async function NotConfigured() {
  const t = await getTranslations("Classes");
  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/classes"
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-navy"
      >
        <ArrowLeft size={15} />
        {t("backToSchedule")}
      </Link>
      <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
        <div className="mx-auto mb-3 text-4xl">🥋</div>
        <h2 className="text-lg font-bold text-brand-navy">
          {t("notConfiguredTitle")}
        </h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          {t("notConfiguredBody")}
        </p>
      </div>
    </div>
  );
}
