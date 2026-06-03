import type { Metadata } from "next";
import { UserPlus } from "lucide-react";

export const metadata: Metadata = { title: "Students — DojoTrack" };

export default function StudentsPage() {
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
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-2 rounded-lg bg-brand-teal px-4 py-2 text-sm font-semibold text-white opacity-60"
          title="Coming soon"
        >
          <UserPlus size={16} />
          Add student
        </button>
      </div>

      <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
        <div className="mx-auto mb-3 text-4xl">🥋</div>
        <h2 className="text-lg font-bold text-brand-navy">No students yet</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          Your roster is empty. Adding and managing students arrives in the next
          sprint.
        </p>
      </div>
    </div>
  );
}
