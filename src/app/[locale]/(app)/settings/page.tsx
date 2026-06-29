import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  getClubSettings,
  getTeamMembers,
  getCurrentUser,
  getClubStyles,
  ensureStyles,
} from "@/lib/queries";
import { isDbConfigured } from "@/lib/db";
import { isStripeConfigured } from "@/lib/stripe";
import { isWhatsAppConfigured } from "@/lib/notify";
import { prisma } from "@/lib/prisma";
import { BRAND, DISCIPLINES } from "@/lib/constants";
import { SettingsForm } from "./settings-form";
import { StripeConnect } from "./stripe-connect";
import { UpgradeBanner } from "./upgrade-banner";
import { WhatsAppStatus } from "./whatsapp-status";
import { TeamSection } from "./team-section";
import { StylesSection } from "./styles-section";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Settings" });
  return { title: `${t("title")} — EntrenaDojo` };
}

export const dynamic = "force-dynamic";

/** Public host shown next to the slug — derived from the brand URL. */
function publicHost(): string {
  try {
    return new URL(BRAND.url).host;
  } catch {
    return "entrenadojo.es";
  }
}

export default async function SettingsPage() {
  const settings = isDbConfigured() ? await getClubSettings() : null;
  const t = await getTranslations("Settings");

  // Load club tier for upgrade banner
  let clubTier: "FREE" | "PRO" = "FREE";
  const currentUser = isDbConfigured() ? await getCurrentUser() : null;
  const teamMembers =
    isDbConfigured() && settings ? await getTeamMembers(settings.id) : [];

  // Styles: ensure auto-created from disciplines, then load.
  let clubStyles: Awaited<ReturnType<typeof getClubStyles>> = [];
  if (isDbConfigured() && settings) {
    try {
      // Build a minimal ClubSummary for ensureStyles.
      const clubForStyles = await prisma.club.findUnique({
        where: { id: settings.id },
        select: {
          id: true,
          name: true,
          slug: true,
          beltSystemId: true,
          disciplines: true,
          locale: true,
          currency: true,
          tier: true,
        },
      });
      if (clubForStyles) {
        await ensureStyles({
          id: clubForStyles.id,
          name: clubForStyles.name,
          slug: clubForStyles.slug,
          beltSystemId: clubForStyles.beltSystemId,
          disciplines: clubForStyles.disciplines,
          locale: clubForStyles.locale,
          currency: clubForStyles.currency ?? "eur",
          tier: clubForStyles.tier,
        });
      }
    } catch {
      // best effort
    }
    clubStyles = await getClubStyles(settings.id);
  }

  if (isDbConfigured() && settings) {
    try {
      const club = await prisma.club.findUnique({
        where: { id: settings.id },
        select: { tier: true },
      });
      if (club) clubTier = club.tier;
    } catch {
      // Fall through
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 className="text-2xl font-bold text-brand-navy">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {settings ? (
        <>
          <SettingsForm settings={settings} publicHost={publicHost()} />
          {currentUser && (
            <TeamSection
              members={teamMembers}
              currentUserId={currentUser.id}
              currentUserRole={currentUser.role}
            />
          )}
          <StylesSection
            styles={clubStyles}
            disciplines={DISCIPLINES.map((d) => ({
              value: d.value,
              label: d.label,
              emoji: d.emoji,
            }))}
          />
          <UpgradeBanner clubTier={clubTier} />
          {isStripeConfigured() && clubTier === "PRO" && (
            <StripeConnect
              initialConnected={settings.stripeConnected}
              initialOnboarded={settings.stripeOnboarded}
            />
          )}
          <WhatsAppStatus configured={isWhatsAppConfigured()} />
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <div className="mx-auto mb-3 text-4xl">🥋</div>
          <h2 className="text-lg font-bold text-brand-navy">
            {t("noClubTitle")}
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            {t("noClubSubtitle")}
          </p>
          <Link
            href="/register"
            className="mt-6 inline-flex rounded-lg bg-brand-teal px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {t("registerClub")}
          </Link>
        </div>
      )}
    </div>
  );
}
