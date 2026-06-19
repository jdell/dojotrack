"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Search, Users } from "lucide-react";
import type { MembershipStatus } from "@prisma/client";
import type { StudentRow } from "@/lib/queries";
import { BeltBadge } from "@/components/belt-badge";
import { formatDate } from "@/lib/utils";

interface StudentsTableProps {
  students: StudentRow[];
}

/**
 * Roster table with name search and an optional "group by family" view.
 * Attendance count and membership status are wired to real data.
 */
export function StudentsTable({ students }: StudentsTableProps) {
  const t = useTranslations("Students");
  const [query, setQuery] = useState("");
  const [grouped, setGrouped] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const filtered = useMemo(() => {
    let result = students;
    if (statusFilter === "active") result = result.filter((s) => s.active === true);
    else if (statusFilter === "inactive") result = result.filter((s) => s.active === false);
    const q = query.trim().toLowerCase();
    if (q) result = result.filter((s) => s.fullName.toLowerCase().includes(q));
    return result;
  }, [students, query, statusFilter]);

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
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-teal"
          />
        </div>
        <div className="inline-flex rounded-lg border border-border">
          {(["all", "active", "inactive"] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setStatusFilter(opt)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === opt
                  ? "bg-brand-teal text-white"
                  : "bg-card text-muted-foreground hover:bg-muted/50"
              } ${opt === "all" ? "rounded-l-lg" : opt === "inactive" ? "rounded-r-lg" : ""}`}
            >
              {t(opt === "all" ? "filterAll" : opt === "active" ? "filterActive" : "filterInactive")}
            </button>
          ))}
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-brand-navy">
          <input
            type="checkbox"
            checked={grouped}
            onChange={(e) => setGrouped(e.target.checked)}
            className="h-4 w-4 rounded border-border text-brand-teal focus:ring-brand-teal"
          />
          {t("groupByFamily")}
        </label>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          {t("noMatch", { query })}
        </p>
      ) : grouped ? (
        <div className="space-y-5">
          {groups.map(({ familyId, familyName, rows }) => (
            <section key={familyId ?? "none"}>
              <div className="mb-2 flex items-center gap-2">
                <Users size={15} className="text-brand-teal" />
                <h3 className="text-sm font-semibold text-brand-navy">
                  {familyName ?? t("noFamily")}
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
  const t = useTranslations("Students");
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-3 font-semibold">{t("colStudent")}</th>
            <th className="px-4 py-3 font-semibold">{t("colBelt")}</th>
            <th className="hidden px-4 py-3 font-semibold sm:table-cell">
              {t("colJoined")}
            </th>
            <th className="hidden px-4 py-3 font-semibold md:table-cell">
              {t("colAttendance")}
            </th>
            <th className="px-4 py-3 font-semibold">{t("colPayment")}</th>
            {showFamily && (
              <th className="hidden px-4 py-3 font-semibold lg:table-cell">
                {t("colFamily")}
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
                {s.attendanceCount > 0 ? (
                  <span className="font-medium text-brand-navy">
                    {t("attendanceCount", { count: s.attendanceCount })}
                  </span>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-4 py-3">
                <MembershipBadge status={s.membershipStatus} />
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

const MEMBERSHIP_STYLES: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  TRIALING: "bg-green-100 text-green-800",
  PAST_DUE: "bg-amber-100 text-amber-800",
  CANCELLED: "bg-red-100 text-red-800",
};

function MembershipBadge({ status }: { status: MembershipStatus | null }) {
  const t = useTranslations("Students");
  const tp = useTranslations("Payments.membershipStatus");
  if (!status) {
    return (
      <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
        {t("membershipNone")}
      </span>
    );
  }
  const style = MEMBERSHIP_STYLES[status] ?? "bg-muted text-muted-foreground";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}
    >
      {tp(status)}
    </span>
  );
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
