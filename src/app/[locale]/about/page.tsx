import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Shield,
  Sparkles,
  Swords,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/logo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "About" });
  return { title: `${t("aboutTitle")} — EntrenaDojo` };
}

const VALUES: { key: string; icon: LucideIcon }[] = [
  { key: "1", icon: Sparkles },
  { key: "2", icon: Users },
  { key: "3", icon: Shield },
  { key: "4", icon: Swords },
];

export default async function AboutPage() {
  const t = await getTranslations("About");

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <Logo />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-navy"
          >
            <ArrowLeft size={15} />
            {t("aboutTitle")}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-16">
        {/* Hero / Mission */}
        <section className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-brand-navy sm:text-5xl">
            {t("aboutTitle")}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {t("aboutMission")}
          </p>
        </section>

        {/* Story */}
        <section className="mt-20">
          <h2 className="text-2xl font-bold tracking-tight text-brand-navy">
            {t("aboutStoryTitle")}
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            {t("aboutStory")}
          </p>
        </section>

        {/* Values */}
        <section className="mt-20">
          <h2 className="mb-10 text-center text-2xl font-bold tracking-tight text-brand-navy">
            {t("aboutValuesTitle")}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {VALUES.map(({ key, icon: Icon }) => (
              <div
                key={key}
                className="rounded-2xl border border-border bg-background p-6 transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-teal/10 text-brand-teal">
                  <Icon size={22} />
                </div>
                <h3 className="mb-1.5 text-lg font-bold tracking-tight text-brand-navy">
                  {t(`value${key}Title`)}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t(`value${key}Desc`)}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Team */}
        <section className="mt-20">
          <h2 className="mb-10 text-center text-2xl font-bold tracking-tight text-brand-navy">
            {t("aboutTeamTitle")}
          </h2>
          <div className="mx-auto max-w-md rounded-2xl border border-border bg-background p-8 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-brand-teal text-2xl font-bold text-white">
              JC
            </div>
            <h3 className="text-lg font-bold text-brand-navy">
              {t("founderName")}
            </h3>
            <p className="mt-1 text-sm font-medium text-brand-teal">
              {t("founderRole")}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {t("founderBio")}
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="mt-20 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-brand-navy">
            {t("aboutCtaTitle")}
          </h2>
          <Link
            href="/register"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-teal px-7 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {t("aboutCtaButton")} <ArrowRight size={16} />
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-border bg-muted/40">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-6 py-10 sm:flex-row sm:justify-between">
          <Logo size={28} />
          <Link
            href="/"
            className="text-sm text-muted-foreground transition-colors hover:text-brand-teal"
          >
            <ArrowLeft size={14} className="mr-1 inline" />
            {t("aboutTitle")}
          </Link>
        </div>
      </footer>
    </div>
  );
}
