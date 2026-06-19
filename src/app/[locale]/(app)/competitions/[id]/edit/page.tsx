import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCompetitionDetail, getCurrentClub } from "@/lib/queries";
import { isDbConfigured } from "@/lib/db";
import { DISCIPLINES } from "@/lib/constants";
import { CompetitionEditForm } from "./competition-edit-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Competitions" });
  return { title: `${t("editCompetition")} — EntrenaDojo` };
}

export const dynamic = "force-dynamic";

export default async function CompetitionEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("Competitions");
  if (!isDbConfigured()) notFound();

  const club = await getCurrentClub();
  if (!club) notFound();

  const competition = await getCompetitionDetail(id, club.id);
  if (!competition) notFound();

  const disciplines = DISCIPLINES.filter(
    (d) =>
      club.disciplines.includes(d.value) ||
      d.value === competition.discipline,
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href={`/competitions/${id}`}
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-navy"
        >
          <ArrowLeft size={15} />
          {t("backToCompetitions")}
        </Link>
        <p className="eyebrow">{t("editCompetition")}</p>
        <h1 className="text-2xl font-bold text-brand-navy">
          {competition.name}
        </h1>
      </div>

      <CompetitionEditForm
        competitionId={competition.id}
        initialData={{
          name: competition.name,
          discipline: competition.discipline ?? "",
          date: competition.date.slice(0, 10),
          location: competition.location ?? "",
          description: competition.description ?? "",
        }}
        disciplines={disciplines}
      />
    </div>
  );
}
