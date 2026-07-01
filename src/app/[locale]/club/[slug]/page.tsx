import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  CalendarDays,
  Clock,
  Globe,
  ExternalLink,
  MapPin,
  Mail,
  Phone,
  Users,
} from "lucide-react";
import { DAY_ORDER } from "@/lib/schedule";
import { Logo } from "@/components/logo";
import { getClubBySlug, type PublicClub } from "@/lib/queries";
import { baseUrl } from "@/lib/invite";
import { initials } from "@/lib/utils";
import { TrialRequestForm } from "./trial-request-form";

export const dynamic = "force-dynamic";

/** Turn a slug like "gracie-barra-downtown" into "Gracie Barra Downtown". */
function humanize(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Join the address parts a club has filled in, skipping blanks. */
function locationLine(club: PublicClub): string | null {
  const parts = [club.address, club.city, club.country].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const club = await getClubBySlug(slug);
  const name = (club?.name ?? humanize(slug)) || "Club";
  const tMeta = await getTranslations({ locale, namespace: "Club" });
  const description = club?.description ?? tMeta("metaDescription", { name });
  const url = `${baseUrl()}/club/${slug}`;
  // Pass the locale so the OG card's CTA renders in the visitor's language.
  const ogImage = `${baseUrl()}/api/og/${slug}?lang=${locale}`;

  return {
    title: `${name} — EntrenaDojo`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: name,
      description,
      url,
      type: "website",
      siteName: "EntrenaDojo",
      images: [{ url: ogImage, width: 1200, height: 630, alt: name }],
    },
    twitter: {
      card: "summary_large_image",
      title: name,
      description,
      images: [ogImage],
    },
  };
}

/**
 * Build Organization + SportsActivityLocation JSON-LD for a club so search
 * engines can surface its name, location, disciplines, and social profiles.
 */
function clubJsonLd(club: PublicClub, url: string) {
  const sameAs = [
    club.websiteUrl,
    club.instagramUrl,
    club.facebookUrl,
    club.youtubeUrl,
  ].filter((v): v is string => Boolean(v));

  const address =
    club.address || club.city || club.country
      ? {
          "@type": "PostalAddress",
          streetAddress: club.address ?? undefined,
          addressLocality: club.city ?? undefined,
          addressCountry: club.country ?? undefined,
        }
      : undefined;

  const shared = {
    name: club.name,
    url,
    description: club.description ?? undefined,
    image: club.logoUrl ?? `${baseUrl()}/api/og/${club.slug}`,
    logo: club.logoUrl ?? undefined,
    telephone: club.phone ?? undefined,
    email: club.email ?? undefined,
    address,
    ...(sameAs.length ? { sameAs } : {}),
  };

  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", "@id": `${url}#organization`, ...shared },
      {
        "@type": "SportsActivityLocation",
        "@id": `${url}#location`,
        ...shared,
        sport: club.disciplines.map((d) => d.label),
      },
    ],
  };
}

