"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Check, Globe } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, LOCALE_LABELS, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/**
 * Language selector. Switches the active locale by replacing the current path
 * with the same path under the chosen locale — next-intl's `useRouter` keeps the
 * URL prefix in sync and persists the choice in the `locale` cookie (configured
 * in `src/i18n/routing.ts`), so it survives reloads.
 *
 * `variant` adapts the trigger to its surroundings: "dark" for the navy sidebar,
 * "light" for the landing header.
 */
export function LanguageSwitcher({
  variant = "light",
  className,
}: {
  variant?: "light" | "dark";
  className?: string;
}) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function choose(next: Locale) {
    setOpen(false);
    if (next === locale) return;
    // `pathname` is locale-stripped (e.g. "/students/123"); replace under `next`.
    router.replace(pathname, { locale: next });
  }

  const trigger =
    variant === "dark"
      ? "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
      : "text-muted-foreground hover:bg-muted hover:text-foreground";

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
          trigger,
        )}
      >
        <Globe size={16} />
        <span>{LOCALE_LABELS[locale]}</span>
      </button>

      {open && (
        <>
          {/* Click-away backdrop. */}
          <button
            type="button"
            aria-label="Close language menu"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <ul
            role="listbox"
            className="absolute bottom-full left-0 z-50 mb-1 min-w-[10rem] overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-lg"
          >
            {routing.locales.map((l) => (
              <li key={l}>
                <button
                  type="button"
                  role="option"
                  aria-selected={l === locale}
                  onClick={() => choose(l)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-popover-foreground transition-colors hover:bg-muted"
                >
                  {LOCALE_LABELS[l]}
                  {l === locale && (
                    <Check size={15} className="text-brand-teal" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
