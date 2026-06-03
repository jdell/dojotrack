import type { Metadata } from "next";
import Link from "next/link";
import { getClubSettings } from "@/lib/queries";
import { isDbConfigured } from "@/lib/db";
import { BRAND } from "@/lib/constants";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Settings — DojoTrack" };

export const dynamic = "force-dynamic";

/** Public host shown next to the slug — derived from the brand URL. */
function publicHost(): string {
  try {
    return new URL(BRAND.url).host;
  } catch {
    return "dojotrack.app";
  }
}

export default async function SettingsPage() {
  const settings = isDbConfigured() ? await getClubSettings() : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="eyebrow">Configuration</p>
        <h1 className="text-2xl font-bold text-brand-navy">Club settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your club&apos;s public profile, contact details, and preferences.
        </p>
      </div>

      {settings ? (
        <SettingsForm settings={settings} publicHost={publicHost()} />
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <div className="mx-auto mb-3 text-4xl">🥋</div>
          <h2 className="text-lg font-bold text-brand-navy">
            No club to configure yet
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Settings appear once you&apos;re signed in to a club. Register a club
            to get started.
          </p>
          <Link
            href="/register"
            className="mt-6 inline-flex rounded-lg bg-brand-teal px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Register a club
          </Link>
        </div>
      )}
    </div>
  );
}