export default async function ClubPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const club = await getClubBySlug(slug);

  if (!club) {
    return <ClubComingSoon name={humanize(slug) || "Club"} />;
  }

  const location = locationLine(club);
  const jsonLd = clubJsonLd(club, `${baseUrl()}/club/${slug}`);
  const t = await getTranslations("Club");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Structured data for search engines (Organization + SportsActivityLocation). */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="flex items-center gap-4">
            {club.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={club.logoUrl}
                alt={club.name}
                className="h-16 w-16 shrink-0 rounded-2xl border border-slate-200 dark:border-slate-800 object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-teal text-2xl font-bold text-white">
                {initials(club.name) || club.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-brand-navy">
                {club.name}
              </h1>
              <p className="mt-1 flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                <MapPin size={14} /> {location ?? t("locationSoon")}
              </p>
            </div>
          </div>

          {/* Contact & social links */}
          <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
            {club.phone && (
              <a href={`tel:${club.phone}`} className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 transition-colors hover:text-brand-navy">
                <Phone size={14} /> {club.phone}
              </a>
            )}
            {club.email && (
              <a href={`mailto:${club.email}`} className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 transition-colors hover:text-brand-navy">
                <Mail size={14} /> {club.email}
              </a>
            )}
            {club.websiteUrl && (
              <a href={club.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 transition-colors hover:text-brand-navy">
                <Globe size={14} /> {t("website")}
              </a>
            )}
            {club.instagramUrl && (
              <a href={club.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 transition-colors hover:text-brand-navy">
                <ExternalLink size={14} /> Instagram
              </a>
            )}
            {club.facebookUrl && (
              <a href={club.facebookUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 transition-colors hover:text-brand-navy">
                <ExternalLink size={14} /> Facebook
              </a>
            )}
            {club.youtubeUrl && (
              <a href={club.youtubeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 transition-colors hover:text-brand-navy">
                <ExternalLink size={14} /> YouTube
              </a>
            )}
          </div>

          {club.disciplines.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {club.disciplines.map((d) => (
                <span
                  key={d.value}
                  className="rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-1 text-xs font-medium text-brand-navy"
                >
                  {d.emoji} {d.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
        {/* Trial CTA */}
        <section className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-brand-navy p-6 text-white sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold">{t("tryClassTitle")}</h2>
            <p className="mt-1 text-sm text-white/70">
              {t("tryClassSubtitle", { club: club.name })}
            </p>
          </div>
          {club.email ? (
            <a
              href={`mailto:${club.email}?subject=${encodeURIComponent(t("trialEmailSubject", { club: club.name }))}&body=${encodeURIComponent(t("trialEmailBody", { club: club.name }))}`}
              className="shrink-0 rounded-lg bg-brand-gold px-5 py-2.5 text-sm font-semibold text-brand-navy transition-opacity hover:opacity-90"
            >
              {t("bookTrial")}
            </a>
          ) : club.phone ? (
            <a
              href={`https://wa.me/${club.phone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-lg bg-brand-gold px-5 py-2.5 text-sm font-semibold text-brand-navy transition-opacity hover:opacity-90"
            >
              {t("bookTrial")}
            </a>
          ) : (
            <span className="shrink-0 rounded-lg bg-brand-gold/50 px-5 py-2.5 text-sm font-semibold text-brand-navy/50 cursor-not-allowed">
              {t("bookTrial")}
            </span>
          )}
        </section>

        {club.description && (
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <h2 className="text-base font-bold text-brand-navy">{t("about")}</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {club.description}
            </p>
          </section>
        )}

        {/* Instructors — compact horizontal strip */}
        {club.instructors.length > 0 ? (
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5">
            <h2 className="flex items-center gap-2 text-base font-bold text-brand-navy mb-3">
              <Users size={16} className="text-brand-teal" /> {t("instructors")}
            </h2>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {club.instructors.map((i) => (
                <div key={i.id} className="group relative flex items-center gap-2">
                  {i.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={i.photoUrl}
                      alt={i.name}
                      className="h-8 w-8 shrink-0 rounded-full border border-slate-200 dark:border-slate-800 object-cover"
                    />
                  ) : (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-teal/10 text-[11px] font-semibold text-brand-teal">
                      {initials(i.name)}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-brand-navy leading-tight">
                      {i.name}
                      <span className="ml-1.5 text-xs font-normal capitalize text-slate-400">
                        {i.role.toLowerCase()}
                      </span>
                    </p>
                    {(i.bio || i.qualifications) && (
                      <p className="text-[11px] text-slate-400 leading-tight truncate max-w-[220px]">
                        {i.qualifications || i.bio}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5">
            <h2 className="flex items-center gap-2 text-base font-bold text-brand-navy mb-2">
              <Users size={16} className="text-brand-teal" /> {t("instructors")}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t("instructorsSoon")}
            </p>
          </section>
        )}

      </div>

      {/* Schedule — wider container so day columns aren't cramped */}
      <div className="mx-auto max-w-6xl px-4 pb-10">
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6">
          <h2 className="flex items-center gap-2 text-base font-bold text-brand-navy mb-4">
            <CalendarDays size={16} className="text-brand-teal" />{" "}
            {t("schedule")}
          </h2>
          {club.classSchedules.length > 0 ? (
            club.styles.length > 0 ? (
              /* Styles exist — one timetable per style */
              <div className="space-y-8">
                {club.styles.map((style) => {
                  const styleClasses = club.classSchedules.filter(
                    (cs) => cs.styleId === style.id,
                  );
                  if (styleClasses.length === 0) return null;
                  return (
                    <WeeklyTimetable
                      key={style.id}
                      title={style.name}
                      classes={styleClasses}
                      slug={slug}
                      t={t}
                    />
                  );
                })}
                {/* Classes with no style assigned */}
                {(() => {
                  const styleIds = new Set(club.styles.map((s) => s.id));
                  const unassigned = club.classSchedules.filter(
                    (cs) => !cs.styleId || !styleIds.has(cs.styleId),
                  );
                  if (unassigned.length === 0) return null;
                  return (
                    <WeeklyTimetable
                      title={t("otherClasses")}
                      classes={unassigned}
                      slug={slug}
                      t={t}
                    />
                  );
                })()}
              </div>
            ) : (
              /* No styles — single flat timetable */
              <WeeklyTimetable
                classes={club.classSchedules}
                slug={slug}
                t={t}
              />
            )
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t("scheduleSoon")}
            </p>
          )}
        </section>
      </div>

      <ClubFooter />
    </div>
  );
}

/**
 * Weekly timetable grid — columns per day, stacked class cards.
 * On mobile (<sm), days stack vertically. On tablet+, a column grid.
 */
function WeeklyTimetable({
  title,
  classes,
  slug,
  t,
}: {
  title?: string;
  classes: PublicClub["classSchedules"][number][];
  slug: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
}) {
  const activeDays = DAY_ORDER.filter((day) =>
    classes.some((cs) => cs.dayOfWeek === day),
  );

  return (
    <div>
      {title && (
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-brand-teal">
          {title}
        </h3>
      )}
      {/* Desktop/tablet: column grid with horizontal scroll fallback */}
      <div className="hidden sm:block overflow-x-auto -mx-2 px-2">
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: `repeat(${activeDays.length}, minmax(160px, 1fr))`,
          }}
        >
          {activeDays.map((day) => (
            <div key={day} className="min-w-0">
              <p className="mb-2 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {t(`dayShort.${day}`)}
              </p>
              <div className="space-y-2">
                {classes
                  .filter((cs) => cs.dayOfWeek === day)
                  .map((cs) => (
                    <ScheduleCard key={cs.id} cs={cs} />
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Mobile: stacked by day */}
      <div className="sm:hidden space-y-3">
        {activeDays.map((day) => (
          <div key={day}>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {t(`dayShort.${day}`)}
            </p>
            <div className="space-y-2">
              {classes
                .filter((cs) => cs.dayOfWeek === day)
                .map((cs) => (
                  <ScheduleCard key={cs.id} cs={cs} />
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** A single class card within the timetable grid. */
const LEVEL_SHORT: Record<string, string> = {
  ALL_LEVELS: "All",
  BEGINNER: "Beg",
  INTERMEDIATE: "Int",
  ADVANCED: "Adv",
};

const LEVEL_COLOR: Record<string, string> = {
  ALL_LEVELS: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  BEGINNER: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  INTERMEDIATE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  ADVANCED: "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
};

function ScheduleCard({
  cs,
}: {
  cs: PublicClub["classSchedules"][number];
}) {
  const levelLabel = LEVEL_SHORT[cs.level] ?? cs.level.replace("_", " ");
  const levelColor = LEVEL_COLOR[cs.level] ?? "bg-slate-100 text-slate-600";

  return (
    <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-sm">
      <span
        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${levelColor}`}
      >
        {levelLabel}
      </span>
      <p className="mt-1.5 text-sm font-medium text-brand-navy leading-snug">
        {cs.name}
      </p>
      <p className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
        <Clock size={12} className="text-brand-teal shrink-0" />
        {cs.startTime} – {cs.endTime}
      </p>
    </div>
  );
}

/** Placeholder shown when a club hasn't set up its public profile yet. */
async function ClubComingSoon({ name }: { name: string }) {
  const t = await getTranslations("Club");
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-teal text-2xl font-bold text-white">
              {name.charAt(0)}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-brand-navy">{name}</h1>
              <p className="mt-1 flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                <MapPin size={14} /> {t("locationSoon")}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center">
          <div className="mb-3 text-4xl">🥋</div>
          <h2 className="text-lg font-bold text-brand-navy">
            {t("comingSoonTitle")}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
            {t("comingSoonBody", { name })}
          </p>
          <Link
            href="/register"
            className="mt-6 inline-flex rounded-lg bg-brand-teal px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {t("runYourOwn")}
          </Link>
        </div>
      </div>

      <ClubFooter />
    </div>
  );
}

async function ClubFooter() {
  const t = await getTranslations("Club");
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 py-6">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4">
        <Link href="/" className="flex items-center">
          <Logo size={24} />
        </Link>
        <p className="text-xs text-slate-400">{t("poweredBy")}</p>
      </div>
    </footer>
  );
}
