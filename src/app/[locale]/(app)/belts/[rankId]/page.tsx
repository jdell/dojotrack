import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { ArrowLeft, GraduationCap, Users } from "lucide-react";
import { getRankDetail, getCurrentClub } from "@/lib/queries";
import { isDbConfigured } from "@/lib/db";
import { RankCandidateMatrix } from "./rank-candidate-matrix";
import { RankRequirementsSection } from "./rank-requirements-section";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Belts" });
  return { title: `${t("metaRank")} — EntrenaDojo` };
}

export const dynamic = "force-dynamic";

export default async function RankDetailPage({
  params,
}: {
  params: Promise<{ rankId: string }>;
}) {
  const { rankId } = await params;
  const t = await getTranslations("Belts");

  if (!isDbConfigured()) return <NotConfigured />;

  const [rank, club] = await Promise.all([
    getRankDetail(rankId),
    getCurrentClub(),
  ]);
  if (!rank) notFound();

  const discipline = club?.disciplines?.[0] ?? "custom";
  const gradesFromBelow = rank.prevRankName !== null;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Link
          href="/belts"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-navy"
        >
          <ArrowLeft size={15} />
          {t("backToBelts")}
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="eyebrow">{t("requirementsToEarn")}</p>
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
                {t.rich("progressFrom", {
                  prev: rank.prevRankName ?? "",
                  strong: (chunks) => (
                    <span className="font-medium text-brand-navy">{chunks}</span>
                  ),
                })}
              </p>
            )}
          </div>
          {gradesFromBelow && (
            <Link
              href={`/belts/exams/new?targetRankId=${rank.id}`}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-teal px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90"
            >
              <GraduationCap size={16} />
              {t("scheduleGradingExam")}
            </Link>
          )}
        </div>
      </div>

      {/* Requirements — client component with library modal */}
      <RankRequirementsSection
        rankId={rank.id}
        rankName={rank.name}
        discipline={discipline}
        requirements={rank.requirements}
      />

      {/* Candidates */}
      {gradesFromBelow && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-brand-teal" />
            <h2 className="text-lg font-bold text-brand-navy">
              {t("eligibleCandidates")}
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

async function NotConfigured() {
  const t = await getTranslations("Belts");
  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/belts"
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-navy"
      >
        <ArrowLeft size={15} />
        {t("backToBelts")}
      </Link>
      <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
        <div className="mx-auto mb-3 text-4xl">🥋</div>
        <h2 className="text-lg font-bold text-brand-navy">
          {t("rankNotAvailable")}
        </h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          {t("connectDbRequirements")}
        </p>
      </div>
    </div>
  );
}
