import type { Metadata } from "next";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { getCurrentClub, getStudents } from "@/lib/queries";
import { StudentsTable } from "./students-table";
import { InviteButton } from "./invite-button";

export const metadata: Metadata = { title: "Students — DojoTrack" };

// Roster is per-request, DB-backed — never statically pre-rendered at build.
export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const club = await getCurrentClub();
  const students = club ? await getStudents(club.id) : [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Roster</p>
          <h1 className="text-2xl font-bold text-brand-navy">Students</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your members, contact details, and belt ranks.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <InviteButton variant="secondary" />
          <Link
            href="/students/new"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-teal px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90"
          >
            <UserPlus size={16} />
            Add student
          </Link>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <div className="mx-auto mb-3 text-4xl">🥋</div>
          <h2 className="text-lg font-bold text-brand-navy">No students yet</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Your roster is empty. Add your first member, or share an invite link
            so they can sign up themselves.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/students/new"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-teal px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90"
            >
              <UserPlus size={16} />
              Add student
            </Link>
            <InviteButton variant="secondary" />
          </div>
        </div>
      ) : (
        <StudentsTable students={students} />
      )}
    </div>
  );
}
