import type { Metadata } from "next";
import { BELT_SYSTEMS } from "@/lib/constants";
import type { BeltSystem } from "@/types";

export const metadata: Metadata = { title: "Belts — DojoTrack" };

const SYSTEMS: BeltSystem[] = [
  BELT_SYSTEMS.bjj,
  BELT_SYSTEMS.karate,
  BELT_SYSTEMS.judo,
  BELT_SYSTEMS.taekwondo,
];

export default function BeltsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="eyebrow">Progression</p>
        <h1 className="text-2xl font-bold text-brand-navy">Belt systems</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The ranking ladders DojoTrack supports out of the box. Students will
          track their journey along these, white belt to black.
        </p>
      </div>

      <div className="space-y-5">
        {SYSTEMS.map((system) => (
          <section
            key={system.id}
            className="rounded-xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="text-lg font-bold text-brand-navy">
                {system.name}
              </h2>
              <span className="text-xs text-muted-foreground">
                {system.belts.length} ranks
              </span>
            </div>
            <ol className="flex flex-wrap gap-2">
              {system.belts.map((belt) => (
                <li
                  key={belt.id}
                  className="flex min-w-[7rem] flex-1 flex-col gap-1.5 rounded-lg border border-border p-2"
                  title={belt.name}
                >
                  <span
                    className="h-2.5 w-full rounded-full border border-black/10"
                    style={{ backgroundColor: belt.color }}
                  />
                  <span className="truncate text-xs font-medium text-brand-navy">
                    {belt.name}
                  </span>
                  {belt.stripes ? (
                    <span className="text-[0.65rem] text-muted-foreground">
                      0–{belt.stripes} stripes
                    </span>
                  ) : null}
                </li>
              ))}
            </ol>
          </section>
        ))}

        <section className="rounded-xl border border-dashed border-border bg-card p-5">
          <h2 className="text-lg font-bold text-brand-navy">Custom</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Build your own ranking system with bespoke belts, colours, and
            requirements. Configurable per club in a later sprint.
          </p>
        </section>
      </div>
    </div>
  );
}
