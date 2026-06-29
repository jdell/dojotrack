import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import {
  getCurrentClub,
  getInstructorOptions,
  getClubStyles,
} from "@/lib/queries";
import { DISCIPLINES, disciplineMeta } from "@/lib/constants";
import { ClassForm } from "../class-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Classes" });
  return { title: `${t("addClass")} — EntrenaDojo` };
}

export const dynamic = "force-dynamic";

export default async function NewClassPage() {
  const t = await getTranslations("Classes");
  const club = await getCurrentClub();
  const instructors = club ? await getInstructorOptions(club.id) : [];
  const clubStyles = club ? await getClubStyles(club.id) : [];
  const activeStyles = clubStyles
    .filter((s) => s.active)
    .map((s) => ({ id: s.id, discipline: s.discipline, name: s.name }));

  // Offer the club's own disciplines; fall back to all built-ins if none set.
  const disciplines =
    club && club.disciplines.length > 0
      ? club.disciplines.map(disciplineMeta)
      : DISCIPLINES.map((d) => ({
          value: d.value,
          label: d.label,
          emoji: d.emoji,
        }));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/classes"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-navy"
        >
          <ArrowLeft size={15} />
          {t("backToSchedule")}
        </Link>
        <p className="eyebrow">{t("newClass")}</p>
        <h1 className="text-2xl font-bold text-brand-navy">{t("addAClass")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("newClassBody")}</p>
      </div>

      <ClassForm
        disciplines={disciplines}
        instructors={instructors}
        styles={activeStyles.length > 0 ? activeStyles : undefined}
      />
    </div>
  );
}
