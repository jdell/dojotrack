import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentClub, getInstructorOptions } from "@/lib/queries";
import { DISCIPLINES, disciplineMeta } from "@/lib/constants";
import { ClassForm } from "../class-form";

export const metadata: Metadata = { title: "Add class — DojoTrack" };

export const dynamic = "force-dynamic";

export default async function NewClassPage() {
  const club = await getCurrentClub();
  const instructors = club ? await getInstructorOptions(club.id) : [];

  // Offer the club's own disciplines; fall back to all built-ins if none set.
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
          href="/classes"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-navy"
        >
          <ArrowLeft size={15} />
          Back to schedule
        </Link>
        <p className="eyebrow">New class</p>
        <h1 className="text-2xl font-bold text-brand-navy">Add a class</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Set up a recurring weekly class. Sessions repeat every week on the day
          you choose.
        </p>
      </div>

      <ClassForm disciplines={disciplines} instructors={instructors} />
    </div>
  );
}
