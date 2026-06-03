/**
 * Core domain types for DojoTrack.
 *
 * These mirror the eventual Supabase/Postgres schema but are kept framework-agnostic
 * so they can be shared between client and server code. Timestamps are ISO strings.
 */

export type Discipline = "bjj" | "karate" | "judo" | "taekwondo" | "custom";

/** 0 = Sunday … 6 = Saturday (matches JS `Date.getDay()`). */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** A single rank within a belt system (e.g. "Blue Belt", "1st Dan"). */
export interface BeltRank {
  id: string;
  name: string;
  /** Hex colour of the belt, e.g. "#2563EB". */
  color: string;
  /** Position in the progression, starting at 0 (lowest rank). */
  order: number;
  /** Max number of stripes/degrees this belt can hold (BJJ-style systems). */
  stripes?: number;
  /** Skills/curriculum a student must demonstrate to earn this rank. */
  requirements: string[];
}

/** An ordered ranking system for a discipline. */
export interface BeltSystem {
  id: string;
  name: string;
  discipline: Discipline;
  belts: BeltRank[];
}

/** A martial arts club / dojo — the top-level tenant. */
export interface Club {
  id: string;
  name: string;
  /** URL-safe identifier used for the public club page: /club/[slug]. */
  slug: string;
  address: string;
  disciplines: Discipline[];
  /** Id of the `BeltSystem` this club uses for progression. */
  beltSystem: string;
  createdAt: string;
}

/** An enrolled student / member of a club. */
export interface Student {
  id: string;
  clubId: string;
  name: string;
  phone: string;
  email?: string;
  /** Id of the student's current `BeltRank`. */
  beltRank: string;
  joinDate: string;
  medicalNotes?: string;
  /** Links related members (e.g. siblings, parent+child) for family billing. */
  familyId?: string;
}

/** A recurring class on the weekly schedule. */
export interface ClassSchedule {
  id: string;
  clubId: string;
  name: string;
  dayOfWeek: DayOfWeek;
  /** 24h "HH:mm". */
  startTime: string;
  /** 24h "HH:mm". */
  endTime: string;
  instructor: string;
  discipline: Discipline;
  maxStudents: number;
}

/** A check-in record for a student at a given class on a given date. */
export interface Attendance {
  id: string;
  classId: string;
  studentId: string;
  /** ISO date "YYYY-MM-DD". */
  date: string;
  checkedIn: boolean;
}
