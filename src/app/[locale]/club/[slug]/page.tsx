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
import { DAY_ORDER, DAY_SHORT } from "@/lib/schedule";
import type { DayOfWeek } from "@prisma/client";
import { Logo } from "@/components/logo";
import { getClubBySlug, type PublicClub } from "@/lib/queries";
import { baseUrl } from "@/lib/invite";
import { initials } from "@/lib/utils";

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
    <div className="min-h-screen bg-slate-50">
      {/* Structured data for search engines (Organization + SportsActivityLocation). */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="flex items-center gap-4">
            {club.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={club.logoUrl}
                alt={club.name}
                className="h-16 w-16 shrink-0 rounded-2xl border border-slate-200 object-cover"
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
              <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                <MapPin size={14} /> {location ?? t("locationSoon")}
              </p>
            </div>
          </div>

          {/* Contact & social links */}
          <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4">
            {club.phone && (
              <a href={`tel:${club.phone}`} className="flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-brand-navy">
                <Phone size={14} /> {club.phone}
              </a>
            )}
            {club.email && (
              <a href={`mailto:${club.email}`} className="flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-brand-navy">
                <Mail size={14} /> {club.email}
              </a>
            )}
            {club.websiteUrl && (
              <a href={club.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-brand-navy">
                <Globe size={14} /> {t("website")}
              </a>
            )}
            {club.instagramUrl && (
              <a href={club.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-brand-navy">
                <ExternalLink size={14} /> Instagram
              </a>
            )}
            {club.facebookUrl && (
              <a href={club.facebookUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-brand-navy">
                <ExternalLink size={14} /> Facebook
              </a>
            )}
            {club.youtubeUrl && (
              <a href={club.youtubeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-brand-navy">
                <ExternalLink size={14} /> YouTube
              </a>
            )}
          </div>

          {club.disciplines.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {club.disciplines.map((d) => (
                <span
                  key={d.value}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-brand-navy"
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
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-base font-bold text-brand-navy">{t("about")}</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">
              {club.description}
            </p>
          </section>
        )}

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Schedule */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="flex items-center gap-2 text-base font-bold text-brand-navy">
              <CalendarDays size={16} className="text-brand-teal" />{" "}
              {t("schedule")}
            </h2>
            {club.classSchedules.length > 0 ? (
              <div className="mt-3 space-y-2">
                {DAY_ORDER.filter((day) =>
                  club.classSchedules.some((cs) => cs.dayOfWeek === day)
                ).map((day) => (
                  <div key={day}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">
                      {DAY_SHORT[day]}
                    </p>
                    {club.classSchedules
                      .filter((cs) => cs.dayOfWeek === day)
                      .map((cs) => (
                        <div
                          key={cs.id}
                          className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2 mb-1"
                        >
                          <Clock size={14} className="text-brand-teal shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-brand-navy truncate">
                              {cs.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {cs.startTime} – {cs.endTime}
                              {cs.location && ` · ${cs.location}`}
                              {cs.instructorName && ` · ${cs.instructorName}`}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-500">
                            {cs.level.replace("_", " ")}
                          </span>
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">{t("scheduleSoon")}</p>
            )}
          </section>

          {/* Instructors */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="flex items-center gap-2 text-base font-bold text-brand-navy">
              <Users size={16} className="text-brand-teal" /> {t("instructors")}
            </h2>
            {club.instructors.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {club.instructors.map((i) => (
                  <li key={i.id} className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-teal/10 text-xs font-semibold text-brand-teal">
                      {initials(i.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-brand-navy">
                        {i.name}
                      </p>
                      <p className="text-xs capitalize text-slate-400">
                        {i.role.toLowerCase()}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                {t("instructorsSoon")}
              </p>
            )}
          </section>
        </div>
      </div>

      <ClubFooter />
    </div>
  );
}

/** Placeholder shown when a club hasn't set up its public profile yet. */
async function ClubComingSoon({ name }: { name: string }) {
  const t = await getTranslations("Club");
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-teal text-2xl font-bold text-white">
              {name.charAt(0)}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-brand-navy">{name}</h1>
              <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                <MapPin size={14} /> {t("locationSoon")}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <div className="mb-3 text-4xl">🥋</div>
          <h2 className="text-lg font-bold text-brand-navy">
            {t("comingSoonTitle")}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
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
    <footer className="border-t border-slate-200 py-6">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4">
        <Link href="/" className="flex items-center">
          <Logo size={24} />
        </Link>
        <p className="text-xs text-slate-400">{t("poweredBy")}</p>
      </div>
    </footer>
  );
}
