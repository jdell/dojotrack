import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentClub, getNewExamData } from "@/lib/queries";
import { isDbConfigured } from "@/lib/db";
import { ExamForm } from "./exam-form";

export const metadata: Metadata = { title: "Schedule exam — DojoTrack" };

export const dynamic = "force-dynamic";

export default async function NewExamPage({
  searchParams,
}: {
  searchParams: Promise<{ targetRankId?: string }>;
}) {
  const { targetRankId } = await searchParams;
  const club = isDbConfigured() ? await getCurrentClub() : null;
  const data = club
    ? await getNewExamData(club.id, targetRankId ?? null)
    : { targets: [], targetRank: null, prevRankName: null, suggestions: [] };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/belts/exams"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-navy"
        >
          <ArrowLeft size={15} />
          Back to exams
        </Link>
        <p className="eyebrow">New grading</p>
        <h1 className="text-2xl font-bold text-brand-navy">Schedule an exam</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick the belt being tested for; the candidates at the rank below are
          suggested, with the most-ready pre-selected.
        </p>
      </div>

      {!club ? (
        <Placeholder>
          Connect a database to schedule gradings.
        </Placeholder>
      ) : data.targets.length === 0 || !data.targetRank ? (
        <Placeholder>
          No promotable belt ranks yet. Set up your ladder on the{" "}
          <Link href="/belts" className="font-medium text-brand-teal">
            Belts
          </Link>{" "}
          page first.
        </Placeholder>
      ) : (
        <ExamForm
          key={data.targetRank.id}
          targets={data.targets}
          targetRank={data.targetRank}
          prevRankName={data.prevRankName}
          suggestions={data.suggestions}
        />
      )}
    </div>
  );
}

function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
