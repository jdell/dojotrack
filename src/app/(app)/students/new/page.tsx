import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getBeltOptions, getCurrentClub, getFamilies } from "@/lib/queries";
import { StudentForm } from "../student-form";

export const metadata: Metadata = { title: "Add student — DojoTrack" };

export const dynamic = "force-dynamic";

export default async function NewStudentPage() {
  const club = await getCurrentClub();
  const [beltOptions, families] = await Promise.all([
    getBeltOptions(club),
    club ? getFamilies(club.id) : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/students"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-navy"
        >
          <ArrowLeft size={15} />
          Back to roster
        </Link>
        <p className="eyebrow">New member</p>
        <h1 className="text-2xl font-bold text-brand-navy">Add a student</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enrol a new member and assign them to a belt rank and family.
        </p>
      </div>

      <StudentForm beltOptions={beltOptions} families={families} />
    </div>
  );
}
