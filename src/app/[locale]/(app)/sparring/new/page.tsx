import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentClub, getSparringRoster } from "@/lib/queries";
import { disciplineMeta, DISCIPLINES } from "@/lib/constants";
import { SparringForm } from "../sparring-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Sparring" });
  return { title: `${t("setUpTitle")} — DojoTrack` };
}

export const dynamic = "force-dynamic";

export default async function NewSparringPage() {
  const t = await getTranslations("Sparring");
  const club = await getCurrentClub();
  const roster = club ? await getSparringRoster(club.id) : [];

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
          href="/sparring"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-navy"
        >
          <ArrowLeft size={15} />
          {t("backToSparring")}
        </Link>
        <p className="eyebrow">{t("newSession")}</p>
        <h1 className="text-2xl font-bold text-brand-navy">
          {t("setUpTitle")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("setUpSubtitle")}
        </p>
      </div>

      <SparringForm roster={roster} disciplines={disciplines} />
    </div>
  );
}
