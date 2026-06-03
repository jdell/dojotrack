import { defineConfig } from "prisma/config";

export default defineConfig({
  datasource: {
    // Direct (port 5432) connection — used ONLY by the Prisma CLI for
    // `migrate` / `generate`. The app itself connects via the pooled
    // DATABASE_URL through the driver adapter in `src/lib/prisma.ts`.
    //
    // Resolved leniently (not via `env()`) so `prisma generate` succeeds in
    // environments without a database configured — generate never connects.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
