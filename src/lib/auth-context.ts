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
import { cookies } from "next/headers";
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
 *
 * When the caller is a platform admin and the `impersonate_club_id` cookie is
 * set, the returned `club` is the impersonated club rather than the admin's own
 * club. This lets all downstream code (queries, layout, sidebar) automatically
 * reflect the target club without any further changes.
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

    // Check for impersonation: if the caller is a platform admin and the
    // impersonate_club_id cookie is set, swap the club.
    const impersonatedClubId = await getImpersonatedClubId();
    if (impersonatedClubId && isPlatformAdmin(authUser.email, authUser.phone)) {
      const impersonatedClub = await prisma.club.findUnique({
        where: { id: impersonatedClubId },
      });
      if (impersonatedClub) {
        return { user, club: impersonatedClub };
      }
    }

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

/**
 * Whether the current request is from a club owner/admin — either by role
 * or by platform admin impersonation. Use this in API routes instead of
 * manually checking `auth.user.role`.
 */
export async function isClubAdmin(auth: AuthContext): Promise<boolean> {
  if (["OWNER", "ADMIN"].includes(auth.user.role)) return true;
  // Platform admins impersonating a club can do anything an owner can.
  const impersonatedClubId = await getImpersonatedClubId();
  if (impersonatedClubId) {
    const authUser = await getAuthUser();
    if (authUser && isPlatformAdmin(authUser.email, authUser.phone)) return true;
  }
  return false;
}

/**
 * Check if a user is a platform admin. Matches against ADMIN_EMAILS (email)
 * and ADMIN_PHONES (phone number) env vars. This supports phone-OTP users
 * who may not have an email on their Supabase auth record.
 */
export function isPlatformAdmin(
  email: string | null | undefined,
  phone?: string | null,
): boolean {
  const emailList = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const phoneList = (process.env.ADMIN_PHONES ?? "")
    .split(",")
    .map((p) => p.trim().replace(/\s/g, ""))
    .filter(Boolean);

  if (email && emailList.includes(email.toLowerCase())) return true;
  if (phone) {
    const normalised = phone.replace(/\s/g, "");
    if (phoneList.includes(normalised)) return true;
  }
  return false;
}

/**
 * Read the `impersonate_club_id` cookie, or return `null` when not set.
 * Safe to call from any server context (route handlers, server components,
 * server actions). Used by the app layout to decide whether to render the
 * impersonation banner.
 */
export async function getImpersonatedClubId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get("impersonate_club_id")?.value ?? null;
  } catch {
    return null;
  }
}
