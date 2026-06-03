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
import type { Discipline } from "@/types";

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
