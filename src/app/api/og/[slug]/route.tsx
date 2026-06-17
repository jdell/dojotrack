import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { getClubBySlug } from "@/lib/queries";
import { routing } from "@/i18n/routing";

/**
 * GET /api/og/[slug] — a dynamic 1200×630 OpenGraph image for a club's public
 * page, used as the social share card (see the `openGraph.images` in
 * `/club/[slug]`'s metadata).
 *
 * Runs on the Node runtime (not edge) because it reads the club via Prisma's pg
 * adapter, which isn't edge-compatible. `next/og`'s `ImageResponse` renders
 * fine under Node. We render only with system/default fonts (no external font
 * fetch) so the route has no network dependency and always builds.
 */
export const dynamic = "force-dynamic";

const TEAL = "#0d9488";
const NAVY = "#1e3a5f";
const GOLD = "#d4a843";

type RouteContext = { params: Promise<{ slug: string }> };

/** "gracie-barra-downtown" → "Gracie Barra Downtown" (fallback when no club). */
function humanize(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export async function GET(request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const club = await getClubBySlug(slug).catch(() => null);

  // Localize the CTA from the `?lang=` hint the club page appends (en/es/gl).
  const langParam = new URL(request.url).searchParams.get("lang");
  const locale =
    langParam && (routing.locales as readonly string[]).includes(langParam)
      ? langParam
      : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: "Club" });
  const ctaText = t("ogCta");

  const name = club?.name ?? humanize(slug) ?? "EntrenaDojo Club";
  const location =
    [club?.city, club?.country].filter(Boolean).join(", ") || null;
  const disciplines = (club?.disciplines ?? []).map((d) => d.label).slice(0, 4);

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: NAVY,
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Brand wordmark */}
        <div style={{ display: "flex", alignItems: "center", fontSize: 34, fontWeight: 700 }}>
          <span style={{ color: "#ffffff" }}>Entrena</span>
          <span style={{ color: GOLD }}>Dojo</span>
        </div>

        {/* Club name + location */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 76,
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 1.05,
              maxWidth: 1000,
            }}
          >
            {name}
          </div>
          {location && (
            <div style={{ marginTop: 20, fontSize: 34, color: "#cbd5e1" }}>
              {location}
            </div>
          )}
          {disciplines.length > 0 && (
            <div style={{ display: "flex", marginTop: 32, flexWrap: "wrap" }}>
              {disciplines.map((d) => (
                <div
                  key={d}
                  style={{
                    display: "flex",
                    marginRight: 16,
                    marginTop: 12,
                    padding: "10px 22px",
                    borderRadius: 999,
                    background: "rgba(13,148,136,0.18)",
                    border: `2px solid ${TEAL}`,
                    color: "#ffffff",
                    fontSize: 28,
                  }}
                >
                  {d}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer CTA bar */}
        <div style={{ display: "flex", alignItems: "center", fontSize: 30, color: "#94a3b8" }}>
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: 4,
              background: TEAL,
              marginRight: 16,
            }}
          />
          {ctaText}
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
