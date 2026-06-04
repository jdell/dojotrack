import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentClub, getNewExamData } from "@/lib/queries";
import { isDbConfigured } from "@/lib/db";
import { ExamForm } from "./exam-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Belts" });
  return { title: `${t("newExam")} — DojoTrack` };
}

export const dynamic = "force-dynamic";

export default async function NewExamPage({
  searchParams,
}: {
  searchParams: Promise<{ targetRankId?: string }>;
}) {
  const { targetRankId } = await searchParams;
  const t = await getTranslations("Belts");
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
          {t("backToExams")}
        </Link>
        <p className="eyebrow">{t("newGrading")}</p>
        <h1 className="text-2xl font-bold text-brand-navy">
          {t("scheduleAnExam")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("newExamIntro")}
        </p>
      </div>

      {!club ? (
        <Placeholder>{t("connectDbSchedule")}</Placeholder>
      ) : data.targets.length === 0 || !data.targetRank ? (
        <Placeholder>
          {t.rich("noPromotableRanks", {
            link: (chunks) => (
              <Link href="/belts" className="font-medium text-brand-teal">
                {chunks}
              </Link>
            ),
          })}
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
