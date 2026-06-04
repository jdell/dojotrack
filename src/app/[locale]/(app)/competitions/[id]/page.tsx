import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, MapPin } from "lucide-react";
import {
  getCompetitionDetail,
  getCurrentClub,
  getStudentOptions,
} from "@/lib/queries";
import { isDbConfigured } from "@/lib/db";
import { disciplineMeta } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { CompetitionStatusBadge } from "../page";
import { CompetitionResults } from "./competition-results";

export const metadata: Metadata = { title: "Competition — DojoTrack" };

export const dynamic = "force-dynamic";

export default async function CompetitionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isDbConfigured()) notFound();

  const club = await getCurrentClub();
  if (!club) notFound();

  const competition = await getCompetitionDetail(id, club.id);
  if (!competition) notFound();

  const students = await getStudentOptions(club.id);
  const enteredIds = new Set(competition.entries.map((e) => e.studentId));
  const availableStudents = students.filter((s) => !enteredIds.has(s.id));

  const discipline = competition.discipline
    ? disciplineMeta(competition.discipline)
    : null;
  const { gold, silver, bronze } = competition.medalTally;
  const hasMedals = gold + silver + bronze > 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href="/competitions"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-navy"
        >
          <ArrowLeft size={15} />
          Back to competitions
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="eyebrow">Competition</p>
            <h1 className="text-2xl font-bold text-brand-navy">
              {competition.name}
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CalendarClock size={14} />
                {formatDate(competition.date)}
              </span>
              {competition.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={14} />
                  {competition.location}
                </span>
              )}
              {discipline && (
                <span>
                  {discipline.emoji} {discipline.label}
                </span>
              )}
            </p>
          </div>
          <CompetitionStatusBadge status={competition.status} />
        </div>
        {competition.description && (
          <p className="mt-3 rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground">
            {competition.description}
          </p>
        )}
      </div>

      {hasMedals && (
        <div className="flex flex-wrap gap-3">
          <MedalCount emoji="🥇" label="Gold" count={gold} />
          <MedalCount emoji="🥈" label="Silver" count={silver} />
          <MedalCount emoji="🥉" label="Bronze" count={bronze} />
        </div>
      )}

      <CompetitionResults
        competitionId={competition.id}
        status={competition.status}
        entries={competition.entries}
        availableStudents={availableStudents}
      />
    </div>
  );
}

function MedalCount({
  emoji,
  label,
  count,
}: {
  emoji: string;
  label: string;
  count: number;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 shadow-sm">
      <span className="text-xl" aria-hidden>
        {emoji}
      </span>
      <div>
        <p className="text-lg font-bold leading-none text-brand-navy">{count}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
