/**
 * Server-side data access for EntrenaDojo.
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
import { isStripeConfigured } from "./stripe";
import { getAuthContext } from "./auth-context";
import { BELT_SYSTEMS, DISCIPLINES } from "./constants";
import {
  dayOfDate,
  nextOccurrence,
  nextOccurrences,
  startOfDay,
  weekIndex,
} from "./schedule";
import type { Discipline } from "@/types";
import type { SparringParticipant } from "./sparring";
import type {
  BillingInterval,
  BookingStatus,
  CandidateResult,
  CheckinMethod,
  ClassLevel,
  ClassSession,
  CompetitionStatus,
  DayOfWeek,
  ExamStatus,
  Medal,
  MembershipStatus,
  PaymentStatus,
  RequirementType,
  Role,
  TechniqueStatus,
} from "@prisma/client";

export interface ClubSummary {
  id: string;
  name: string;
  slug: string;
  beltSystemId: string | null;
  disciplines: string[];
  /** Club's preferred language for outbound email (en/es/gl), or null. */
  locale: string | null;
  /** ISO 4217 currency code (lowercase), e.g. "eur". */
  currency: string;
  tier: "FREE" | "PRO";
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
  attendanceCount: number;
  membershipStatus: MembershipStatus | null;
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
  logoUrl: string | null;
  websiteUrl: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  youtubeUrl: string | null;
  instructors: { id: string; name: string; role: string }[];
  classSchedules: {
    id: string;
    name: string;
    discipline: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    level: string;
    location: string | null;
    instructorName: string | null;
  }[];
}

/**
 * The club the signed-in user manages, resolved from the authenticated request
 * (Supabase session → `User.club`, see `auth-context.ts`). Every club-scoped
 * query below keys off the `id` returned here, so this is the single point that
 * enforces tenant isolation. Returns null when there's no session / no club, or
 * when the database or Supabase aren't configured.
 */
export async function getCurrentClub(): Promise<ClubSummary | null> {
  const ctx = await getAuthContext();
  if (!ctx) return null;
  const { club } = ctx;
  return {
    id: club.id,
    name: club.name,
    slug: club.slug,
    beltSystemId: club.beltSystemId,
    disciplines: club.disciplines,
    locale: club.locale,
    currency: club.currency ?? "eur",
    tier: club.tier,
  };
}

/** The signed-in user's EntrenaDojo account, or null when not authenticated. */
export interface CurrentUser {
  id: string;
  name: string;
  role: Role;
  clubId: string | null;
}

/**
 * The signed-in user's EntrenaDojo account (owner / instructor / student),
 * resolved from the authenticated request. Returns null when there's no
 * session or the user isn't linked to a club.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const ctx = await getAuthContext();
  if (!ctx) return null;
  const { user } = ctx;
  return {
    id: user.id,
    name: user.fullName ?? "Instructor",
    role: user.role,
    clubId: user.clubId,
  };
}

/** The full, editable profile for the current club's settings page. */
export interface ClubSettings {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  websiteUrl: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  youtubeUrl: string | null;
  timezone: string | null;
  /** ISO 4217 currency code (lowercase), e.g. "eur". */
  currency: string;
  description: string | null;
  beltSystemId: string | null;
  disciplines: string[];
  /** Stripe Connect: true when a connected account id is set. */
  stripeConnected: boolean;
  /** Stripe Connect: true when onboarding is complete (charges enabled). */
  stripeOnboarded: boolean;
}

/** Load the authenticated club's editable settings, or null when none. */
export async function getClubSettings(): Promise<ClubSettings | null> {
  const ctx = await getAuthContext();
  if (!ctx) return null;
  const c = ctx.club;
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    logoUrl: c.logoUrl,
    email: c.email,
    phone: c.phone,
    address: c.address,
    city: c.city,
    country: c.country,
    websiteUrl: c.websiteUrl,
    instagramUrl: c.instagramUrl,
    facebookUrl: c.facebookUrl,
    youtubeUrl: c.youtubeUrl,
    timezone: c.timezone,
    currency: c.currency ?? "eur",
    description: c.description,
    beltSystemId: c.beltSystemId,
    disciplines: c.disciplines,
    stripeConnected: Boolean(c.stripeAccountId),
    stripeOnboarded: c.stripeOnboarded,
  };
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
        _count: { select: { attendances: true } },
        memberships: {
          where: { status: { in: ["ACTIVE", "TRIALING", "PAST_DUE", "CANCELLED"] } },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { status: true },
        },
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
      attendanceCount: s._count.attendances,
      membershipStatus: s.memberships[0]?.status ?? null,
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

/** The built-in belt system a club maps to (by belt system id, else discipline). */
function clubBeltSystem(club: ClubSummary | null) {
  const key = (club?.beltSystemId ??
    club?.disciplines?.[0] ??
    "bjj") as Discipline;
  return BELT_SYSTEMS[key] ?? BELT_SYSTEMS.bjj;
}

