import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getClubSettings } from "@/lib/queries";
import { isDbConfigured } from "@/lib/db";
import { BRAND } from "@/lib/constants";
import { SettingsForm } from "./settings-form";

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
    return "entrenadojo.app";
  }
}

export default async function SettingsPage() {
  const settings = isDbConfigured() ? await getClubSettings() : null;
  const t = await getTranslations("Settings");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 className="text-2xl font-bold text-brand-navy">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {settings ? (
        <SettingsForm settings={settings} publicHost={publicHost()} />
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
