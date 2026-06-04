import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * Locale-aware navigation APIs. These are drop-in replacements for the matching
 * `next/link` / `next/navigation` exports that automatically keep the active
 * locale in the URL — import `Link`, `useRouter`, `usePathname`, `redirect`,
 * and `getPathname` from here instead of from `next/*`.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
