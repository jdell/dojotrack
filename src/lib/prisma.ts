import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Prisma client singleton. Connects to Supabase Postgres through the pooled
 * `DATABASE_URL` via the pg driver adapter. Reused across hot-reloads in dev so
 * we don't exhaust the connection pool.
 *
 * The client is created lazily and only when `DATABASE_URL` is set — pages and
 * route handlers gate on `isDbConfigured()` (see `src/lib/db.ts`) so the app
 * stays buildable and browsable without a database, matching the Supabase
 * no-op behaviour from Sprint 1.
 */
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL!;
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
