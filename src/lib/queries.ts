/**
 * Server-side data access for DojoTrack.
 *
 * Every function gates on `isDbConfigured()` and swallows connection errors,
 * returning empty/null results so pages render an empty state rather than
 * crashing when no database is attached. Results are mapped to plain,
 * serializable DTOs (ISO date strings) so they can be passed straight into
 * client components.
 *
 * NOTE: import this only from server components, route handlers, or server
 * actions — never from `"use client"` modules.
 */
import { prisma } from "./prisma";
import { isDbConfigured } from "./db";
import { BELT_SYSTEMS, DISCIPLINES } from "./constants";
import {
  dayOfDate,
  nextOccurrence,
  nextOccurrences,
  startOfDay,
  weekIndex,
} from "./schedule";
import type { Discipline } from "@/types";
import type {
  BookingStatus,
  CheckinMethod,
  ClassLevel,
  ClassSession,
  DayOfWeek,
} from "@prisma/client";

export interface ClubSummary {
  id: string;
  name: string;
  slug: string;
  beltSystemId: string | null;
  disciplines: string[];
}

export interface StudentRow {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  beltName: string | null;
  beltColor: string | null;
  joinDate: string;
  familyId: string | null;
  familyName: string | null;
  active: boolean;
}

export interface BeltOption {
  /** Real `BeltRank.id` when sourced from the DB, otherwise a constant id. */
  id: string;
  name: string;
  color: string;
  /** True when this option maps to a real row and is safe to persist as an FK. */
  persistable: boolean;
}

export interface FamilyOption {
  id: string;
  name: string;
}

export interface PublicClub {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  disciplines: { value: string; label: string; emoji: string }[];
  address: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  instructors: { id: string; name: string; role: string }[];
}

/**
 * The club the signed-in user manages. Auth → club mapping arrives in a later
 * sprint; for now DojoTrack is effectively single-tenant, so we return the
 * first (oldest) club. Returns null when unconfigured or empty.
 */
export async function getCurrentClub(): Promise<ClubSummary | null> {
  if (!isDbConfigured()) return null;
  try {
    const club = await prisma.club.findFirst({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        beltSystemId: true,
        disciplines: true,
      },
    });
    return club;
  } catch {
    return null;
  }
}

/** Roster rows for a club, newest members first. */
export async function getStudents(clubId: string): Promise<StudentRow[]> {
  if (!isDbConfigured()) return [];
  try {
    const students = await prisma.student.findMany({
      where: { clubId },
      orderBy: { createdAt: "desc" },
      include: {
        beltRank: { select: { name: true, hexColor: true } },
        family: { select: { id: true, name: true } },
      },
    });
    return students.map((s) => ({
      id: s.id,
      fullName: s.fullName,
      email: s.email,
      phone: s.phone,
      beltName: s.beltRank?.name ?? null,
      beltColor: s.beltRank?.hexColor ?? null,
      joinDate: s.joinDate.toISOString(),
      familyId: s.familyId,
      familyName: s.family?.name ?? null,
      active: s.active,
    }));
  } catch {
    return [];
  }
}

/**
 * Belt options for the add-student dropdown. Prefers the club's own
 * `BeltRank` rows; falls back to the built-in belt system constants (by the
 * club's belt system / first discipline) so the form is usable before any
 * ranks have been seeded. Constant-sourced options are flagged
 * `persistable: false` and are stored as a null FK on submit.
 */
export async function getBeltOptions(
  club: ClubSummary | null,
): Promise<BeltOption[]> {
  if (club && isDbConfigured()) {
    try {
      const ranks = await prisma.beltRank.findMany({
        where: { clubId: club.id },
        orderBy: { order: "asc" },
        select: { id: true, name: true, hexColor: true },
      });
      if (ranks.length > 0) {
        return ranks.map((r) => ({
          id: r.id,
          name: r.name,
          color: r.hexColor,
          persistable: true,
        }));
      }
    } catch {
      // fall through to constants
    }
  }
  return fallbackBeltOptions(club);
}

/** Belt options from the built-in constants for a club's discipline. */
function fallbackBeltOptions(club: ClubSummary | null): BeltOption[] {
  const key = (club?.beltSystemId ??
    club?.disciplines?.[0] ??
    "bjj") as Discipline;
  const system = BELT_SYSTEMS[key] ?? BELT_SYSTEMS.bjj;
  return system.belts.map((b) => ({
    id: b.id,
    name: b.name,
    color: b.color,
    persistable: false,
  }));
}

