import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap } from "lucide-react";
import {
  ensureBeltRanks,
  getBeltRanksWithRequirements,
  getCurrentClub,
} from "@/lib/queries";
import { isDbConfigured } from "@/lib/db";
import { BELT_SYSTEMS } from "@/lib/constants";
import type { BeltSystem } from "@/types";
import { BeltsManager } from "./belts-manager";

export const metadata: Metadata = { title: "Belts — DojoTrack" };

export const dynamic = "force-dynamic";

// Every built-in ladder (the empty "custom" template is excluded).
const SYSTEMS: BeltSystem[] = Object.values(BELT_SYSTEMS).filter(
  (s) => s.belts.length > 0,
);

export default async function BeltsPage() {
  const club = isDbConfigured() ? await getCurrentClub() : null;
  if (club) await ensureBeltRanks(club);
  const ranks = club ? await getBeltRanksWithRequirements(club.id) : [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Progression</p>
          <h1 className="text-2xl font-bold text-brand-navy">
            Belt requirements
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Define what each rank demands — time on the mat, classes attended,
            techniques, and competition — then track who&apos;s ready to grade.
          </p>
        </div>
        <Link
          href="/belts/exams"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-teal px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90"
        >
          <GraduationCap size={16} />
          Grading exams
        </Link>
      </div>

      {club && ranks.length > 0 ? (
        <BeltsManager ranks={ranks} />
      ) : club ? (
        <p className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Setting up your belt ladder… refresh in a moment.
        </p>
      ) : (
        <BuiltInPreview />
      )}
    </div>
  );
}

/**
 * Read-only preview of the built-in ladders, shown before a database is
 * attached. Once connected, a club's own ranks are seeded and become editable.
 */
function BuiltInPreview() {
  return (
    <div className="space-y-5">
      <p className="rounded-lg border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">
        Connect a database to configure requirements and grade students. These
        are the ladders DojoTrack ships with.
      </p>
      {SYSTEMS.map((system) => (
        <section
          key={system.id}
          className="rounded-xl border border-border bg-card p-5 shadow-sm"
        >
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-lg font-bold text-brand-navy">{system.name}</h2>
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
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
