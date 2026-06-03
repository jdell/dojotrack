import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, MapPin, Medal, Trophy } from "lucide-react";
import type { CompetitionStatus } from "@prisma/client";
import {
  getCompetitions,
  getCurrentClub,
  type CompetitionRow,
} from "@/lib/queries";
import { isDbConfigured } from "@/lib/db";
import { disciplineMeta } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Competitions — DojoTrack" };

export const dynamic = "force-dynamic";

export default async function CompetitionsPage() {
  const club = isDbConfigured() ? await getCurrentClub() : null;
  const { upcoming, past } = club
    ? await getCompetitions(club.id)
    : { upcoming: [], past: [] };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Competing</p>
          <h1 className="text-2xl font-bold text-brand-navy">Competitions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track tournaments your students enter and record their results.
          </p>
        </div>
        {club && (
          <Link
            href="/competitions/new"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-teal px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90"
          >
            <Trophy size={16} />
            Add competition
          </Link>
        )}
      </div>

      {!club ? (
        <NotConfigured />
      ) : upcoming.length === 0 && past.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <div className="mx-auto mb-3 text-4xl">🏆</div>
          <h2 className="text-lg font-bold text-brand-navy">
            No competitions yet
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Add a competition to enter students and log their placements.
          </p>
          <Link
            href="/competitions/new"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-teal px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90"
          >
            Add competition
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <CompetitionGroup
            title="Upcoming"
            competitions={upcoming}
            emptyHint="None scheduled."
          />
          <CompetitionGroup
            title="Past"
            competitions={past}
            emptyHint="No past competitions."
          />
        </div>
      )}
    </div>
  );
}

function CompetitionGroup({
  title,
  competitions,
  emptyHint,
}: {
  title: string;
  competitions: CompetitionRow[];
  emptyHint: string;
}) {
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
            const discipline = c.discipline ? disciplineMeta(c.discipline) : null;
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
                      {c.entryCount}{" "}
                      {c.entryCount === 1 ? "entry" : "entries"}
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

const STATUS_META: Record<
  CompetitionStatus,
  { label: string; className: string }
> = {
  SCHEDULED: { label: "Scheduled", className: "bg-blue-100 text-blue-800" },
  IN_PROGRESS: { label: "In progress", className: "bg-amber-100 text-amber-800" },
  COMPLETED: { label: "Completed", className: "bg-green-100 text-green-800" },
  CANCELLED: { label: "Cancelled", className: "bg-slate-100 text-slate-600" },
};

export function CompetitionStatusBadge({
  status,
}: {
  status: CompetitionStatus;
}) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

function NotConfigured() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
      <div className="mx-auto mb-3 text-4xl">🏆</div>
      <h2 className="text-lg font-bold text-brand-navy">
        Competitions aren&apos;t available yet
      </h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        Connect a database to track competitions and record results.
      </p>
    </div>
  );
}
