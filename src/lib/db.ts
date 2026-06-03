/**
 * Database availability gate.
 *
 * Like the Supabase helpers from Sprint 1, the data layer is a no-op when the
 * database isn't configured (e.g. local dev or `next build` with no `.env`).
 * Server components and route handlers call this before touching Prisma so the
 * app stays buildable and browsable with empty data instead of crashing.
 */
export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.startsWith("postgres"));
}
