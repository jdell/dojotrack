import type { Metadata } from "next";
import { DISCIPLINES } from "@/lib/constants";

export const metadata: Metadata = { title: "Settings — DojoTrack" };

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="eyebrow">Configuration</p>
        <h1 className="text-2xl font-bold text-brand-navy">Club settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your club&apos;s profile and preferences. Editing arrives in a later
          sprint.
        </p>
      </div>

      <form className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-sm">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-navy">
            Club name
          </label>
          <input
            type="text"
            disabled
            placeholder="Your Dojo"
            className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-navy">
            Public page URL
          </label>
          <div className="flex items-center rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground">
            <span className="text-muted-foreground/70">
              dojotrack.app/club/
            </span>
            <span>your-dojo</span>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-navy">
            Address
          </label>
          <input
            type="text"
            disabled
            placeholder="123 Main St, Anytown"
            className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground"
          />
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-brand-navy">
            Disciplines
          </span>
          <div className="flex flex-wrap gap-2">
            {DISCIPLINES.map((d) => (
              <span
                key={d.value}
                className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground"
              >
                {d.emoji} {d.label}
              </span>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            disabled
            className="rounded-lg bg-brand-teal px-4 py-2 text-sm font-semibold text-white opacity-60"
            title="Coming soon"
          >
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}
