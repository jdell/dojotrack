"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CalendarClock, MapPin, Medal, Search, Trophy } from "lucide-react";
import type { CompetitionStatus } from "@prisma/client";
import { disciplineMeta } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

interface CompetitionRowData {
  id: string;
  name: string;
  discipline: string | null;
  date: string;
  location: string | null;
  status: CompetitionStatus;
  entryCount: number;
  medalCount: number;
}

const STATUS_CLASS: Record<CompetitionStatus, string> = {
  SCHEDULED: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-amber-100 text-amber-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-slate-100 text-slate-600",
};

const STATUS_OPTIONS: ("ALL" | CompetitionStatus)[] = [
  "ALL",
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

interface CompetitionsFilterProps {
  upcoming: CompetitionRowData[];
  past: CompetitionRowData[];
}

export function CompetitionsFilter({
  upcoming,
  past,
}: CompetitionsFilterProps) {
  const t = useTranslations("Competitions");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | CompetitionStatus
  >("ALL");

  const filteredUpcoming = useMemo(() => {
    return filterCompetitions(upcoming, query, statusFilter);
  }, [upcoming, query, statusFilter]);

  const filteredPast = useMemo(() => {
    return filterCompetitions(past, query, statusFilter);
  }, [past, query, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchCompetitions")}
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-teal"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "ALL" | CompetitionStatus)
          }
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-teal"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt === "ALL"
                ? t("statusLabel")
                : t(`status.${opt}`)}
            </option>
          ))}
        </select>
      </div>

      <CompetitionGroup
        title={t("upcoming")}
        competitions={filteredUpcoming}
        emptyHint={t("noneScheduled")}
      />
      <CompetitionGroup
        title={t("past")}
        competitions={filteredPast}
        emptyHint={t("noPastCompetitions")}
      />
    </div>
  );
}

function filterCompetitions(
  competitions: CompetitionRowData[],
  query: string,
  statusFilter: "ALL" | CompetitionStatus,
): CompetitionRowData[] {
  let result = competitions;
  const q = query.trim().toLowerCase();
  if (q) result = result.filter((c) => c.name.toLowerCase().includes(q));
  if (statusFilter !== "ALL")
    result = result.filter((c) => c.status === statusFilter);
  return result;
}

function CompetitionGroup({
  title,
  competitions,
  emptyHint,
}: {
  title: string;
  competitions: CompetitionRowData[];
  emptyHint: string;
}) {
  const t = useTranslations("Competitions");
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-brand-navy">{title}</h2>
      {competitions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
          {emptyHint}
        </p>
      ) : (
        <ul className="space-y-2">
          {competitions.map((c) => {
            const discipline = c.discipline
              ? disciplineMeta(c.discipline)
              : null;
            return (
              <li key={c.id}>
                <Link
                  href={`/competitions/${c.id}`}
                  className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-brand-teal/40"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-gold/10 text-brand-gold">
                    <Trophy size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-brand-navy">
                      {c.name}
                    </p>
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <CalendarClock size={13} />
                        {formatDate(c.date)}
                      </span>
                      {c.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={13} />
                          {c.location}
                        </span>
                      )}
                      {discipline && (
                        <span>
                          {discipline.emoji} {discipline.label}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <CompetitionStatusBadge status={c.status} />
                    <p className="mt-1 flex items-center justify-end gap-1 text-xs text-muted-foreground">
                      {t("entryCount", { count: c.entryCount })}
                      {c.medalCount > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-brand-gold">
                          · <Medal size={12} />
                          {c.medalCount}
                        </span>
                      )}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function CompetitionStatusBadge({
  status,
}: {
  status: CompetitionStatus;
}) {
  const t = useTranslations("Competitions");
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLASS[status]}`}
    >
      {t(`status.${status}`)}
    </span>
  );
}
