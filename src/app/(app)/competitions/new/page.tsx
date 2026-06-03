import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentClub } from "@/lib/queries";
import { DISCIPLINES, disciplineMeta } from "@/lib/constants";
import { CompetitionForm } from "../competition-form";

export const metadata: Metadata = { title: "Add competition — DojoTrack" };

export const dynamic = "force-dynamic";

export default async function NewCompetitionPage() {
  const club = await getCurrentClub();

  const disciplines =
    club && club.disciplines.length > 0
      ? club.disciplines.map(disciplineMeta)
      : DISCIPLINES.map((d) => ({
          value: d.value,
          label: d.label,
          emoji: d.emoji,
        }));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/competitions"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-navy"
        >
          <ArrowLeft size={15} />
          Back to competitions
        </Link>
        <p className="eyebrow">New competition</p>
        <h1 className="text-2xl font-bold text-brand-navy">Add a competition</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Log a tournament so you can enter students and record their results.
        </p>
      </div>

      <CompetitionForm disciplines={disciplines} />
    </div>
  );
}