/** Families belonging to a club, alphabetical. */
export async function getFamilies(clubId: string): Promise<FamilyOption[]> {
  if (!isDbConfigured()) return [];
  try {
    const families = await prisma.family.findMany({
      where: { clubId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
    return families;
  } catch {
    return [];
  }
}

/** Public club profile for /club/[slug] and the public API. */
export async function getClubBySlug(slug: string): Promise<PublicClub | null> {
  if (!isDbConfigured()) return null;
  try {
    const club = await prisma.club.findUnique({
      where: { slug },
      include: {
        users: {
          where: { role: { in: ["OWNER", "INSTRUCTOR"] } },
          select: { id: true, fullName: true, role: true },
        },
      },
    });
    if (!club) return null;
    return {
      id: club.id,
      name: club.name,
      slug: club.slug,
      description: club.description,
      disciplines: club.disciplines.map(toDisciplineTag),
      address: club.address,
      city: club.city,
      country: club.country,
      phone: club.phone,
      email: club.email,
      instructors: club.users.map((u) => ({
        id: u.id,
        name: u.fullName ?? "Instructor",
        role: u.role,
      })),
    };
  } catch {
    return null;
  }
}

/** Map a stored discipline value to display metadata, tolerating unknowns. */
function toDisciplineTag(value: string) {
  const known = DISCIPLINES.find((d) => d.value === value);
  return known ?? { value, label: value, emoji: "🥋" };
}

// ─────────────────────────────────────────────────────────────────────────────
// Classes, sessions, bookings & attendance (Sprint 3)
// ─────────────────────────────────────────────────────────────────────────────

/** Instructor/owner dropdown options for the add-class form. */
export interface InstructorOption {
  id: string;
  name: string;
}

/** Instructors and owners of a club, for assigning to classes. */
export async function getInstructorOptions(
  clubId: string,
): Promise<InstructorOption[]> {
  if (!isDbConfigured()) return [];
  try {
    const users = await prisma.user.findMany({
      where: { clubId, role: { in: ["OWNER", "INSTRUCTOR"] } },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true },
    });
    return users.map((u) => ({ id: u.id, name: u.fullName ?? "Instructor" }));
  } catch {
    return [];
  }
}

export interface CurrentStudent {
  id: string;
  fullName: string;
}

/**
 * The "acting" student for the booking UI. Real auth → student mapping arrives
 * in a later sprint; until then — mirroring `getCurrentClub` — we treat the
 * club's oldest active member as the demo booker so the student-facing booking
 * flow can be exercised end-to-end.
 */
export async function getCurrentStudent(
  clubId: string,
): Promise<CurrentStudent | null> {
  if (!isDbConfigured()) return null;
  try {
    const student = await prisma.student.findFirst({
      where: { clubId, active: true },
      orderBy: { createdAt: "asc" },
      select: { id: true, fullName: true },
    });
    return student;
  } catch {
    return null;
  }
}

/** A class as shown on the weekly schedule / list view. */
export interface ClassCard {
  id: string;
  name: string;
  discipline: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  level: ClassLevel;
  maxStudents: number;
  location: string | null;
  instructorName: string | null;
  enrolledCount: number;
  isFull: boolean;
  nextSessionId: string | null;
  nextSessionDate: string | null;
  /** The current (demo) student's booking status for the next session, if any. */
  bookingStatus: BookingStatus | null;
  /** 1-based waitlist position when the current student is waitlisted. */
  waitlistPosition: number | null;
}

/**
 * All active classes for a club, each enriched with the next session's
 * enrolment count and — when `currentStudentId` is given — that student's
 * booking status, so the schedule can show "Booked"/waitlist state.
 */
export async function getClassSchedules(
  clubId: string,
  currentStudentId?: string | null,
): Promise<ClassCard[]> {
  if (!isDbConfigured()) return [];
  try {
    const schedules = await prisma.classSchedule.findMany({
      where: { clubId, active: true },
      orderBy: [{ startTime: "asc" }, { name: "asc" }],
      include: {
        instructor: { select: { fullName: true } },
        sessions: {
          where: { date: { gte: startOfDay(new Date()) }, cancelled: false },
          orderBy: { date: "asc" },
          take: 1,
          include: {
            bookings: {
              where: { status: { in: ["BOOKED", "WAITLISTED"] } },
              orderBy: { bookedAt: "asc" },
              select: { studentId: true, status: true },
            },
          },
        },
      },
    });
    return schedules.map((s) => {
      const next = s.sessions[0];
      const bookings = next?.bookings ?? [];
      const booked = bookings.filter((b) => b.status === "BOOKED");
      const waitlist = bookings.filter((b) => b.status === "WAITLISTED");
      const mine = currentStudentId
        ? bookings.find((b) => b.studentId === currentStudentId)
        : undefined;
      const waitlistPosition =
        mine?.status === "WAITLISTED"
          ? waitlist.findIndex((b) => b.studentId === currentStudentId) + 1
          : null;
      return {
        id: s.id,
        name: s.name,
        discipline: s.discipline,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        level: s.level,
        maxStudents: s.maxStudents,
        location: s.location,
        instructorName: s.instructor?.fullName ?? null,
        enrolledCount: booked.length,
        isFull: booked.length >= s.maxStudents,
        nextSessionId: next?.id ?? null,
        nextSessionDate: next ? next.date.toISOString() : null,
        bookingStatus: mine?.status ?? null,
        waitlistPosition,
      };
    });
  } catch {
    return [];
  }
}

/** A single enrolled/attended student within a session. */
export interface SessionBookingRow {
  /** Booking id, or null for a drop-in (attended without booking). */
  bookingId: string | null;
  studentId: string;
  studentName: string;
  /** null for a drop-in. */
  status: BookingStatus | null;
  checkedIn: boolean;
  checkedInAt: string | null;
  method: CheckinMethod | null;
}

export interface SessionDetail {
  id: string;
  date: string;
  cancelled: boolean;
  cancelReason: string | null;
  enrolledCount: number;
  checkedInCount: number;
  bookings: SessionBookingRow[];
}

export interface ClassDetail {
  id: string;
  name: string;
  discipline: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  level: ClassLevel;
  maxStudents: number;
  location: string | null;
  instructorName: string | null;
  sessions: SessionDetail[];
  stats: { totalSessions: number; avgFillRate: number; totalCheckins: number };
}

/** How many upcoming occurrences the detail page surfaces and materialises. */
const UPCOMING_SESSION_COUNT = 4;

/**
 * Find-or-create the dated occurrence of a schedule. Idempotent thanks to the
 * `(classScheduleId, date)` unique constraint, so repeated calls with the same
 * deterministic date return the existing row.
 */
export async function ensureSession(
  classScheduleId: string,
  date: Date,
): Promise<ClassSession> {
  return prisma.classSession.upsert({
    where: { classScheduleId_date: { classScheduleId, date } },
    update: {},
    create: { classScheduleId, date },
  });
}

/** Find-or-create the next upcoming occurrence of a schedule by id. */
export async function ensureNextSession(
  classScheduleId: string,
): Promise<ClassSession | null> {
  const schedule = await prisma.classSchedule.findUnique({
    where: { id: classScheduleId },
    select: { id: true, dayOfWeek: true, startTime: true },
  });
  if (!schedule) return null;
  return ensureSession(
    schedule.id,
    nextOccurrence(schedule.dayOfWeek, schedule.startTime),
  );
}

/**
 * Full detail for one class: its upcoming sessions (materialised so they can be
 * booked/checked-in against), each session's enrolled students with check-in
 * status, plus attendance stats across the sessions held so far.
 */
export async function getClassDetail(id: string): Promise<ClassDetail | null> {
  if (!isDbConfigured()) return null;
  try {
    const schedule = await prisma.classSchedule.findUnique({
      where: { id },
      include: { instructor: { select: { fullName: true } } },
    });
    if (!schedule) return null;

    // Materialise upcoming occurrences so they carry stable ids.
    const dates = nextOccurrences(
      schedule.dayOfWeek,
      schedule.startTime,
      UPCOMING_SESSION_COUNT,
    );
    await Promise.all(dates.map((d) => ensureSession(schedule.id, d)));

    const sessions = await prisma.classSession.findMany({
      where: { classScheduleId: id, date: { gte: startOfDay(new Date()) } },
      orderBy: { date: "asc" },
      take: UPCOMING_SESSION_COUNT,
      include: {
        bookings: {
          where: { status: { in: ["BOOKED", "WAITLISTED"] } },
          orderBy: { bookedAt: "asc" },
          include: { student: { select: { id: true, fullName: true } } },
        },
        attendances: {
          include: { student: { select: { id: true, fullName: true } } },
        },
      },
    });

    const sessionDetails: SessionDetail[] = sessions.map((sess) => {
      const attendanceByStudent = new Map(
        sess.attendances.map((a) => [a.studentId, a]),
      );
      const rows: SessionBookingRow[] = sess.bookings.map((b) => {
        const att = attendanceByStudent.get(b.studentId);
        return {
          bookingId: b.id,
          studentId: b.studentId,
          studentName: b.student.fullName,
          status: b.status,
          checkedIn: Boolean(att),
          checkedInAt: att ? att.checkedInAt.toISOString() : null,
          method: att?.method ?? null,
        };
      });
      // Drop-ins: checked in without a booking on record.
      const bookedIds = new Set(sess.bookings.map((b) => b.studentId));
      for (const a of sess.attendances) {
        if (bookedIds.has(a.studentId)) continue;
        rows.push({
          bookingId: null,
          studentId: a.studentId,
          studentName: a.student.fullName,
          status: null,
          checkedIn: true,
          checkedInAt: a.checkedInAt.toISOString(),
          method: a.method,
        });
      }
      return {
        id: sess.id,
        date: sess.date.toISOString(),
        cancelled: sess.cancelled,
        cancelReason: sess.cancelReason,
        enrolledCount: sess.bookings.filter((b) => b.status === "BOOKED").length,
        checkedInCount: sess.attendances.length,
        bookings: rows,
      };
    });

    // Stats over sessions that have already happened.
    const heldSessions = await prisma.classSession.findMany({
      where: { classScheduleId: id, date: { lt: new Date() } },
      select: { _count: { select: { attendances: true } } },
    });
    const totalSessions = heldSessions.length;
    const totalCheckins = heldSessions.reduce(
      (sum, s) => sum + s._count.attendances,
      0,
    );
    const avgFillRate =
      totalSessions > 0 && schedule.maxStudents > 0
        ? totalCheckins / (totalSessions * schedule.maxStudents)
        : 0;

    return {
      id: schedule.id,
      name: schedule.name,
      discipline: schedule.discipline,
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      level: schedule.level,
      maxStudents: schedule.maxStudents,
      location: schedule.location,
      instructorName: schedule.instructor?.fullName ?? null,
      sessions: sessionDetails,
      stats: { totalSessions, avgFillRate, totalCheckins },
    };
  } catch {
    return null;
  }
}

/** A class session as presented on the public self-check-in page. */
export interface CheckinSession {
  id: string;
  date: string;
  cancelled: boolean;
  className: string;
  discipline: string;
  clubName: string;
  students: { id: string; fullName: string; alreadyCheckedIn: boolean }[];
}

/** Load a session for the public /checkin/[sessionId] page. */
export async function getSessionForCheckin(
  sessionId: string,
): Promise<CheckinSession | null> {
  if (!isDbConfigured()) return null;
  try {
    const session = await prisma.classSession.findUnique({
      where: { id: sessionId },
      include: {
        attendances: { select: { studentId: true } },
        classSchedule: {
          select: {
            name: true,
            discipline: true,
            clubId: true,
            club: { select: { name: true } },
          },
        },
      },
    });
    if (!session) return null;
    const checkedIn = new Set(session.attendances.map((a) => a.studentId));
    const students = await prisma.student.findMany({
      where: { clubId: session.classSchedule.clubId, active: true },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true },
    });
    return {
      id: session.id,
      date: session.date.toISOString(),
      cancelled: session.cancelled,
      className: session.classSchedule.name,
      discipline: session.classSchedule.discipline,
      clubName: session.classSchedule.club.name,
      students: students.map((s) => ({
        id: s.id,
        fullName: s.fullName,
        alreadyCheckedIn: checkedIn.has(s.id),
      })),
    };
  } catch {
    return null;
  }
}

export interface AttendanceHistoryItem {
  id: string;
  date: string;
  className: string;
  discipline: string;
  method: CheckinMethod;
}

export interface StudentProfile {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  beltName: string | null;
  beltColor: string | null;
  joinDate: string;
  active: boolean;
  totalClasses: number;
  /** Consecutive weeks (ending this or last week) with at least one check-in. */
  streakWeeks: number;
  history: AttendanceHistoryItem[];
}

/** A student's attendance profile: history, streak, and totals. */
export async function getStudentProfile(
  id: string,
): Promise<StudentProfile | null> {
  if (!isDbConfigured()) return null;
  try {
    const student = await prisma.student.findUnique({
      where: { id },
      include: { beltRank: { select: { name: true, hexColor: true } } },
    });
    if (!student) return null;

    const attendances = await prisma.attendance.findMany({
      where: { studentId: id },
      orderBy: { checkedInAt: "desc" },
      include: {
        classSession: {
          include: {
            classSchedule: { select: { name: true, discipline: true } },
          },
        },
      },
    });

    const history: AttendanceHistoryItem[] = attendances.map((a) => ({
      id: a.id,
      date: a.checkedInAt.toISOString(),
      className: a.classSession.classSchedule.name,
      discipline: a.classSession.classSchedule.discipline,
      method: a.method,
    }));

    // Current streak: walk back from this (or last) week while every week has
    // at least one check-in.
    const weeks = new Set(attendances.map((a) => weekIndex(a.checkedInAt)));
    const current = weekIndex(new Date());
    let streakWeeks = 0;
    let w = weeks.has(current) ? current : current - 1;
    while (weeks.has(w)) {
      streakWeeks++;
      w--;
    }

    return {
      id: student.id,
      fullName: student.fullName,
      email: student.email,
      phone: student.phone,
      beltName: student.beltRank?.name ?? null,
      beltColor: student.beltRank?.hexColor ?? null,
      joinDate: student.joinDate.toISOString(),
      active: student.active,
      totalClasses: attendances.length,
      streakWeeks,
      history,
    };
  } catch {
    return null;
  }
}

export interface DashboardTodayClass {
  id: string;
  name: string;
  discipline: string;
  startTime: string;
  endTime: string;
  maxStudents: number;
  enrolledCount: number;
  checkedInCount: number;
}

export interface DashboardData {
  totalStudents: number;
  classesThisWeek: number;
  todayClasses: DashboardTodayClass[];
}

/** Headline metrics + today's classes with live check-in counts. */
export async function getDashboard(clubId: string): Promise<DashboardData> {
  const empty: DashboardData = {
    totalStudents: 0,
    classesThisWeek: 0,
    todayClasses: [],
  };
  if (!isDbConfigured()) return empty;
  try {
    const today = startOfDay(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [totalStudents, classesThisWeek, schedules] = await Promise.all([
      prisma.student.count({ where: { clubId, active: true } }),
      prisma.classSchedule.count({ where: { clubId, active: true } }),
      prisma.classSchedule.findMany({
        where: { clubId, active: true, dayOfWeek: dayOfDate(new Date()) },
        orderBy: { startTime: "asc" },
        include: {
          sessions: {
            where: { date: { gte: today, lt: tomorrow } },
            take: 1,
            include: {
              _count: { select: { attendances: true } },
              bookings: { where: { status: "BOOKED" }, select: { id: true } },
            },
          },
        },
      }),
    ]);

    const todayClasses: DashboardTodayClass[] = schedules.map((s) => {
      const sess = s.sessions[0];
      return {
        id: s.id,
        name: s.name,
        discipline: s.discipline,
        startTime: s.startTime,
        endTime: s.endTime,
        maxStudents: s.maxStudents,
        enrolledCount: sess?.bookings.length ?? 0,
        checkedInCount: sess?._count.attendances ?? 0,
      };
    });

    return { totalStudents, classesThisWeek, todayClasses };
  } catch {
    return empty;
  }
}

export type InviteStatus =
  | "valid"
  | "accepted"
  | "expired"
  | "not_found"
  | "unavailable";

export interface InviteLookup {
  status: InviteStatus;
  clubName: string | null;
  clubSlug: string | null;
  unitLabel: string | null;
}

/**
 * Validate an invitation token for the public join page. Mirrors the logic in
 * the GET /api/invitations/[token] handler. Returns "unavailable" when the DB
 * isn't configured so the page can render a friendly placeholder.
 */
export async function getInvitationByToken(
  token: string,
): Promise<InviteLookup> {
  const empty = { clubName: null, clubSlug: null, unitLabel: null };
  if (!isDbConfigured()) return { status: "unavailable", ...empty };
  try {
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: { club: { select: { name: true, slug: true } } },
    });
    if (!invitation) return { status: "not_found", ...empty };

    const base = {
      clubName: invitation.club.name,
      clubSlug: invitation.club.slug,
      unitLabel: invitation.unitLabel,
    };
    if (invitation.status === "ACCEPTED")
      return { status: "accepted", ...base };

    const expired =
      invitation.status === "EXPIRED" ||
      (invitation.expiresAt !== null && invitation.expiresAt < new Date());
    if (expired) return { status: "expired", ...base };

    return { status: "valid", ...base };
  } catch {
    return { status: "unavailable", ...empty };
  }
}
