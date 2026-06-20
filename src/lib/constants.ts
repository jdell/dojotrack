import type { BeltRank, BeltSystem, Discipline } from "@/types";

export const BRAND = {
  name: "EntrenaDojo",
  tagline: "Martial arts club management, simplified.",
  email: "hello@entrenadojo.es",
  url: "https://entrenadojo.es",
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
  midnightBlue: "#191970",
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
 *
 * System names below are English fallbacks. Translated names are available
 * via the "BeltSystems" namespace in the message catalog (messages/en.json,
 * es.json, gl.json). Use `t(systemId)` with a `useTranslations("BeltSystems")`
 * or `getTranslations("BeltSystems")` call where i18n context is available.
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

  // Aikido — 6 kyu (white → brown) then 10 dan (black).
  aikido: {
    id: "aikido",
    name: "Aikido",
    discipline: "aikido",
    belts: ranks("aikido", [
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

  // Kung Fu — coloured sashes (no degrees) up to a black sash with 10 degrees.
  kung_fu: {
    id: "kung_fu",
    name: "Kung Fu",
    discipline: "kung_fu",
    belts: ranks("kung_fu", [
      { name: "White Sash", color: BELT_COLORS.white },
      { name: "Yellow Sash", color: BELT_COLORS.yellow },
      { name: "Orange Sash", color: BELT_COLORS.orange },
      { name: "Green Sash", color: BELT_COLORS.green },
      { name: "Blue Sash", color: BELT_COLORS.blue },
      { name: "Purple Sash", color: BELT_COLORS.purple },
      { name: "Brown Sash", color: BELT_COLORS.brown },
      { name: "Red Sash", color: BELT_COLORS.red },
      { name: "Black Sash (1st Degree)", color: BELT_COLORS.black },
      { name: "Black Sash (2nd Degree)", color: BELT_COLORS.black },
      { name: "Black Sash (3rd Degree)", color: BELT_COLORS.black },
      { name: "Black Sash (4th Degree)", color: BELT_COLORS.black },
      { name: "Black Sash (5th Degree)", color: BELT_COLORS.black },
      { name: "Black Sash (6th Degree)", color: BELT_COLORS.black },
      { name: "Black Sash (7th Degree)", color: BELT_COLORS.black },
      { name: "Black Sash (8th Degree)", color: BELT_COLORS.black },
      { name: "Black Sash (9th Degree)", color: BELT_COLORS.black },
      { name: "Black Sash (10th Degree)", color: BELT_COLORS.black },
    ]),
  },

  // Krav Maga — 15 levels: Practitioner (P1–P5), Graduate (G1–G5), Expert (E1–E5).
  krav_maga: {
    id: "krav_maga",
    name: "Krav Maga",
    discipline: "krav_maga",
    belts: ranks("krav_maga", [
      { name: "Practitioner 1 (P1)", color: BELT_COLORS.white },
      { name: "Practitioner 2 (P2)", color: BELT_COLORS.yellow },
      { name: "Practitioner 3 (P3)", color: BELT_COLORS.yellow },
      { name: "Practitioner 4 (P4)", color: BELT_COLORS.orange },
      { name: "Practitioner 5 (P5)", color: BELT_COLORS.orange },
      { name: "Graduate 1 (G1)", color: BELT_COLORS.green },
      { name: "Graduate 2 (G2)", color: BELT_COLORS.green },
      { name: "Graduate 3 (G3)", color: BELT_COLORS.blue },
      { name: "Graduate 4 (G4)", color: BELT_COLORS.blue },
      { name: "Graduate 5 (G5)", color: BELT_COLORS.blue },
      { name: "Expert 1 (E1)", color: BELT_COLORS.brown },
      { name: "Expert 2 (E2)", color: BELT_COLORS.brown },
      { name: "Expert 3 (E3)", color: BELT_COLORS.black },
      { name: "Expert 4 (E4)", color: BELT_COLORS.black },
      { name: "Expert 5 (E5)", color: BELT_COLORS.black },
    ]),
  },

  // Hapkido — coloured gups (TKD-style) then 10 black-belt dan.
  hapkido: {
    id: "hapkido",
    name: "Hapkido",
    discipline: "hapkido",
    belts: ranks("hapkido", [
      { name: "White Belt (10th Gup)", color: BELT_COLORS.white },
      { name: "Yellow Belt (9th–8th Gup)", color: BELT_COLORS.yellow },
      { name: "Green Belt (7th–6th Gup)", color: BELT_COLORS.green },
      { name: "Blue Belt (5th–4th Gup)", color: BELT_COLORS.blue },
      { name: "Red Belt (3rd–1st Gup)", color: BELT_COLORS.red },
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

  // Capoeira — cordão/rope system (Grupo Capoeira Brasil lineage; colours vary).
  capoeira: {
    id: "capoeira",
    name: "Capoeira",
    discipline: "capoeira",
    belts: ranks("capoeira", [
      { name: "Raw (No Cordão)", color: "#D8CCA3" },
      { name: "Green Cord", color: BELT_COLORS.green },
      { name: "Yellow Cord", color: BELT_COLORS.yellow },
      { name: "Blue Cord", color: BELT_COLORS.blue },
      { name: "Green-Yellow Cord", color: "#88B82F" },
      { name: "Green-Purple Cord", color: "#496E9B" },
      { name: "Yellow-Blue Cord", color: "#8F9780" },
      { name: "Yellow-Purple Cord", color: "#BB8381" },
      { name: "Blue-Purple Cord", color: "#504EEC" },
      { name: "Red Cord", color: BELT_COLORS.red },
      { name: "White Cord (Mestre)", color: BELT_COLORS.white },
    ]),
  },

  // American Kenpo — Ed Parker system: colours, 3 brown degrees, 10 black degrees.
  american_kenpo: {
    id: "american_kenpo",
    name: "American Kenpo",
    discipline: "american_kenpo",
    belts: ranks("american_kenpo", [
      { name: "White Belt", color: BELT_COLORS.white },
      { name: "Yellow Belt", color: BELT_COLORS.yellow },
      { name: "Orange Belt", color: BELT_COLORS.orange },
      { name: "Purple Belt", color: BELT_COLORS.purple },
      { name: "Blue Belt", color: BELT_COLORS.blue },
      { name: "Green Belt", color: BELT_COLORS.green },
      { name: "Brown Belt (3rd Degree)", color: BELT_COLORS.brown },
      { name: "Brown Belt (2nd Degree)", color: BELT_COLORS.brown },
      { name: "Brown Belt (1st Degree)", color: BELT_COLORS.brown },
      { name: "Black Belt (1st Degree)", color: BELT_COLORS.black },
      { name: "Black Belt (2nd Degree)", color: BELT_COLORS.black },
      { name: "Black Belt (3rd Degree)", color: BELT_COLORS.black },
      { name: "Black Belt (4th Degree)", color: BELT_COLORS.black },
      { name: "Black Belt (5th Degree)", color: BELT_COLORS.black },
      { name: "Black Belt (6th Degree)", color: BELT_COLORS.black },
      { name: "Black Belt (7th Degree)", color: BELT_COLORS.black },
      { name: "Black Belt (8th Degree)", color: BELT_COLORS.black },
      { name: "Black Belt (9th Degree)", color: BELT_COLORS.black },
      { name: "Black Belt (10th Degree)", color: BELT_COLORS.black },
    ]),
  },

  // Tang Soo Do — coloured gups then Midnight Blue dan (traditional, not black).
  tang_soo_do: {
    id: "tang_soo_do",
    name: "Tang Soo Do",
    discipline: "tang_soo_do",
    belts: ranks("tang_soo_do", [
      { name: "White Belt (10th Gup)", color: BELT_COLORS.white },
      { name: "Orange Belt (9th Gup)", color: BELT_COLORS.orange },
      { name: "Yellow Belt (8th Gup)", color: BELT_COLORS.yellow },
      { name: "Green Belt (7th–6th Gup)", color: BELT_COLORS.green },
      { name: "Brown Belt (5th–4th Gup)", color: BELT_COLORS.brown },
      { name: "Red Belt (3rd–1st Gup)", color: BELT_COLORS.red },
      { name: "Midnight Blue Belt (1st Dan)", color: BELT_COLORS.midnightBlue },
      { name: "Midnight Blue Belt (2nd Dan)", color: BELT_COLORS.midnightBlue },
      { name: "Midnight Blue Belt (3rd Dan)", color: BELT_COLORS.midnightBlue },
      { name: "Midnight Blue Belt (4th Dan)", color: BELT_COLORS.midnightBlue },
      { name: "Midnight Blue Belt (5th Dan)", color: BELT_COLORS.midnightBlue },
      { name: "Midnight Blue Belt (6th Dan)", color: BELT_COLORS.midnightBlue },
      { name: "Midnight Blue Belt (7th Dan)", color: BELT_COLORS.midnightBlue },
      { name: "Midnight Blue Belt (8th Dan)", color: BELT_COLORS.midnightBlue },
      { name: "Midnight Blue Belt (9th Dan)", color: BELT_COLORS.midnightBlue },
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

// Discipline labels below are English fallbacks. Translated labels are available
// via the "Disciplines" namespace in the message catalog (messages/en.json,
// es.json, gl.json). Use `t(value)` with a `useTranslations("Disciplines")`
// or `getTranslations("Disciplines")` call where i18n context is available.

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
  { value: "aikido", label: "Aikido", emoji: "🥋" },
  { value: "kung_fu", label: "Kung Fu", emoji: "🥋" },
  { value: "krav_maga", label: "Krav Maga", emoji: "🥋" },
  { value: "hapkido", label: "Hapkido", emoji: "🥋" },
  { value: "capoeira", label: "Capoeira", emoji: "🥋" },
  { value: "american_kenpo", label: "American Kenpo", emoji: "🥋" },
  { value: "tang_soo_do", label: "Tang Soo Do", emoji: "🥋" },
  { value: "custom", label: "Custom", emoji: "⚙️" },
];

/**
 * A curated set of IANA timezones for the club settings dropdown. Not
 * exhaustive — covers the regions EntrenaDojo is most likely to serve. Stored on
 * `Club.timezone` and used to time class reminders.
 */
export const TIMEZONES = [
  "UTC",
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Madrid",
  "Europe/Berlin",
  "Africa/Johannesburg",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
] as const;

/** Display metadata for a stored discipline value, tolerating unknown values. */
export function disciplineMeta(value: string): {
  value: string;
  label: string;
  emoji: string;
} {
  return (
    DISCIPLINES.find((d) => d.value === value) ?? {
      value,
      label: value,
      emoji: "🥋",
    }
  );
}

// Requirement type labels below are English fallbacks. Translated labels are
// available via the "Belts.reqType" namespace in the message catalog
// (messages/en.json, es.json, gl.json). The UI reads translated labels from
// `t("reqType.TIME")` etc. with `useTranslations("Belts")` where i18n context
// is available. The `requirementTypeMeta` function returns only the constant
// (emoji, unit, auto flag); use the message catalog for display labels.

/**
 * The kinds of bar a belt requirement can set. TIME and CLASSES are computed
 * automatically from a student's record; the rest are graded by an instructor.
 * Matches the Prisma `RequirementType` enum.
 */
export const REQUIREMENT_TYPES: {
  value: "TIME" | "CLASSES" | "TECHNIQUE" | "COMPETITION" | "CUSTOM";
  label: string;
  /** Hint for the value entered against this type (null = no numeric target). */
  unit: string | null;
  /** True when progress is auto-derived rather than instructor-assessed. */
  auto: boolean;
  emoji: string;
}[] = [
  { value: "TIME", label: "Time at rank", unit: "months", auto: true, emoji: "⏳" },
  { value: "CLASSES", label: "Classes attended", unit: "classes", auto: true, emoji: "📅" },
  { value: "TECHNIQUE", label: "Technique", unit: null, auto: false, emoji: "🥋" },
  { value: "COMPETITION", label: "Competition", unit: "events", auto: false, emoji: "🏆" },
  { value: "CUSTOM", label: "Custom", unit: null, auto: false, emoji: "✦" },
];

/**
 * Billing cadence labels for payment plans. Matches the Prisma `BillingInterval`
 * enum. `short` is the suffix shown next to a price (e.g. "$49/mo").
 *
 * For translated labels, use `getBillingLabel(interval, t)` with a
 * next-intl translation function scoped to the `Payments.interval` namespace.
 */
export const BILLING_INTERVAL_LABELS: Record<
  "MONTHLY" | "QUARTERLY" | "ANNUAL" | "ONE_TIME",
  { label: string; short: string }
> = {
  MONTHLY: { label: "Monthly", short: "/mo" },
  QUARTERLY: { label: "Quarterly", short: "/qtr" },
  ANNUAL: { label: "Annual", short: "/yr" },
  ONE_TIME: { label: "One-time", short: "" },
};

/**
 * Return the translated billing interval label via next-intl. Pass a `t`
 * function scoped to the `Payments.interval` namespace (or the root
 * `Payments` namespace and prefix keys manually).
 *
 * Example usage in a client component:
 * ```ts
 * const t = useTranslations("Payments");
 * const label = getBillingLabel("MONTHLY", (key) => t(`interval.${key}`));
 * ```
 */
export function getBillingLabel(
  interval: string,
  t: (key: string) => string,
): string {
  const known = ["MONTHLY", "QUARTERLY", "ANNUAL", "ONE_TIME"];
  if (known.includes(interval)) return t(interval);
  return interval;
}

/** Display metadata for a stored requirement type, tolerating unknown values. */
export function requirementTypeMeta(value: string) {
  return (
    REQUIREMENT_TYPES.find((t) => t.value === value) ?? {
      value,
      label: value,
      unit: null,
      auto: false,
      emoji: "✦",
    }
  );
}
