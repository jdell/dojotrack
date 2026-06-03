import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentClub, getSparringRoster } from "@/lib/queries";
import { disciplineMeta, DISCIPLINES } from "@/lib/constants";
import { SparringForm } from "../sparring-form";

export const metadata: Metadata = { title: "New sparring session — DojoTrack" };

export const dynamic = "force-dynamic";

export default async function NewSparringPage() {
  const club = await getCurrentClub();
  const roster = club ? await getSparringRoster(club.id) : [];

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
          href="/sparring"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-navy"
        >
          <ArrowLeft size={15} />
          Back to sparring
        </Link>
        <p className="eyebrow">New session</p>
        <h1 className="text-2xl font-bold text-brand-navy">
          Set up sparring
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick who&apos;s on the mat and how many rounds. We&apos;ll pair by belt,
          avoid repeats across rounds, and rotate byes.
        </p>
      </div>

      <SparringForm roster={roster} disciplines={disciplines} />
    </div>
  );
}
