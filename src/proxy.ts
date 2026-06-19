import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import createMiddleware from "next-intl/middleware";
import { routing, type Locale } from "@/i18n/routing";

/**
 * Middleware (Next 16 `proxy.ts` convention) composing two concerns:
 *
 *  1. **i18n routing** — next-intl resolves the locale (cookie → Accept-Language
 *     → default) and ensures every URL is locale-prefixed, redirecting bare
 *     paths like `/dashboard` to `/<locale>/dashboard`.
 *  2. **Auth** — Supabase session refresh + protection of the app routes,
 *     layered onto the i18n response. Protected prefixes are matched against the
 *     path with the locale segment stripped.
 *
 * Supabase is skipped entirely when its env vars aren't set, so the app stays
 * browsable without configuration.
 */
const handleI18n = createMiddleware(routing);

/** App route prefixes (locale-stripped) that require an authenticated session. */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/students",
  "/classes",
  "/belts",
  "/payments",
  "/competitions",
  "/sparring",
  "/settings",
  "/checkin",
  "/my",
];

export async function proxy(request: NextRequest) {
  // 1) Let next-intl handle locale routing first.
  const response = handleI18n(request);

  // If it decided to redirect (e.g. to add the locale prefix), the redirected
  // request will re-enter this middleware — nothing more to do now.
  if (response.headers.has("location")) {
    return response;
  }

  // 2) Layer Supabase auth onto the i18n response.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!supabaseUrl.startsWith("http")) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Resolve the active locale + the path beneath it (e.g. "/en/students/123"
  // → locale "en", path "/students/123").
  const segments = request.nextUrl.pathname.split("/");
  const locale = (routing.locales as readonly string[]).includes(segments[1])
    ? (segments[1] as Locale)
    : routing.defaultLocale;
  const pathWithoutLocale = "/" + segments.slice(2).join("/");

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(`${p}/`),
  );
  if (isProtected && !user) {
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  return response;
}

export const config = {
  // Run on everything except API routes, Next internals, and static files.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
