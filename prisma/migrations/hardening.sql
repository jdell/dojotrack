-- =============================================================================
-- EntrenaDojo — Security Hardening Migration
-- Project ref: yzphvcacijvgegybtukh
--
-- Resolves the Supabase database-linter advisors:
--   0011_function_search_path_mutable
--       https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable
--       → public.set_updated_at() had no search_path pinned (role-mutable).
--   0028_anon_security_definer_function_executable
--   0029_authenticated_security_definer_function_executable
--       → public.user_club_id() and public.rls_auto_enable() are SECURITY DEFINER
--         yet EXECUTEable by anon / authenticated, i.e. reachable via PostgREST
--         POST /rest/v1/rpc/<name>. They are internal helpers, never meant to be
--         called directly.
--
-- Every statement is idempotent — this file is safe to re-run.
--
-- Why each REVOKE also names PUBLIC:
--   Postgres grants EXECUTE to PUBLIC automatically when a function is created,
--   and Supabase additionally grants it to anon + authenticated. Revoking from
--   only anon + authenticated leaves the PUBLIC grant intact, so both roles would
--   STILL resolve EXECUTE through PUBLIC (verified against the live database) and
--   the advisor would not clear. PUBLIC must be included.
--
-- Why this is safe for this project:
--   All application data access runs through Prisma as the `postgres` role
--   (rolbypassrls = true), which bypasses RLS and therefore never invokes
--   user_club_id(). The Supabase anon/authenticated client is used for auth only
--   (no .from()/.rpc() data queries against application tables), so no live code
--   path depends on anon/authenticated holding EXECUTE on these helpers. The
--   function owner (postgres) and service_role retain EXECUTE, so RLS continues
--   to work for any service-role / direct connection.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. set_updated_at() — pin the search_path (lint 0011).
--    The body references only NEW and CURRENT_TIMESTAMP (a reserved keyword that
--    needs no schema resolution), so an empty search_path is both safe and the
--    most hardened choice.
-- -----------------------------------------------------------------------------
ALTER FUNCTION public.set_updated_at() SET search_path = '';

-- -----------------------------------------------------------------------------
-- 2. user_club_id() — SECURITY DEFINER RLS helper (lints 0028 / 0029).
--    Revoke EXECUTE from the public API roles so it can no longer be called via
--    /rest/v1/rpc/user_club_id. Its search_path is already pinned to `public`
--    (not mutable) and its body selects from the unqualified `users` table, so
--    the search_path is intentionally left unchanged.
-- -----------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.user_club_id() FROM PUBLIC, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 3. rls_auto_enable() — SECURITY DEFINER event-trigger helper (lints 0028/0029).
--    Revoke EXECUTE from the public API roles. Its search_path is already pinned
--    to pg_catalog, so only the grant needs fixing.
-- -----------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;

COMMIT;
