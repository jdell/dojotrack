import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { ArrowLeft, GraduationCap, Users } from "lucide-react";
import { getRankDetail } from "@/lib/queries";
import { isDbConfigured } from "@/lib/db";
import { requirementTypeMeta } from "@/lib/constants";
import { RankCandidateMatrix } from "./rank-candidate-matrix";

export const metadata: Metadata = { title: "Belt rank — DojoTrack" };

export const dynamic = "force-dynamic";

export default async function RankDetailPage({
  params,
}: {
  params: Promise<{ rankId: string }>;
}) {
  const { rankId } = await params;

  if (!isDbConfigured()) return <NotConfigured />;

  const rank = await getRankDetail(rankId);
  if (!rank) notFound();

  const gradesFromBelow = rank.prevRankName !== null;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Link
          href="/belts"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-navy"
        >
          <ArrowLeft size={15} />
          Back to belts
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="eyebrow">Requirements to earn</p>
            <h1 className="flex items-center gap-2.5 text-2xl font-bold text-brand-navy">
              <span
                className="h-4 w-10 rounded-full border border-black/10"
                style={{ backgroundColor: rank.color }}
                aria-hidden
              />
              {rank.name}
            </h1>
            {gradesFromBelow && (
              <p className="mt-1 text-sm text-muted-foreground">
                Candidates progress here from{" "}
                <span className="font-medium text-brand-navy">
                  {rank.prevRankName}
                </span>
                .
              </p>
            )}
          </div>
          {gradesFromBelow && (
            <Link
              href={`/belts/exams/new?targetRankId=${rank.id}`}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-teal px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90"
            >
              <GraduationCap size={16} />
              Schedule grading exam
            </Link>
          )}
        </div>
      </div>

      {/* Requirements */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-brand-navy">Requirements</h2>
        {rank.requirements.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No requirements set for this rank yet. Add them from the{" "}
            <Link href="/belts" className="font-medium text-brand-teal">
              Belts
            </Link>{" "}
            page.
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {rank.requirements.map((req) => {
              const meta = requirementTypeMeta(req.type);
              return (
                <li
                  key={req.id}
                  className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 shadow-sm"
                >
                  <span className="mt-0.5 text-lg" aria-hidden>
                    {meta.emoji}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-brand-navy">
                      {req.name}
                      {req.targetValue != null && (
                        <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                          {req.targetValue} {meta.unit ?? ""}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {meta.label}
                      {req.description ? ` · ${req.description}` : ""}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Candidates */}
      {gradesFromBelow && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-brand-teal" />
            <h2 className="text-lg font-bold text-brand-navy">
              Eligible candidates
            </h2>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {rank.candidates.length}
            </span>
          </div>
          <RankCandidateMatrix
            requirements={rank.requirements}
            candidates={rank.candidates}
          />
        </section>
      )}
    </div>
  );
}

function NotConfigured() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/belts"
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-navy"
      >
        <ArrowLeft size={15} />
        Back to belts
      </Link>
      <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
        <div className="mx-auto mb-3 text-4xl">🥋</div>
        <h2 className="text-lg font-bold text-brand-navy">
          Rank details aren&apos;t available yet
        </h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          Connect a database to configure requirements and grade students.
        </p>
      </div>
    </div>
  );
}
