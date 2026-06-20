/**
 * Platform tier enforcement for EntrenaDojo.
 *
 * The FREE tier gives clubs access to core features (roster, scheduling, belts,
 * attendance) with a 30-student cap. PRO unlocks unlimited students, Stripe
 * Connect, competitions, sparring, grading exams, and email notifications.
 *
 * NOTE: import this from server or client code — it contains no server-only
 * dependencies.
 */

/** Features that require the PRO tier. */
export type ProFeature =
  | "unlimited_students"
  | "stripe_connect"
  | "competitions"
  | "sparring"
  | "exams"
  | "email_notifications";

/** The student cap on the FREE tier. */
export const FREE_STUDENT_LIMIT = 30;

/** Monthly price in USD for the PRO tier. */
export const PRO_PRICE_MONTHLY = 29;

const PRO_FEATURES = new Set<ProFeature>([
  "unlimited_students",
  "stripe_connect",
  "competitions",
  "sparring",
  "exams",
  "email_notifications",
]);

/** Whether a feature name requires the PRO tier. */
export function isProFeature(feature: string): boolean {
  return PRO_FEATURES.has(feature as ProFeature);
}

/** Whether a club's tier grants access to a given feature. */
export function clubCanAccess(
  clubTier: "FREE" | "PRO",
  feature: ProFeature,
): boolean {
  if (clubTier === "PRO") return true;
  return !PRO_FEATURES.has(feature);
}

/**
 * Whether a FREE-tier club has hit the student cap. Returns false for PRO clubs
 * (unlimited). Callers pass the current active student count.
 */
export function isAtStudentLimit(
  clubTier: "FREE" | "PRO",
  activeStudentCount: number,
): boolean {
  if (clubTier === "PRO") return false;
  return activeStudentCount >= FREE_STUDENT_LIMIT;
}
