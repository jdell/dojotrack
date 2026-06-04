"use client";

import { useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { Search, Users } from "lucide-react";
import type { StudentRow } from "@/lib/queries";
import { BeltBadge } from "@/components/belt-badge";
import { formatDate } from "@/lib/utils";

interface StudentsTableProps {
  students: StudentRow[];
}

/**
 * Roster table with name search and an optional "group by family" view.
 * Attendance and payment columns are placeholders until those subsystems land.
 */
export function StudentsTable({ students }: StudentsTableProps) {
  const [query, setQuery] = useState("");
  const [grouped, setGrouped] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => s.fullName.toLowerCase().includes(q));
  }, [students, query]);

  const groups = useMemo(() => groupByFamily(filtered), [filtered]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search students…"
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-teal"
          />
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-brand-navy">
          <input
            type="checkbox"
            checked={grouped}
            onChange={(e) => setGrouped(e.target.checked)}
            className="h-4 w-4 rounded border-border text-brand-teal focus:ring-brand-teal"
          />
          Group by family
        </label>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No students match “{query}”.
        </p>
      ) : grouped ? (
        <div className="space-y-5">
          {groups.map(({ familyId, familyName, rows }) => (
            <section key={familyId ?? "none"}>
              <div className="mb-2 flex items-center gap-2">
                <Users size={15} className="text-brand-teal" />
                <h3 className="text-sm font-semibold text-brand-navy">
                  {familyName ?? "No family"}
                </h3>
                <span className="rounded-full bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground">
                  {rows.length}
                </span>
              </div>
              <RosterTable rows={rows} showFamily={false} />
            </section>
          ))}
        </div>
      ) : (
        <RosterTable rows={filtered} showFamily />
      )}
    </div>
  );
}

function RosterTable({
  rows,
  showFamily,
}: {
  rows: StudentRow[];
  showFamily: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-3 font-semibold">Student</th>
            <th className="px-4 py-3 font-semibold">Belt</th>
            <th className="hidden px-4 py-3 font-semibold sm:table-cell">
              Joined
            </th>
            <th className="hidden px-4 py-3 font-semibold md:table-cell">
              Attendance
            </th>
            <th className="px-4 py-3 font-semibold">Payment</th>
            {showFamily && (
              <th className="hidden px-4 py-3 font-semibold lg:table-cell">
                Family
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr
              key={s.id}
              className="border-b border-border last:border-0 hover:bg-muted/20"
            >
              <td className="px-4 py-3">
                <Link
                  href={`/students/${s.id}`}
                  className="font-medium text-brand-navy hover:text-brand-teal"
                >
                  {s.fullName}
                </Link>
                {s.email && (
                  <div className="text-xs text-muted-foreground">{s.email}</div>
                )}
              </td>
              <td className="px-4 py-3">
                <BeltBadge name={s.beltName} color={s.beltColor} />
              </td>
              <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                {formatDate(s.joinDate) || "—"}
              </td>
              <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                —
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                  Pending
                </span>
              </td>
              {showFamily && (
                <td className="hidden px-4 py-3 lg:table-cell">
                  {s.familyName ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-teal/10 px-2.5 py-0.5 text-xs font-medium text-brand-teal">
                      <Users size={12} />
                      {s.familyName}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface FamilyGroup {
  familyId: string | null;
  familyName: string | null;
  rows: StudentRow[];
}

/** Bucket students by family; the "no family" bucket sorts last. */
function groupByFamily(students: StudentRow[]): FamilyGroup[] {
  const map = new Map<string, FamilyGroup>();
  for (const s of students) {
    const key = s.familyId ?? "__none__";
    if (!map.has(key)) {
      map.set(key, {
        familyId: s.familyId,
        familyName: s.familyName,
        rows: [],
      });
    }
    map.get(key)!.rows.push(s);
  }
  return Array.from(map.values()).sort((a, b) => {
    if (!a.familyId) return 1;
    if (!b.familyId) return -1;
    return (a.familyName ?? "").localeCompare(b.familyName ?? "");
  });
}
