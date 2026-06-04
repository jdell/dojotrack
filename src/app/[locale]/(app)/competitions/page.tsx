import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Competitions" });
  return { title: `${t("title")} — DojoTrack` };
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
        <div className="space-y-6">
          <CompetitionGroup
            title={t("upcoming")}
            competitions={upcoming}
            emptyHint={t("noneScheduled")}
          />
          <CompetitionGroup
            title={t("past")}
            competitions={past}
            emptyHint={t("noPastCompetitions")}
          />
        </div>
      )}
    </div>
  );
}

async function CompetitionGroup({
  title,
  competitions,
  emptyHint,
}: {
  title: string;
  competitions: CompetitionRow[];
  emptyHint: string;
}) {
  const t = await getTranslations("Competitions");
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
                      {t("entryCount", { count: c.entryCount })}
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
