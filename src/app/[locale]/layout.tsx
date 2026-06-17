import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import "../globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EntrenaDojo — Martial arts club management, simplified",
  description:
    "Classes, belt progression, and payments for martial arts clubs. Mobile-first.",
};

/**
 * Localized root layout. Lives under `[locale]` so the `<html lang>` and the
 * client-side message provider are scoped to the active language. Invalid
 * locales 404 via `hasLocale`. `NextIntlClientProvider` (no props) inherits the
 * locale + messages resolved in `src/i18n/request.ts`, making them available to
 * both server and client components beneath it.
 */
export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html lang={locale} className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
