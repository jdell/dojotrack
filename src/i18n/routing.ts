import { defineRouting } from "next-intl/routing";

/**
 * i18n routing configuration (next-intl).
 *
 * - Three locales: English (en), Spanish (es), Galician (gl).
 * - `localePrefix: "always"` → every URL carries a locale segment
 *   (`/en/dashboard`, `/es/dashboard`, `/gl/dashboard`). Unprefixed requests are
 *   redirected by the middleware (see `src/proxy.ts`) to the resolved locale.
 * - Locale detection order (handled by next-intl's middleware): the `locale`
 *   cookie (set when a user picks a language) → the `Accept-Language` header →
 *   `defaultLocale` (Spanish). When neither the cookie nor Accept-Language
 *   matches a supported locale, the app falls back to Spanish (`es`), not
 *   English. This is the single source of truth for the default — server
 *   fallbacks (email, OG image, registration) all read `routing.defaultLocale`.
 * - The choice is persisted in a cookie named `locale` so it survives reloads.
 */
export const routing = defineRouting({
  locales: ["en", "es", "gl"],
  defaultLocale: "es",
  localePrefix: "always",
  localeCookie: {
    name: "locale",
    // Persist the chosen language for a year.
    maxAge: 60 * 60 * 24 * 365,
  },
});

export type Locale = (typeof routing.locales)[number];

/** Display names for each locale, shown in their own language. */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  es: "Español",
  gl: "Galego",
};
