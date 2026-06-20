import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CalendarClock, Swords, Users } from "lucide-react";
import { getCurrentClub, getSparringSessions } from "@/lib/queries";
import { isDbConfigured } from "@/lib/db";
import { disciplineMeta } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { ProGate } from "@/components/pro-gate";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Sparring" });
  return { title: `${t("title")} — EntrenaDojo` };
}

export const dynamic = "force-dynamic";

export default async function SparringPage() {
  const t = await getTranslations("Sparring");
  const club = isDbConfigured() ? await getCurrentClub() : null;
  const sessions = club ? await getSparringSessions(club.id) : [];

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
            href="/sparring/new"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-teal px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90"
          >
            <Swords size={16} />
            {t("newSession")}
          </Link>
        )}
      </div>

      {!club ? (
        <NotConfigured
          title={t("notConfiguredTitle")}
          body={t("notConfiguredBody")}
        />
      ) : (
        <ProGate feature="sparring" clubTier={club.tier}>
          {sessions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
              <div className="mx-auto mb-3 text-4xl">🥊</div>
              <h2 className="text-lg font-bold text-brand-navy">
                {t("emptyTitle")}
              </h2>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                {t("emptyBody")}
              </p>
              <Link
                href="/sparring/new"
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-teal px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90"
              >
                {t("newSession")}
              </Link>
            </div>
          ) : (
            <ul className="space-y-2">
              {sessions.map((s) => {
            const discipline = s.discipline ? disciplineMeta(s.discipline) : null;
            return (
              <li key={s.id}>
                <Link
                  href={`/sparring/${s.id}`}
                  className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-brand-teal/40"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-teal/10 text-brand-teal">
                    <Swords size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-brand-navy">
                      {s.name ?? t("sessionFallback")}
                    </p>
                    <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <CalendarClock size={13} />
                        {formatDate(s.date)}
                      </span>
                      {discipline && (
                        <span>
                          {discipline.emoji} {discipline.label}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="shrink-0 text-right text-xs text-muted-foreground">
                    <p className="inline-flex items-center gap-1 font-medium text-brand-navy">
                      <Users size={13} />
                      {s.participantCount}
                    </p>
                    <p>
                      {t("boutCount", { count: s.pairCount })} ·{" "}
                      {t("roundCount", { count: s.rounds })}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
            </ul>
          )}
        </ProGate>
      )}
    </div>
  );
}

function NotConfigured({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
      <div className="mx-auto mb-3 text-4xl">🥊</div>
      <h2 className="text-lg font-bold text-brand-navy">{title}</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