/** Belt options from the built-in constants for a club's discipline. */
function fallbackBeltOptions(club: ClubSummary | null): BeltOption[] {
  return clubBeltSystem(club).belts.map((b) => ({
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
        classSchedules: {
          where: { active: true },
          orderBy: [{ startTime: "asc" }],
          include: {
            instructor: { select: { fullName: true } },
          },
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
      logoUrl: club.logoUrl,
      websiteUrl: club.websiteUrl,
      instagramUrl: club.instagramUrl,
      facebookUrl: club.facebookUrl,
      youtubeUrl: club.youtubeUrl,
      instructors: club.users.map((u) => ({
        id: u.id,
        name: u.fullName ?? "Instructor",
        role: u.role,
      })),
      classSchedules: club.classSchedules.map((cs) => ({
        id: cs.id,
        name: cs.name,
        discipline: cs.discipline,
        dayOfWeek: cs.dayOfWeek,
        startTime: cs.startTime,
        endTime: cs.endTime,
        level: cs.level,
        location: cs.location,
        instructorName: cs.instructor?.fullName ?? null,
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
 * The "acting" student for the booking UI. Prefers the `Student` linked to the
 * signed-in user (`Student.userId`) when there is one; otherwise falls back to
 * the club's oldest active member so the booking flow stays usable for an
 * instructor/owner viewing the schedule. Always scoped to `clubId`.
 */
export async function getCurrentStudent(
  clubId: string,
): Promise<CurrentStudent | null> {
  if (!isDbConfigured()) return null;
  try {
    const ctx = await getAuthContext();
    if (ctx && ctx.club.id === clubId) {
      const linked = await prisma.student.findFirst({
        where: { clubId, active: true, userId: ctx.user.id },
        select: { id: true, fullName: true },
      });
      if (linked) return linked;
    }
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
  instructorId: string | null;
  instructorName: string | null;
  active: boolean;
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
export async function getClassDetail(
  id: string,
  clubId: string,
): Promise<ClassDetail | null> {
  if (!isDbConfigured()) return null;
  try {
    const schedule = await prisma.classSchedule.findFirst({
      where: { id, clubId },
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
      instructorId: schedule.instructorId,
      instructorName: schedule.instructor?.fullName ?? null,
      active: schedule.active,
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

/** The editable fields of a student, for the edit form. */
export interface StudentEditData {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  /** `yyyy-mm-dd` for a native date input, or null. */
  dateOfBirth: string | null;
  beltRankId: string | null;
  weight: number | null;
  medicalNotes: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  familyId: string | null;
  active: boolean;
}

/** Load a single student's editable fields, scoped to the club, or null. */
export async function getStudentForEdit(
  id: string,
  clubId: string,
): Promise<StudentEditData | null> {
  if (!isDbConfigured()) return null;
  try {
    const s = await prisma.student.findFirst({
      where: { id, clubId },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        dateOfBirth: true,
        beltRankId: true,
        weight: true,
        medicalNotes: true,
        emergencyContact: true,
        emergencyPhone: true,
        familyId: true,
        active: true,
      },
    });
    if (!s) return null;
    return {
      id: s.id,
      fullName: s.fullName,
      phone: s.phone,
      email: s.email,
      dateOfBirth: s.dateOfBirth
        ? s.dateOfBirth.toISOString().slice(0, 10)
        : null,
      beltRankId: s.beltRankId,
      weight: s.weight,
      medicalNotes: s.medicalNotes,
      emergencyContact: s.emergencyContact,
      emergencyPhone: s.emergencyPhone,
      familyId: s.familyId,
      active: s.active,
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
  eligibleForPromotion: number;
  monthlyRevenue: number;
  currency: string;
  todayClasses: DashboardTodayClass[];
  upcomingExams: DashboardExam[];
}

/** Headline metrics + today's classes with live check-in counts. */
export async function getDashboard(clubId: string): Promise<DashboardData> {
  const clubRow = await prisma.club.findUnique({ where: { id: clubId }, select: { currency: true } }).catch(() => null);
  const clubCurrency = clubRow?.currency ?? "eur";
  const empty: DashboardData = {
    totalStudents: 0,
    classesThisWeek: 0,
    eligibleForPromotion: 0,
    monthlyRevenue: 0,
    currency: clubCurrency,
    todayClasses: [],
    upcomingExams: [],
  };
  if (!isDbConfigured()) return empty;
  try {
    const today = startOfDay(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalStudents,
      classesThisWeek,
      schedules,
      upcomingExams,
      eligibleForPromotion,
      monthRevenue,
    ] = await Promise.all([
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
      getUpcomingExams(clubId),
      countEligibleForPromotion(clubId),
      prisma.payment.aggregate({
        where: { clubId, status: "PAID", paidAt: { gte: monthStart } },
        _sum: { amount: true },
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

    return {
      totalStudents,
      classesThisWeek,
      eligibleForPromotion,
      monthlyRevenue: Number(monthRevenue._sum.amount ?? 0),
      currency: clubCurrency,
      todayClasses,
      upcomingExams,
    };
  } catch {
    return empty;
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// Onboarding status (Feature 5)
// ─────────────────────────────────────────────────────────────────────────────

export interface OnboardingStatus {
  hasProfile: boolean;
  hasBeltRanks: boolean;
  hasClasses: boolean;
  hasStudents: boolean;
  hasPaymentPlans: boolean;
  hasStripe: boolean;
}

/** Check completion of the six onboarding steps for the dashboard checklist. */
export async function getOnboardingStatus(
  clubId: string,
): Promise<OnboardingStatus> {
  const empty: OnboardingStatus = {
    hasProfile: false,
    hasBeltRanks: false,
    hasClasses: false,
    hasStudents: false,
    hasPaymentPlans: false,
    hasStripe: false,
  };
  if (!isDbConfigured()) return empty;
  try {
    const [club, beltRankCount, classCount, studentCount, planCount] =
      await Promise.all([
        prisma.club.findUnique({
          where: { id: clubId },
          select: {
            description: true,
            logoUrl: true,
            stripeOnboarded: true,
          },
        }),
        prisma.beltRank.count({ where: { clubId } }),
        prisma.classSchedule.count({ where: { clubId, active: true } }),
        prisma.student.count({ where: { clubId, active: true } }),
        prisma.paymentPlan.count({ where: { clubId, active: true } }),
      ]);
    return {
      hasProfile: Boolean(club?.description || club?.logoUrl),
      hasBeltRanks: beltRankCount > 0,
      hasClasses: classCount > 0,
      hasStudents: studentCount > 0,
      hasPaymentPlans: planCount > 0,
      hasStripe: club?.stripeOnboarded ?? false,
    };
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

// ─────────────────────────────────────────────────────────────────────────────
// Belt progression: requirements, technique assessment & grading (Sprint 4)
// ─────────────────────────────────────────────────────────────────────────────

/** Whole months between two dates (floored, never negative). */
function monthsBetween(from: Date, to: Date): number {
  let months =
    (to.getFullYear() - from.getFullYear()) * 12 +
    (to.getMonth() - from.getMonth());
  if (to.getDate() < from.getDate()) months -= 1;
  return Math.max(0, months);
}

/** A single belt requirement, serialised for the client. */
export interface RequirementDTO {
  id: string;
  beltRankId: string;
  name: string;
  description: string | null;
  type: RequirementType;
  targetValue: number | null;
  order: number;
  ageGroup: string;
}

/** Whether a requirement type is auto-computed (vs instructor-assessed). */
export function isAutoType(type: RequirementType): boolean {
  return type === "TIME" || type === "CLASSES";
}

export type ProgressState = "met" | "in_progress" | "not_met";

/** One requirement evaluated against a student's record. */
export interface RequirementProgress {
  requirement: RequirementDTO;
  state: ProgressState;
  /** Numeric progress for TIME/CLASSES (e.g. 12), else null. */
  current: number | null;
  /** Short human label, e.g. "12 / 18 months" or "In progress". */
  detail: string;
  /** Manual assessment status for TECHNIQUE/COMPETITION/CUSTOM, else null. */
  logStatus: TechniqueStatus | null;
}

interface ScoreContext {
  monthsAtBelt: number;
  totalClasses: number;
  logStatusByReqId: Map<string, TechniqueStatus>;
}

/** Pure scoring: evaluate a rank's requirements against a student's context. */
function scoreRequirements(
  requirements: RequirementDTO[],
  ctx: ScoreContext,
): { requirements: RequirementProgress[]; metCount: number; totalCount: number } {
  const scored = requirements.map((req): RequirementProgress => {
    if (req.type === "TIME") {
      const target = req.targetValue ?? 0;
      const met = ctx.monthsAtBelt >= target;
      return {
        requirement: req,
        state: met ? "met" : "not_met",
        current: ctx.monthsAtBelt,
        detail: `${ctx.monthsAtBelt} / ${target} months`,
        logStatus: null,
      };
    }
    if (req.type === "CLASSES") {
      const target = req.targetValue ?? 0;
      const met = ctx.totalClasses >= target;
      return {
        requirement: req,
        state: met ? "met" : "not_met",
        current: ctx.totalClasses,
        detail: `${ctx.totalClasses} / ${target} classes`,
        logStatus: null,
      };
    }
    // Manual: TECHNIQUE / COMPETITION / CUSTOM.
    const logStatus = ctx.logStatusByReqId.get(req.id) ?? "NOT_ASSESSED";
    const state: ProgressState =
      logStatus === "PASSED"
        ? "met"
        : logStatus === "IN_PROGRESS"
          ? "in_progress"
          : "not_met";
    const detail =
      logStatus === "PASSED"
        ? "Passed"
        : logStatus === "IN_PROGRESS"
          ? "In progress"
          : "Not assessed";
    return { requirement: req, state, current: null, detail, logStatus };
  });
  const metCount = scored.filter((s) => s.state === "met").length;
  return { requirements: scored, metCount, totalCount: scored.length };
}

interface StudentProgressInput {
  studentId: string;
  currentBeltRankId: string | null;
  joinDate: Date;
}

/**
 * Evaluate one student against a target rank's requirements, pulling the data
 * (attendance count, technique logs, promotion history) needed to do so.
 * `sinceDate` is when the student reached their *current* belt — the last exam
 * that awarded it, or their join date if none.
 */
async function evaluateStudent(
  student: StudentProgressInput,
  targetRequirements: RequirementDTO[],
): Promise<{
  requirements: RequirementProgress[];
  metCount: number;
  totalCount: number;
  monthsAtBelt: number;
  totalClasses: number;
  sinceDate: Date;
}> {
  const reqIds = targetRequirements.map((r) => r.id);
  const [totalClasses, logs, lastPromotion] = await Promise.all([
    prisma.attendance.count({ where: { studentId: student.studentId } }),
    reqIds.length > 0
      ? prisma.studentTechniqueLog.findMany({
          where: {
            studentId: student.studentId,
            beltRequirementId: { in: reqIds },
          },
          select: { beltRequirementId: true, status: true },
        })
      : Promise.resolve([]),
    student.currentBeltRankId
      ? prisma.gradingCandidate.findFirst({
          where: {
            studentId: student.studentId,
            result: "PASS",
            newBeltRankId: student.currentBeltRankId,
          },
          orderBy: { exam: { date: "desc" } },
          select: { exam: { select: { date: true } } },
        })
      : Promise.resolve(null),
  ]);

  const sinceDate = lastPromotion?.exam.date ?? student.joinDate;
  const logStatusByReqId = new Map(
    logs.map((l) => [l.beltRequirementId, l.status] as const),
  );
  const ctx: ScoreContext = {
    monthsAtBelt: monthsBetween(sinceDate, new Date()),
    totalClasses,
    logStatusByReqId,
  };
  const { requirements, metCount, totalCount } = scoreRequirements(
    targetRequirements,
    ctx,
  );
  return {
    requirements,
    metCount,
    totalCount,
    monthsAtBelt: ctx.monthsAtBelt,
    totalClasses,
    sinceDate,
  };
}

/** A student is ready when a next rank exists, has requirements, and all met. */
function isEligible(metCount: number, totalCount: number): boolean {
  return totalCount > 0 && metCount === totalCount;
}

/**
 * Seed a club's belt ranks from its built-in belt system the first time they're
 * needed, mirroring Sprint 3's lazy `ClassSession` materialisation. No-op when
 * ranks already exist, the DB is unconfigured, or the system has no belts.
 */
export async function ensureBeltRanks(club: ClubSummary): Promise<void> {
  if (!isDbConfigured()) return;
  try {
    const count = await prisma.beltRank.count({ where: { clubId: club.id } });
    if (count > 0) return;
    const system = clubBeltSystem(club);
    if (system.belts.length === 0) return;
    await prisma.beltRank.createMany({
      data: system.belts.map((b) => ({
        clubId: club.id,
        name: b.name,
        // The built-ins only carry a hex; store it for both fields.
        color: b.color,
        hexColor: b.color,
        order: b.order,
      })),
      skipDuplicates: true,
    });
  } catch {
    // Ignore — seeding is best-effort.
  }
}

export interface CurrentInstructor {
  id: string;
  name: string;
}

/**
 * The "acting" instructor for assessment/grading. Prefers the signed-in user
 * when they are an owner/instructor of this club so assessments are attributed
 * to whoever actually performed them; otherwise falls back to the club's first
 * owner/instructor. Always scoped to `clubId`.
 */
export async function getCurrentInstructor(
  clubId: string,
): Promise<CurrentInstructor | null> {
  if (!isDbConfigured()) return null;
  try {
    const ctx = await getAuthContext();
    if (
      ctx &&
      ctx.club.id === clubId &&
      (ctx.user.role === "OWNER" || ctx.user.role === "INSTRUCTOR")
    ) {
      return { id: ctx.user.id, name: ctx.user.fullName ?? "Instructor" };
    }
    const user = await prisma.user.findFirst({
      where: { clubId, role: { in: ["OWNER", "INSTRUCTOR"] } },
      orderBy: { createdAt: "asc" },
      select: { id: true, fullName: true },
    });
    if (!user) return null;
    return { id: user.id, name: user.fullName ?? "Instructor" };
  } catch {
    return null;
  }
}

export interface BeltRankWithRequirements {
  id: string;
  name: string;
  color: string;
  order: number;
  studentCount: number;
  requirements: RequirementDTO[];
}

function toRequirementDTO(r: {
  id: string;
  beltRankId: string;
  name: string;
  description: string | null;
  type: RequirementType;
  targetValue: number | null;
  order: number;
  ageGroup: string;
}): RequirementDTO {
  return {
    id: r.id,
    beltRankId: r.beltRankId,
    name: r.name,
    description: r.description,
    type: r.type,
    targetValue: r.targetValue,
    order: r.order,
    ageGroup: r.ageGroup,
  };
}

/** Every belt rank for a club with its requirements and member count. */
export async function getBeltRanksWithRequirements(
  clubId: string,
): Promise<BeltRankWithRequirements[]> {
  if (!isDbConfigured()) return [];
  try {
    const ranks = await prisma.beltRank.findMany({
      where: { clubId },
      orderBy: { order: "asc" },
      include: {
        requirements: { orderBy: { order: "asc" } },
        _count: { select: { students: true } },
      },
    });
    return ranks.map((rank) => ({
      id: rank.id,
      name: rank.name,
      color: rank.hexColor,
      order: rank.order,
      studentCount: rank._count.students,
      requirements: rank.requirements.map(toRequirementDTO),
    }));
  } catch {
    return [];
  }
}

export interface RankCandidateRow {
  studentId: string;
  studentName: string;
  beltColor: string | null;
  metCount: number;
  totalCount: number;
  eligible: boolean;
  requirements: RequirementProgress[];
}

export interface RankDetail {
  id: string;
  name: string;
  color: string;
  order: number;
  requirements: RequirementDTO[];
  prevRankName: string | null;
  candidates: RankCandidateRow[];
}

/**
 * One belt rank in full: its requirements, plus every active student currently
 * at the rank below scored against those requirements (the eligible-candidate
 * pool, and the grid the bulk technique assessor writes to).
 */
export async function getRankDetail(rankId: string): Promise<RankDetail | null> {
  if (!isDbConfigured()) return null;
  try {
    const rank = await prisma.beltRank.findUnique({
      where: { id: rankId },
      include: { requirements: { orderBy: { order: "asc" } } },
    });
    if (!rank) return null;

    const prevRank =
      rank.order > 0
        ? await prisma.beltRank.findFirst({
            where: { clubId: rank.clubId, order: rank.order - 1 },
            select: { id: true, name: true },
          })
        : null;

    const requirements = rank.requirements.map(toRequirementDTO);

    const students = prevRank
      ? await prisma.student.findMany({
          where: { clubId: rank.clubId, beltRankId: prevRank.id, active: true },
          orderBy: { fullName: "asc" },
          include: { beltRank: { select: { hexColor: true } } },
        })
      : [];

    const candidates: RankCandidateRow[] = await Promise.all(
      students.map(async (s) => {
        const ev = await evaluateStudent(
          {
            studentId: s.id,
            currentBeltRankId: s.beltRankId,
            joinDate: s.joinDate,
          },
          requirements,
        );
        return {
          studentId: s.id,
          studentName: s.fullName,
          beltColor: s.beltRank?.hexColor ?? null,
          metCount: ev.metCount,
          totalCount: ev.totalCount,
          eligible: isEligible(ev.metCount, ev.totalCount),
          requirements: ev.requirements,
        };
      }),
    );

    return {
      id: rank.id,
      name: rank.name,
      color: rank.hexColor,
      order: rank.order,
      requirements,
      prevRankName: prevRank?.name ?? null,
      candidates,
    };
  } catch {
    return null;
  }
}

export interface BeltRef {
  id: string;
  name: string;
  color: string;
  order: number;
}

export interface BeltHistoryEntry {
  beltName: string;
  color: string;
  date: string;
  via: "enrollment" | "promotion";
  examId: string | null;
}

export interface BeltProgress {
  studentId: string;
  studentName: string;
  dateOfBirth: string | null;
  currentBelt: BeltRef | null;
  nextBelt: BeltRef | null;
  monthsAtCurrentBelt: number;
  totalClasses: number;
  sinceDate: string;
  requirements: RequirementProgress[];
  metCount: number;
  totalCount: number;
  eligible: boolean;
  history: BeltHistoryEntry[];
}

/**
 * A student's full progression: current/next belt, auto-computed time & class
 * totals, every next-belt requirement with its status, eligibility, and a belt
 * history timeline assembled from their passed gradings.
 */
export async function getBeltProgress(
  studentId: string,
  clubId: string,
): Promise<BeltProgress | null> {
  if (!isDbConfigured()) return null;
  try {
    const student = await prisma.student.findFirst({
      where: { id: studentId, clubId },
      include: { beltRank: true },
    });
    if (!student) return null;

    const ranks = await prisma.beltRank.findMany({
      where: { clubId: student.clubId },
      orderBy: { order: "asc" },
      include: { requirements: { orderBy: { order: "asc" } } },
    });
    const ranksById = new Map(ranks.map((r) => [r.id, r] as const));

    const currentRank = student.beltRankId
      ? ranksById.get(student.beltRankId)
      : undefined;
    const currentOrder = currentRank?.order ?? -1;
    const nextRank = ranks.find((r) => r.order === currentOrder + 1) ?? null;
    const nextRequirements = nextRank
      ? nextRank.requirements.map(toRequirementDTO)
      : [];

    const ev = await evaluateStudent(
      {
        studentId: student.id,
        currentBeltRankId: student.beltRankId,
        joinDate: student.joinDate,
      },
      nextRequirements,
    );

    // Belt history from passed gradings, oldest first.
    const passes = await prisma.gradingCandidate.findMany({
      where: { studentId: student.id, result: "PASS" },
      orderBy: { exam: { date: "asc" } },
      include: {
        exam: { select: { id: true, date: true } },
        newBeltRank: { select: { name: true, hexColor: true, order: true } },
      },
    });

    const history: BeltHistoryEntry[] = [];
    // Origin: the belt held at enrolment — inferred as one rank below the first
    // promotion, or the current belt if there were never any promotions.
    const enrolBelt =
      passes.length > 0 && passes[0].newBeltRank
        ? (ranks.find((r) => r.order === passes[0].newBeltRank!.order - 1) ??
          null)
        : (currentRank ?? null);
    if (enrolBelt) {
      history.push({
        beltName: enrolBelt.name,
        color: enrolBelt.hexColor,
        date: student.joinDate.toISOString(),
        via: "enrollment",
        examId: null,
      });
    }
    for (const p of passes) {
      if (!p.newBeltRank) continue;
      history.push({
        beltName: p.newBeltRank.name,
        color: p.newBeltRank.hexColor,
        date: p.exam.date.toISOString(),
        via: "promotion",
        examId: p.exam.id,
      });
    }

    const toRef = (r: {
      id: string;
      name: string;
      hexColor: string;
      order: number;
    }): BeltRef => ({
      id: r.id,
      name: r.name,
      color: r.hexColor,
      order: r.order,
    });

    return {
      studentId: student.id,
      studentName: student.fullName,
      dateOfBirth: student.dateOfBirth ? student.dateOfBirth.toISOString() : null,
      currentBelt: currentRank ? toRef(currentRank) : null,
      nextBelt: nextRank ? toRef(nextRank) : null,
      monthsAtCurrentBelt: ev.monthsAtBelt,
      totalClasses: ev.totalClasses,
      sinceDate: ev.sinceDate.toISOString(),
      requirements: ev.requirements,
      metCount: ev.metCount,
      totalCount: ev.totalCount,
      eligible: nextRank ? isEligible(ev.metCount, ev.totalCount) : false,
      history,
    };
  } catch {
    return null;
  }
}

export interface SuggestedCandidate {
  studentId: string;
  studentName: string;
  beltName: string | null;
  metCount: number;
  totalCount: number;
  eligible: boolean;
}

export interface ExamTargetOption {
  id: string;
  name: string;
  color: string;
  order: number;
}

export interface NewExamData {
  targets: ExamTargetOption[];
  targetRank: ExamTargetOption | null;
  prevRankName: string | null;
  suggestions: SuggestedCandidate[];
}

/**
 * Data for the create-exam form: every promotable rank (anything above the
 * lowest), and — once a target is chosen — the students at the rank below it
 * scored for promotion so the most-ready can be pre-selected.
 */
export async function getNewExamData(
  clubId: string,
  targetRankId?: string | null,
): Promise<NewExamData> {
  const empty: NewExamData = {
    targets: [],
    targetRank: null,
    prevRankName: null,
    suggestions: [],
  };
  if (!isDbConfigured()) return empty;
  try {
    const ranks = await prisma.beltRank.findMany({
      where: { clubId },
      orderBy: { order: "asc" },
      include: { requirements: { orderBy: { order: "asc" } } },
    });
    const targets: ExamTargetOption[] = ranks
      .filter((r) => r.order > 0)
      .map((r) => ({
        id: r.id,
        name: r.name,
        color: r.hexColor,
        order: r.order,
      }));

    const target =
      (targetRankId && ranks.find((r) => r.id === targetRankId)) ||
      (targets.length > 0
        ? ranks.find((r) => r.id === targets[0].id)
        : undefined) ||
      null;
    if (!target) return { ...empty, targets };

    const prevRank = ranks.find((r) => r.order === target.order - 1) ?? null;
    const requirements = target.requirements.map(toRequirementDTO);

    const students = prevRank
      ? await prisma.student.findMany({
          where: { clubId, beltRankId: prevRank.id, active: true },
          orderBy: { fullName: "asc" },
          select: { id: true, fullName: true, beltRankId: true, joinDate: true },
        })
      : [];

    const suggestions: SuggestedCandidate[] = await Promise.all(
      students.map(async (s) => {
        const ev = await evaluateStudent(
          {
            studentId: s.id,
            currentBeltRankId: s.beltRankId,
            joinDate: s.joinDate,
          },
          requirements,
        );
        return {
          studentId: s.id,
          studentName: s.fullName,
          beltName: prevRank?.name ?? null,
          metCount: ev.metCount,
          totalCount: ev.totalCount,
          eligible: isEligible(ev.metCount, ev.totalCount),
        };
      }),
    );
    // Most-ready first.
    suggestions.sort((a, b) => b.metCount - a.metCount);

    return {
      targets,
      targetRank: {
        id: target.id,
        name: target.name,
        color: target.hexColor,
        order: target.order,
      },
      prevRankName: prevRank?.name ?? null,
      suggestions,
    };
  } catch {
    return empty;
  }
}

export interface ExamRow {
  id: string;
  date: string;
  targetBeltName: string;
  targetBeltColor: string;
  location: string | null;
  status: ExamStatus;
  candidateCount: number;
  passCount: number;
}

/** A club's grading exams split into upcoming and past buckets. */
export async function getExams(
  clubId: string,
): Promise<{ upcoming: ExamRow[]; past: ExamRow[] }> {
  if (!isDbConfigured()) return { upcoming: [], past: [] };
  try {
    const exams = await prisma.gradingExam.findMany({
      where: { clubId },
      orderBy: { date: "desc" },
      include: {
        targetBeltRank: { select: { name: true, hexColor: true } },
        candidates: { select: { result: true } },
      },
    });
    const today = startOfDay(new Date());
    const upcoming: ExamRow[] = [];
    const past: ExamRow[] = [];
    for (const e of exams) {
      const row: ExamRow = {
        id: e.id,
        date: e.date.toISOString(),
        targetBeltName: e.targetBeltRank.name,
        targetBeltColor: e.targetBeltRank.hexColor,
        location: e.location,
        status: e.status,
        candidateCount: e.candidates.length,
        passCount: e.candidates.filter((c) => c.result === "PASS").length,
      };
      const isPast =
        e.status === "COMPLETED" ||
        e.status === "CANCELLED" ||
        e.date < today;
      (isPast ? past : upcoming).push(row);
    }
    // Upcoming should read soonest-first; past most-recent-first.
    upcoming.reverse();
    return { upcoming, past };
  } catch {
    return { upcoming: [], past: [] };
  }
}

export interface ExamCandidateRow {
  id: string;
  studentId: string;
  studentName: string;
  currentBeltName: string | null;
  currentBeltColor: string | null;
  result: CandidateResult;
  techniquesScore: number | null;
  sparringPassed: boolean | null;
  notes: string | null;
  metCount: number;
  totalCount: number;
  eligible: boolean;
}

export interface ExamDetail {
  id: string;
  date: string;
  location: string | null;
  fee: number | null;
  notes: string | null;
  status: ExamStatus;
  clubName: string;
  targetBeltId: string;
  targetBeltName: string;
  targetBeltColor: string;
  targetBeltOrder: number;
  candidates: ExamCandidateRow[];
}

/** Full grading-exam detail: candidates with their scores and readiness. */
export async function getExamDetail(
  examId: string,
  clubId: string,
): Promise<ExamDetail | null> {
  if (!isDbConfigured()) return null;
  try {
    const exam = await prisma.gradingExam.findFirst({
      where: { id: examId, clubId },
      include: {
        club: { select: { name: true } },
        targetBeltRank: {
          include: { requirements: { orderBy: { order: "asc" } } },
        },
        candidates: {
          orderBy: { student: { fullName: "asc" } },
          include: {
            student: {
              select: {
                id: true,
                fullName: true,
                beltRankId: true,
                joinDate: true,
                beltRank: { select: { name: true, hexColor: true } },
              },
            },
          },
        },
      },
    });
    if (!exam) return null;

    const requirements = exam.targetBeltRank.requirements.map(toRequirementDTO);

    const candidates: ExamCandidateRow[] = await Promise.all(
      exam.candidates.map(async (c) => {
        const ev = await evaluateStudent(
          {
            studentId: c.student.id,
            currentBeltRankId: c.student.beltRankId,
            joinDate: c.student.joinDate,
          },
          requirements,
        );
        return {
          id: c.id,
          studentId: c.studentId,
          studentName: c.student.fullName,
          currentBeltName: c.student.beltRank?.name ?? null,
          currentBeltColor: c.student.beltRank?.hexColor ?? null,
          result: c.result,
          techniquesScore: c.techniquesScore,
          sparringPassed: c.sparringPassed,
          notes: c.notes,
          metCount: ev.metCount,
          totalCount: ev.totalCount,
          eligible: isEligible(ev.metCount, ev.totalCount),
        };
      }),
    );

    return {
      id: exam.id,
      date: exam.date.toISOString(),
      location: exam.location,
      fee: exam.fee == null ? null : Number(exam.fee),
      notes: exam.notes,
      status: exam.status,
      clubName: exam.club.name,
      targetBeltId: exam.targetBeltRank.id,
      targetBeltName: exam.targetBeltRank.name,
      targetBeltColor: exam.targetBeltRank.hexColor,
      targetBeltOrder: exam.targetBeltRank.order,
      candidates,
    };
  } catch {
    return null;
  }
}

export interface CertificateData {
  candidateId: string;
  studentName: string;
  beltName: string;
  beltColor: string;
  clubName: string;
  date: string;
  instructorName: string;
  location: string | null;
  passed: boolean;
}

/** Data for a printable belt certificate (only meaningful once passed). */
export async function getCertificateData(
  candidateId: string,
): Promise<CertificateData | null> {
  if (!isDbConfigured()) return null;
  try {
    const candidate = await prisma.gradingCandidate.findUnique({
      where: { id: candidateId },
      include: {
        student: { select: { fullName: true } },
        newBeltRank: { select: { name: true, hexColor: true } },
        exam: {
          include: {
            club: { select: { id: true, name: true } },
            targetBeltRank: { select: { name: true, hexColor: true } },
          },
        },
      },
    });
    if (!candidate) return null;

    const instructor = await getCurrentInstructor(candidate.exam.club.id);
    const belt = candidate.newBeltRank ?? candidate.exam.targetBeltRank;

    return {
      candidateId: candidate.id,
      studentName: candidate.student.fullName,
      beltName: belt.name,
      beltColor: belt.hexColor,
      clubName: candidate.exam.club.name,
      date: candidate.exam.date.toISOString(),
      instructorName: instructor?.name ?? "Instructor",
      location: candidate.exam.location,
      passed: candidate.result === "PASS",
    };
  } catch {
    return null;
  }
}

/**
 * Count active students who are ready for their next belt (a next rank exists,
 * has requirements, and they're all met). Batched to avoid per-student queries.
 */
export async function countEligibleForPromotion(
  clubId: string,
): Promise<number> {
  if (!isDbConfigured()) return 0;
  try {
    const ranks = await prisma.beltRank.findMany({
      where: { clubId },
      orderBy: { order: "asc" },
      include: { requirements: { orderBy: { order: "asc" } } },
    });
    const nextOf = new Map<number, (typeof ranks)[number]>();
    for (const r of ranks) nextOf.set(r.order - 1, r);

    const students = await prisma.student.findMany({
      where: { clubId, active: true, beltRankId: { not: null } },
      select: { id: true, beltRankId: true, joinDate: true },
    });
    if (students.length === 0) return 0;

    const orderById = new Map(ranks.map((r) => [r.id, r.order] as const));

    // Batch the inputs the scorer needs across all students.
    const [attendanceGroups, logs, passes] = await Promise.all([
      prisma.attendance.groupBy({
        by: ["studentId"],
        where: { student: { clubId } },
        _count: { _all: true },
      }),
      prisma.studentTechniqueLog.findMany({
        where: { student: { clubId } },
        select: { studentId: true, beltRequirementId: true, status: true },
      }),
      prisma.gradingCandidate.findMany({
        where: { result: "PASS", student: { clubId } },
        orderBy: { exam: { date: "asc" } },
        select: {
          studentId: true,
          newBeltRankId: true,
          exam: { select: { date: true } },
        },
      }),
    ]);

    const classesByStudent = new Map(
      attendanceGroups.map((g) => [g.studentId, g._count._all] as const),
    );
    const logsByStudent = new Map<string, Map<string, TechniqueStatus>>();
    for (const l of logs) {
      let m = logsByStudent.get(l.studentId);
      if (!m) {
        m = new Map();
        logsByStudent.set(l.studentId, m);
      }
      m.set(l.beltRequirementId, l.status);
    }
    // Last promotion date per (student, awarded rank).
    const promoDate = new Map<string, Date>();
    for (const p of passes) {
      if (!p.newBeltRankId) continue;
      promoDate.set(`${p.studentId}:${p.newBeltRankId}`, p.exam.date);
    }

    let count = 0;
    for (const s of students) {
      const currentOrder = s.beltRankId
        ? (orderById.get(s.beltRankId) ?? -1)
        : -1;
      const next = nextOf.get(currentOrder);
      if (!next || next.requirements.length === 0) continue;
      const since =
        (s.beltRankId && promoDate.get(`${s.id}:${s.beltRankId}`)) ||
        s.joinDate;
      const ctx: ScoreContext = {
        monthsAtBelt: monthsBetween(since, new Date()),
        totalClasses: classesByStudent.get(s.id) ?? 0,
        logStatusByReqId: logsByStudent.get(s.id) ?? new Map(),
      };
      const { metCount, totalCount } = scoreRequirements(
        next.requirements.map(toRequirementDTO),
        ctx,
      );
      if (isEligible(metCount, totalCount)) count++;
    }
    return count;
  } catch {
    return 0;
  }
}

export interface DashboardExam {
  id: string;
  date: string;
  targetBeltName: string;
  targetBeltColor: string;
  candidateCount: number;
}

/** Upcoming scheduled gradings for the dashboard card. */
export async function getUpcomingExams(
  clubId: string,
  take = 4,
): Promise<DashboardExam[]> {
  if (!isDbConfigured()) return [];
  try {
    const exams = await prisma.gradingExam.findMany({
      where: {
        clubId,
        status: { in: ["SCHEDULED", "IN_PROGRESS"] },
        date: { gte: startOfDay(new Date()) },
      },
      orderBy: { date: "asc" },
      take,
      include: {
        targetBeltRank: { select: { name: true, hexColor: true } },
        _count: { select: { candidates: true } },
      },
    });
    return exams.map((e) => ({
      id: e.id,
      date: e.date.toISOString(),
      targetBeltName: e.targetBeltRank.name,
      targetBeltColor: e.targetBeltRank.hexColor,
      candidateCount: e._count.candidates,
    }));
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared option lists (Sprint 5)
// ─────────────────────────────────────────────────────────────────────────────

export interface StudentOption {
  id: string;
  name: string;
  beltName: string | null;
  beltColor: string | null;
}

/** Active members of a club for entry/checkout/competition dropdowns. */
export async function getStudentOptions(
  clubId: string,
): Promise<StudentOption[]> {
  if (!isDbConfigured()) return [];
  try {
    const students = await prisma.student.findMany({
      where: { clubId, active: true },
      orderBy: { fullName: "asc" },
      include: { beltRank: { select: { name: true, hexColor: true } } },
    });
    return students.map((s) => ({
      id: s.id,
      name: s.fullName,
      beltName: s.beltRank?.name ?? null,
      beltColor: s.beltRank?.hexColor ?? null,
    }));
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Payments (Sprint 5)
// ─────────────────────────────────────────────────────────────────────────────

export interface PaymentPlanRow {
  id: string;
  name: string;
  description: string | null;
  amount: number;
  currency: string;
  interval: BillingInterval;
  active: boolean;
  activeMembers: number;
}

export interface PaymentRow {
  id: string;
  studentName: string | null;
  planName: string | null;
  description: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: string | null;
  recordedByName: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface MemberRow {
  membershipId: string;
  studentId: string;
  studentName: string;
  planName: string;
  amount: number;
  interval: BillingInterval;
  status: MembershipStatus;
  currentPeriodEnd: string | null;
}

export interface PaymentDashboard {
  /** True when Stripe is wired up; gates the live checkout buttons. */
  stripeConfigured: boolean;
  currency: string;
  monthlyRevenue: number;
  totalCollected: number;
  activeMembers: number;
  pastDueCount: number;
  plans: PaymentPlanRow[];
  members: MemberRow[];
  recentPayments: PaymentRow[];
}

const ACTIVE_MEMBER_STATES: MembershipStatus[] = ["ACTIVE", "TRIALING"];

/** Plans, members, recent payments, and revenue rollups for /payments. */
export async function getPaymentDashboard(
  clubId: string,
): Promise<PaymentDashboard> {
  const clubRow = await prisma.club.findUnique({ where: { id: clubId }, select: { currency: true } }).catch(() => null);
  const clubCurrency = clubRow?.currency ?? "eur";
  const empty: PaymentDashboard = {
    stripeConfigured: isStripeConfigured(),
    currency: clubCurrency,
    monthlyRevenue: 0,
    totalCollected: 0,
    activeMembers: 0,
    pastDueCount: 0,
    plans: [],
    members: [],
    recentPayments: [],
  };
  if (!isDbConfigured()) return empty;
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [plans, totalAgg, monthAgg, payments, memberships] =
      await Promise.all([
        prisma.paymentPlan.findMany({
          where: { clubId },
          orderBy: [{ active: "desc" }, { createdAt: "asc" }],
        }),
        prisma.payment.aggregate({
          where: { clubId, status: "PAID" },
          _sum: { amount: true },
        }),
        prisma.payment.aggregate({
          where: { clubId, status: "PAID", paidAt: { gte: monthStart } },
          _sum: { amount: true },
        }),
        prisma.payment.findMany({
          where: { clubId },
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            student: { select: { fullName: true } },
            plan: { select: { name: true } },
            recordedBy: { select: { fullName: true } },
          },
        }),
        prisma.membership.findMany({
          where: {
            clubId,
            status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] },
          },
          orderBy: { createdAt: "desc" },
          include: {
            student: { select: { id: true, fullName: true } },
            plan: {
              select: { name: true, amount: true, interval: true },
            },
          },
        }),
      ]);

    const currency = plans[0]?.currency ?? clubCurrency;
    // Active members per plan, derived from the memberships we already loaded.
    const activeByPlan = new Map<string, number>();
    for (const m of memberships) {
      if (!ACTIVE_MEMBER_STATES.includes(m.status)) continue;
      activeByPlan.set(m.planId, (activeByPlan.get(m.planId) ?? 0) + 1);
    }
    const members: MemberRow[] = memberships.map((m) => ({
      membershipId: m.id,
      studentId: m.studentId,
      studentName: m.student.fullName,
      planName: m.plan.name,
      amount: Number(m.plan.amount),
      interval: m.plan.interval,
      status: m.status,
      currentPeriodEnd: m.currentPeriodEnd
        ? m.currentPeriodEnd.toISOString()
        : null,
    }));

    return {
      stripeConfigured: isStripeConfigured(),
      currency,
      monthlyRevenue: Number(monthAgg._sum.amount ?? 0),
      totalCollected: Number(totalAgg._sum.amount ?? 0),
      activeMembers: members.filter((m) =>
        ACTIVE_MEMBER_STATES.includes(m.status),
      ).length,
      pastDueCount: members.filter((m) => m.status === "PAST_DUE").length,
      plans: plans.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        amount: Number(p.amount),
        currency: p.currency,
        interval: p.interval,
        active: p.active,
        activeMembers: activeByPlan.get(p.id) ?? 0,
      })),
      members,
      recentPayments: payments.map((p) => ({
        id: p.id,
        studentName: p.student?.fullName ?? null,
        planName: p.plan?.name ?? null,
        description: p.description,
        amount: Number(p.amount),
        currency: p.currency,
        status: p.status,
        paymentMethod: p.paymentMethod,
        recordedByName: p.recordedBy?.fullName ?? null,
        paidAt: p.paidAt ? p.paidAt.toISOString() : null,
        createdAt: p.createdAt.toISOString(),
      })),
    };
  } catch {
    return empty;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Competitions (Sprint 5)
// ─────────────────────────────────────────────────────────────────────────────

export interface CompetitionRow {
  id: string;
  name: string;
  discipline: string | null;
  date: string;
  location: string | null;
  status: CompetitionStatus;
  entryCount: number;
  medalCount: number;
}

/** A club's competitions split into upcoming and past buckets. */
export async function getCompetitions(
  clubId: string,
): Promise<{ upcoming: CompetitionRow[]; past: CompetitionRow[] }> {
  if (!isDbConfigured()) return { upcoming: [], past: [] };
  try {
    const competitions = await prisma.competition.findMany({
      where: { clubId },
      orderBy: { date: "desc" },
      include: { entries: { select: { medal: true } } },
    });
    const today = startOfDay(new Date());
    const upcoming: CompetitionRow[] = [];
    const past: CompetitionRow[] = [];
    for (const c of competitions) {
      const row: CompetitionRow = {
        id: c.id,
        name: c.name,
        discipline: c.discipline,
        date: c.date.toISOString(),
        location: c.location,
        status: c.status,
        entryCount: c.entries.length,
        medalCount: c.entries.filter((e) => e.medal !== "NONE").length,
      };
      const isPast =
        c.status === "COMPLETED" ||
        c.status === "CANCELLED" ||
        c.date < today;
      (isPast ? past : upcoming).push(row);
    }
    upcoming.reverse();
    return { upcoming, past };
  } catch {
    return { upcoming: [], past: [] };
  }
}

export interface CompetitionEntryRow {
  id: string;
  studentId: string;
  studentName: string;
  beltName: string | null;
  beltColor: string | null;
  division: string | null;
  weightClass: string | null;
  placement: number | null;
  medal: Medal;
  wins: number;
  losses: number;
  notes: string | null;
}

export interface CompetitionDetail {
  id: string;
  name: string;
  discipline: string | null;
  date: string;
  location: string | null;
  description: string | null;
  status: CompetitionStatus;
  entries: CompetitionEntryRow[];
  medalTally: { gold: number; silver: number; bronze: number };
}

/** Full competition detail: entries with student belt info and a medal tally. */
export async function getCompetitionDetail(
  id: string,
  clubId: string,
): Promise<CompetitionDetail | null> {
  if (!isDbConfigured()) return null;
  try {
    const competition = await prisma.competition.findFirst({
      where: { id, clubId },
      include: {
        entries: {
          orderBy: [{ placement: "asc" }, { student: { fullName: "asc" } }],
          include: {
            student: {
              select: {
                id: true,
                fullName: true,
                beltRank: { select: { name: true, hexColor: true } },
              },
            },
          },
        },
      },
    });
    if (!competition) return null;

    const entries: CompetitionEntryRow[] = competition.entries.map((e) => ({
      id: e.id,
      studentId: e.studentId,
      studentName: e.student.fullName,
      beltName: e.student.beltRank?.name ?? null,
      beltColor: e.student.beltRank?.hexColor ?? null,
      division: e.division,
      weightClass: e.weightClass,
      placement: e.placement,
      medal: e.medal,
      wins: e.wins,
      losses: e.losses,
      notes: e.notes,
    }));

    return {
      id: competition.id,
      name: competition.name,
      discipline: competition.discipline,
      date: competition.date.toISOString(),
      location: competition.location,
      description: competition.description,
      status: competition.status,
      entries,
      medalTally: {
        gold: entries.filter((e) => e.medal === "GOLD").length,
        silver: entries.filter((e) => e.medal === "SILVER").length,
        bronze: entries.filter((e) => e.medal === "BRONZE").length,
      },
    };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sparring (Sprint 5)
// ─────────────────────────────────────────────────────────────────────────────

export interface SparringRosterStudent extends SparringParticipant {
  beltName: string | null;
  beltColor: string | null;
}

/**
 * Active students as sparring participants, carrying belt order for the pairing
 * algorithm plus belt name/colour for the picker UI. Weight isn't tracked yet,
 * so pairing falls back to belt proximity alone.
 */
export async function getSparringRoster(
  clubId: string,
): Promise<SparringRosterStudent[]> {
  if (!isDbConfigured()) return [];
  try {
    const students = await prisma.student.findMany({
      where: { clubId, active: true },
      orderBy: { fullName: "asc" },
      include: { beltRank: { select: { name: true, hexColor: true, order: true } } },
    });
    return students.map((s) => ({
      id: s.id,
      name: s.fullName,
      beltOrder: s.beltRank?.order ?? null,
      weight: null,
      beltName: s.beltRank?.name ?? null,
      beltColor: s.beltRank?.hexColor ?? null,
    }));
  } catch {
    return [];
  }
}

export interface SparringSessionRow {
  id: string;
  name: string | null;
  discipline: string | null;
  date: string;
  rounds: number;
  pairCount: number;
  participantCount: number;
}

/** A club's sparring sessions, newest first, with pair/participant counts. */
export async function getSparringSessions(
  clubId: string,
): Promise<SparringSessionRow[]> {
  if (!isDbConfigured()) return [];
  try {
    const sessions = await prisma.sparringSession.findMany({
      where: { clubId },
      orderBy: { date: "desc" },
      include: { pairs: { select: { studentAId: true, studentBId: true } } },
    });
    return sessions.map((s) => {
      const participants = new Set<string>();
      for (const p of s.pairs) {
        participants.add(p.studentAId);
        if (p.studentBId) participants.add(p.studentBId);
      }
      return {
        id: s.id,
        name: s.name,
        discipline: s.discipline,
        date: s.date.toISOString(),
        rounds: s.rounds,
        pairCount: s.pairs.length,
        participantCount: participants.size,
      };
    });
  } catch {
    return [];
  }
}

export interface SparringPairRow {
  id: string;
  round: number;
  mat: number | null;
  studentAId: string;
  studentAName: string;
  studentABelt: string | null;
  studentAColor: string | null;
  studentBId: string | null;
  studentBName: string | null;
  studentBBelt: string | null;
  studentBColor: string | null;
}

export interface SparringSessionDetail {
  id: string;
  name: string | null;
  discipline: string | null;
  date: string;
  rounds: number;
  notes: string | null;
  pairs: SparringPairRow[];
}

/** Full sparring session detail: every pairing with both fighters' belt info. */
export async function getSparringSessionDetail(
  id: string,
  clubId: string,
): Promise<SparringSessionDetail | null> {
  if (!isDbConfigured()) return null;
  try {
    const session = await prisma.sparringSession.findFirst({
      where: { id, clubId },
      include: {
        pairs: {
          orderBy: [{ round: "asc" }, { mat: "asc" }],
          include: {
            studentA: {
              select: {
                id: true,
                fullName: true,
                beltRank: { select: { name: true, hexColor: true } },
              },
            },
            studentB: {
              select: {
                id: true,
                fullName: true,
                beltRank: { select: { name: true, hexColor: true } },
              },
            },
          },
        },
      },
    });
    if (!session) return null;
    return {
      id: session.id,
      name: session.name,
      discipline: session.discipline,
      date: session.date.toISOString(),
      rounds: session.rounds,
      notes: session.notes,
      pairs: session.pairs.map((p) => ({
        id: p.id,
        round: p.round,
        mat: p.mat,
        studentAId: p.studentAId,
        studentAName: p.studentA.fullName,
        studentABelt: p.studentA.beltRank?.name ?? null,
        studentAColor: p.studentA.beltRank?.hexColor ?? null,
        studentBId: p.studentBId,
        studentBName: p.studentB?.fullName ?? null,
        studentBBelt: p.studentB?.beltRank?.name ?? null,
        studentBColor: p.studentB?.beltRank?.hexColor ?? null,
      })),
    };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public payment links (shareable checkout)
// ─────────────────────────────────────────────────────────────────────────────

export interface PublicPaymentPlan {
  id: string;
  name: string;
  description: string | null;
  amount: number;
  currency: string;
  interval: BillingInterval;
}

export interface PublicPaymentClub {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  stripeAccountId: string | null;
  stripeOnboarded: boolean;
  platformFeePercent: number;
}

export interface PublicPaymentData {
  club: PublicPaymentClub;
  plans: PublicPaymentPlan[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Student self-service portal (My profile)
// ─────────────────────────────────────────────────────────────────────────────

export interface MyMembership {
  id: string;
  planName: string;
  status: MembershipStatus;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  interval: BillingInterval;
  amount: number;
  currency: string;
}

export interface MyAttendance {
  id: string;
  date: string;
  className: string;
  discipline: string;
  method: CheckinMethod;
}

export interface MyStudentProfile {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  beltName: string | null;
  beltColor: string | null;
  joinDate: string;
  clubName: string;
  memberships: MyMembership[];
  recentAttendance: MyAttendance[];
}

/**
 * Load the student record linked to a given user id within a club. Returns the
 * student's profile, active memberships (with plan details), and the 10 most
 * recent attendances. Used by the /my self-service portal so students see only
 * their own data.
 */
export async function getMyStudentProfile(
  userId: string,
  clubId: string,
): Promise<MyStudentProfile | null> {
  if (!isDbConfigured()) return null;
  try {
    const student = await prisma.student.findFirst({
      where: { userId, clubId, active: true },
      include: {
        beltRank: { select: { name: true, hexColor: true } },
        club: { select: { name: true } },
        memberships: {
          where: { status: { in: ["ACTIVE", "TRIALING", "PAST_DUE", "INCOMPLETE"] } },
          orderBy: { createdAt: "desc" },
          include: {
            plan: {
              select: { name: true, interval: true, amount: true, currency: true },
            },
          },
        },
      },
    });
    if (!student) return null;

    const attendances = await prisma.attendance.findMany({
      where: { studentId: student.id },
      orderBy: { checkedInAt: "desc" },
      take: 10,
      include: {
        classSession: {
          include: {
            classSchedule: { select: { name: true, discipline: true } },
          },
        },
      },
    });

    return {
      id: student.id,
      fullName: student.fullName,
      email: student.email,
      phone: student.phone,
      beltName: student.beltRank?.name ?? null,
      beltColor: student.beltRank?.hexColor ?? null,
      joinDate: student.joinDate.toISOString(),
      clubName: student.club.name,
      memberships: student.memberships.map((m) => ({
        id: m.id,
        planName: m.plan.name,
        status: m.status,
        currentPeriodEnd: m.currentPeriodEnd
          ? m.currentPeriodEnd.toISOString()
          : null,
        cancelAtPeriodEnd: m.cancelAtPeriodEnd,
        interval: m.plan.interval,
        amount: Number(m.plan.amount),
        currency: m.plan.currency,
      })),
      recentAttendance: attendances.map((a) => ({
        id: a.id,
        date: a.checkedInAt.toISOString(),
        className: a.classSession.classSchedule.name,
        discipline: a.classSession.classSchedule.discipline,
        method: a.method,
      })),
    };
  } catch {
    return null;
  }
}

/**
 * Fetch a club and its active payment plans by slug, for the public /pay/[slug]
 * page. No auth required — this is public data. Always returns all active plans
 * so the user can browse; the `planId` param is only used for pre-selection on
 * the client.
 */
export async function getPublicPaymentData(
  slug: string,
  _planId?: string | null,
): Promise<PublicPaymentData | null> {
  if (!isDbConfigured()) return null;
  try {
    const club = await prisma.club.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        stripeAccountId: true,
        stripeOnboarded: true,
        platformFeePercent: true,
      },
    });
    if (!club) return null;

    const plans = await prisma.paymentPlan.findMany({
      where: { clubId: club.id, active: true },
      orderBy: { createdAt: "asc" },
    });

    return {
      club: {
        id: club.id,
        name: club.name,
        slug: club.slug,
        logoUrl: club.logoUrl,
        stripeAccountId: club.stripeAccountId,
        stripeOnboarded: club.stripeOnboarded,
        platformFeePercent: Number(club.platformFeePercent),
      },
      plans: plans.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        amount: Number(p.amount),
        currency: p.currency,
        interval: p.interval,
      })),
    };
  } catch {
    return null;
  }
}
