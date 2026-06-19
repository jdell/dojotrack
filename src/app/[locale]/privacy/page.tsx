import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/logo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Privacy" });
  return { title: `${t("privacyTitle")} — EntrenaDojo` };
}

export default async function PrivacyPage() {
  const t = await getTranslations("Privacy");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <Logo />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-navy"
          >
            <ArrowLeft size={15} />
            {t("privacyContact")}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold tracking-tight text-brand-navy">
          {t("privacyTitle")}
        </h1>
        <p className="mt-4 text-muted-foreground">{t("privacyIntro")}</p>

        <section className="mt-10 space-y-8">
          <div>
            <h2 className="text-lg font-bold text-brand-navy">
              {t("privacyDataCollection")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t("privacyDataCollectionBody")}
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-brand-navy">
              {t("privacyAuth")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t("privacyAuthBody")}
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-brand-navy">
              {t("privacyPayments")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t("privacyPaymentsBody")}
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-brand-navy">
              {t("privacyContact")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t("privacyContactBody")}
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
