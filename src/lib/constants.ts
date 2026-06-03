import type { BeltRank, BeltSystem, Discipline } from "@/types";

export const BRAND = {
  name: "DojoTrack",
  tagline: "Martial arts club management, simplified.",
  email: "hello@dojotrack.app",
  url: "https://dojotrack.app",
} as const;

/** Brand palette. Teal is the primary brand colour; navy is used for text/headings. */
export const COLORS = {
  teal: "#0d9488",
  navy: "#1e3a5f",
  gold: "#d4a843",
} as const;

/** Canonical belt colours, reused across belt systems. */
const BELT_COLORS = {
  white: "#F1F5F9",
  yellow: "#FACC15",
  orange: "#F97316",
  green: "#16A34A",
  blue: "#2563EB",
  purple: "#7C3AED",
  brown: "#78350F",
  red: "#DC2626",
  black: "#111827",
} as const;

interface BeltDef {
  name: string;
  color: string;
  /** Max stripes/degrees for this belt (omit if the system has no stripes). */
  stripes?: number;
  requirements?: string[];
}

/** Build a fully-formed, ordered `BeltRank[]` from terse definitions. */
function ranks(systemId: string, belts: BeltDef[]): BeltRank[] {
  return belts.map((b, i) => ({
    id: `${systemId}-${String(i).padStart(2, "0")}`,
    name: b.name,
    color: b.color,
    order: i,
    stripes: b.stripes,
    requirements: b.requirements ?? [],
  }));
}

/**
 * Belt progression systems keyed by discipline.
 * Requirements are intentionally left empty here — clubs define their own
 * curriculum per rank in a later sprint.
 */
export const BELT_SYSTEMS: Record<Discipline, BeltSystem> = {
  // Brazilian Jiu-Jitsu — adult IBJJF belts, each carrying 0–4 stripes.
  bjj: {
    id: "bjj",
    name: "Brazilian Jiu-Jitsu",
    discipline: "bjj",
    belts: ranks("bjj", [
      { name: "White Belt", color: BELT_COLORS.white, stripes: 4 },
      { name: "Blue Belt", color: BELT_COLORS.blue, stripes: 4 },
      { name: "Purple Belt", color: BELT_COLORS.purple, stripes: 4 },
      { name: "Brown Belt", color: BELT_COLORS.brown, stripes: 4 },
      { name: "Black Belt", color: BELT_COLORS.black, stripes: 6 },
    ]),
  },

  // Karate — 10 kyu (white → brown) then 10 dan (black).
  karate: {
    id: "karate",
    name: "Karate",
    discipline: "karate",
    belts: ranks("karate", [
      { name: "White Belt (10th Kyu)", color: BELT_COLORS.white },
      { name: "Yellow Belt (9th Kyu)", color: BELT_COLORS.yellow },
      { name: "Orange Belt (8th Kyu)", color: BELT_COLORS.orange },
      { name: "Green Belt (7th Kyu)", color: BELT_COLORS.green },
      { name: "Blue Belt (6th Kyu)", color: BELT_COLORS.blue },
      { name: "Purple Belt (5th Kyu)", color: BELT_COLORS.purple },
      { name: "Brown Belt (4th Kyu)", color: BELT_COLORS.brown },
      { name: "Brown Belt (3rd Kyu)", color: BELT_COLORS.brown },
      { name: "Brown Belt (2nd Kyu)", color: BELT_COLORS.brown },
      { name: "Brown Belt (1st Kyu)", color: BELT_COLORS.brown },
      { name: "Black Belt (1st Dan)", color: BELT_COLORS.black },
      { name: "Black Belt (2nd Dan)", color: BELT_COLORS.black },
      { name: "Black Belt (3rd Dan)", color: BELT_COLORS.black },
      { name: "Black Belt (4th Dan)", color: BELT_COLORS.black },
      { name: "Black Belt (5th Dan)", color: BELT_COLORS.black },
      { name: "Black Belt (6th Dan)", color: BELT_COLORS.black },
      { name: "Black Belt (7th Dan)", color: BELT_COLORS.black },
      { name: "Black Belt (8th Dan)", color: BELT_COLORS.black },
      { name: "Black Belt (9th Dan)", color: BELT_COLORS.black },
      { name: "Black Belt (10th Dan)", color: BELT_COLORS.black },
    ]),
  },

  // Judo — 6 kyu (white → brown) then 10 dan (black), Kodokan-style.
  judo: {
    id: "judo",
    name: "Judo",
    discipline: "judo",
    belts: ranks("judo", [
      { name: "White Belt (6th Kyu)", color: BELT_COLORS.white },
      { name: "Yellow Belt (5th Kyu)", color: BELT_COLORS.yellow },
      { name: "Orange Belt (4th Kyu)", color: BELT_COLORS.orange },
      { name: "Green Belt (3rd Kyu)", color: BELT_COLORS.green },
      { name: "Blue Belt (2nd Kyu)", color: BELT_COLORS.blue },
      { name: "Brown Belt (1st Kyu)", color: BELT_COLORS.brown },
      { name: "Black Belt (1st Dan)", color: BELT_COLORS.black },
      { name: "Black Belt (2nd Dan)", color: BELT_COLORS.black },
      { name: "Black Belt (3rd Dan)", color: BELT_COLORS.black },
      { name: "Black Belt (4th Dan)", color: BELT_COLORS.black },
      { name: "Black Belt (5th Dan)", color: BELT_COLORS.black },
      { name: "Black Belt (6th Dan)", color: BELT_COLORS.black },
      { name: "Black Belt (7th Dan)", color: BELT_COLORS.black },
      { name: "Black Belt (8th Dan)", color: BELT_COLORS.black },
      { name: "Black Belt (9th Dan)", color: BELT_COLORS.black },
      { name: "Black Belt (10th Dan)", color: BELT_COLORS.black },
    ]),
  },

  // Taekwondo — simplified colour progression.
  taekwondo: {
    id: "taekwondo",
    name: "Taekwondo",
    discipline: "taekwondo",
    belts: ranks("taekwondo", [
      { name: "White Belt", color: BELT_COLORS.white },
      { name: "Yellow Belt", color: BELT_COLORS.yellow },
      { name: "Green Belt", color: BELT_COLORS.green },
      { name: "Blue Belt", color: BELT_COLORS.blue },
      { name: "Red Belt", color: BELT_COLORS.red },
      { name: "Black Belt", color: BELT_COLORS.black },
    ]),
  },

  // Custom — empty template a club fills in with its own ranks.
  custom: {
    id: "custom",
    name: "Custom",
    discipline: "custom",
    belts: [],
  },
};

/** Disciplines available when creating a club, with display metadata. */
export const DISCIPLINES: {
  value: Discipline;
  label: string;
  emoji: string;
}[] = [
  { value: "bjj", label: "Brazilian Jiu-Jitsu", emoji: "🥋" },
  { value: "karate", label: "Karate", emoji: "🥋" },
  { value: "judo", label: "Judo", emoji: "🥋" },
  { value: "taekwondo", label: "Taekwondo", emoji: "🥋" },
  { value: "custom", label: "Custom", emoji: "⚙️" },
];
