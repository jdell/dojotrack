/**
 * Authenticated request context.
 *
 * Resolves the signed-in Supabase user to their EntrenaDojo `User` + `Club` rows
 * so route handlers and server components can scope every query to the caller's
 * club. The session is read from the request cookies via the Supabase SSR
 * server client (`@/lib/supabase/server`), so callers don't pass a cookie store
 * in — it's picked up from `next/headers` for them.
 *
 * Like the rest of the app, this no-ops (returns `null`) when the database or
 * Supabase aren't configured, keeping the app buildable/browsable without env.
 * The `supabaseConfigured()` guard runs *before* any `cookies()` access so a
 * no-env build never forces dynamic rendering.
 *
 * NOTE: import this only from server code (route handlers / server components /
 * server actions) — never from a `"use client"` module.
 */
import { cache } from "react";
import { NextResponse } from "next/server";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { Club, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isDbConfigured } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

/** The signed-in user together with the club they belong to. */
export interface AuthContext {
  user: User;
  club: Club;
}

function supabaseConfigured(): boolean {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").startsWith("http");
}

/**
 * The Supabase auth user for the current request, or `null`. Validates the JWT
 * with Supabase (`getUser()` — a network call), not just the cookie. Used by
 * the registration endpoint, where the EntrenaDojo `User`/`Club` rows don't exist
 * yet. Memoised per request.
 */
export const getAuthUser = cache(async (): Promise<SupabaseUser | null> => {
  if (!supabaseConfigured()) return null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
});

/**
 * Resolve the current request to its `{ user, club }` context, or `null` when
 * there's no valid session or the user isn't linked to a club. Memoised per
 * request so repeated calls (e.g. `requireAuth()` then `getCurrentClub()`) hit
 * Supabase and Postgres only once.
 */
export const getAuthContext = cache(async (): Promise<AuthContext | null> => {
  if (!isDbConfigured() || !supabaseConfigured()) return null;
  try {
    const authUser = await getAuthUser();
    if (!authUser) return null;
    const user = await prisma.user.findUnique({
      where: { authId: authUser.id },
      include: { club: true },
    });
    if (!user?.club) return null;
    return { user, club: user.club };
  } catch {
    return null;
  }
});

/**
 * Guard for `/api/*` route handlers. Returns the `AuthContext` on success, or a
 * `401` JSON response to return directly. Usage:
 *
 *   const auth = await requireAuth();
 *   if (auth instanceof NextResponse) return auth;
 *   // auth.club / auth.user are now available
 */
export async function requireAuth(): Promise<AuthContext | NextResponse> {
  const ctx = await getAuthContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return ctx;
}
