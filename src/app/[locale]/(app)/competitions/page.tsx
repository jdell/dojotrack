import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Trophy } from "lucide-react";
import type { CompetitionStatus } from "@prisma/client";
import {
  getCompetitions,
  getCurrentClub,
} from "@/lib/queries";
import { isDbConfigured } from "@/lib/db";
import { CompetitionsFilter } from "./competitions-filter";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Competitions" });
  return { title: `${t("title")} — EntrenaDojo` };
}

export const dynamic = "force-dynamic";

export default async function CompetitionsPage() {
  const t = await getTranslations("Competitions");
  const club = isDbConfigured() ? await getCurrentClub() : null;
  const { upcoming, past } = club
    ? await getCompetitions(club.id)
    : { upcoming: [], past: [] };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">{t("eyebrow")}</p>
          <h1 className="text-2xl font-bold text-brand-navy">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        {club && (
          <Link
            href="/competitions/new"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-teal px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90"
          >
            <Trophy size={16} />
            {t("addCompetition")}
          </Link>
        )}
      </div>

      {!club ? (
        <NotConfigured />
      ) : upcoming.length === 0 && past.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <div className="mx-auto mb-3 text-4xl">🏆</div>
          <h2 className="text-lg font-bold text-brand-navy">
            {t("emptyTitle")}
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            {t("emptyHint")}
          </p>
          <Link
            href="/competitions/new"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-teal px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90"
          >
            {t("addCompetition")}
          </Link>
        </div>
      ) : (
        <CompetitionsFilter upcoming={upcoming} past={past} />
      )}
    </div>
  );
}

const STATUS_CLASS: Record<CompetitionStatus, string> = {
  SCHEDULED: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-amber-100 text-amber-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-slate-100 text-slate-600",
};

export async function CompetitionStatusBadge({
  status,
}: {
  status: CompetitionStatus;
}) {
  const t = await getTranslations("Competitions");
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLASS[status]}`}
    >
      {t(`status.${status}`)}
    </span>
  );
}

async function NotConfigured() {
  const t = await getTranslations("Competitions");
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
      <div className="mx-auto mb-3 text-4xl">🏆</div>
      <h2 className="text-lg font-bold text-brand-navy">
        {t("notConfiguredTitle")}
      </h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        {t("notConfiguredHint")}
      </p>
    </div>
  );
}
