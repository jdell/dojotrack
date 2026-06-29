import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  Award,
  CalendarDays,
  Check,
  CreditCard,
  Layers,
  QrCode,
  Shield,
  Star,
  Swords,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/logo";
import { LanguageSwitcher } from "@/components/language-switcher";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Landing" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

/** Feature icons, paired by index with the translated `Landing.features` array. */
const FEATURE_ICONS: LucideIcon[] = [
  Layers,        // Multiple styles
  Users,         // Student management
  Award,         // Belt progression
  Shield,        // Team management
  CalendarDays,  // Class scheduling
  QrCode,        // QR check-in
  CreditCard,    // Flexible payments
  Trophy,        // Competition tracking
  Swords,        // Sparring pairing
];

interface TextItem {
  title: string;
  desc: string;
}
interface Testimonial {
  quote: string;
  name: string;
  role: string;
}

export default function LandingPage() {
  const t = useTranslations("Landing");
  const tCommon = useTranslations("Common");

  const features = t.raw("features") as TextItem[];
  const testimonials = t.raw("testimonials") as Testimonial[];

  // Plan metadata that isn't translated (prices, layout) lives here; the copy
  // comes from the message catalog.
  const plans = [
    {
      name: t("planFreeName"),
      price: "$0",
      cadence: t("pricingForever"),
      blurb: t("planFreeBlurb"),
      features: t.raw("planFreeFeatures") as string[],
      cta: t("planFreeCta"),
      highlighted: false,
    },
    {
      name: t("planProName"),
      price: "$29",
      cadence: t("pricingPerMonth"),
      blurb: t("planProBlurb"),
      features: t.raw("planProFeatures") as string[],
      cta: t("planProCta"),
      highlighted: true,
    },
  ];

  const footerCols = [
    {
      heading: t("footerProduct"),
      links: [
        { label: t("footerFeatures"), href: "#features" },
        { label: t("footerPricing"), href: "#pricing" },
        { label: t("footerRegister"), href: "/register" },
        { label: t("footerBlog"), href: "/blog" },
      ],
    },
    {
      heading: t("footerAccount"),
      links: [
        { label: tCommon("logIn"), href: "/login" },
        { label: tCommon("getStarted"), href: "/register" },
      ],
    },
    {
      heading: t("footerCompany"),
      links: [
        { label: t("footerAbout"), href: "/about" },
        { label: t("footerContact"), href: "/contact" },
        { label: t("footerPrivacy"), href: "/privacy" },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">
              {t("navFeatures")}
            </a>
            <a href="#pricing" className="transition-colors hover:text-foreground">
              {t("navPricing")}
            </a>
            <Link href="/blog" className="transition-colors hover:text-foreground">
              {t("navBlog")}
            </Link>
            <a href="#testimonials" className="transition-colors hover:text-foreground">
              {t("navTestimonials")}
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <LanguageSwitcher variant="light" />
            <Link
              href="/login"
              className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline"
            >
              {tCommon("logIn")}
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-brand-teal px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              {tCommon("getStarted")}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-brand-teal/5 to-transparent"
        />
        <div className="mx-auto max-w-3xl px-6 py-24 text-center sm:py-32">
          <p className="eyebrow mb-6">{t("heroEyebrow")}</p>
          <h1 className="mx-auto max-w-2xl text-4xl font-bold leading-tight tracking-tight text-brand-navy sm:text-6xl">
            {t("heroTitleLead")}{" "}
            <span className="text-brand-teal">{t("heroTitleAccent")}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            {t("heroSubtitle")}
          </p>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-teal px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            >
              {t("heroCtaPrimary")} <ArrowRight size={16} />
            </Link>
            <a
              href="#features"
              className="rounded-xl border border-border px-7 py-3.5 text-sm font-semibold transition-colors hover:bg-muted"
            >
              {t("heroCtaSecondary")}
            </a>
          </div>
          <p className="mt-5 text-xs text-muted-foreground">{t("heroNote")}</p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="eyebrow mb-3">{t("featuresEyebrow")}</p>
            <h2 className="text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl">
              {t("featuresTitle")}
            </h2>
            <p className="mt-3 text-muted-foreground">{t("featuresSubtitle")}</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => {
              const Icon = FEATURE_ICONS[i] ?? Users;
              return (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-border bg-background p-6 transition-shadow hover:shadow-md"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-teal/10 text-brand-teal">
                    <Icon size={22} />
                  </div>
                  <h3 className="mb-1.5 text-lg font-bold tracking-tight text-brand-navy">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {feature.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-24">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="eyebrow mb-3">{t("pricingEyebrow")}</p>
            <h2 className="text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl">
              {t("pricingTitle")}
            </h2>
            <p className="mt-3 text-muted-foreground">{t("pricingSubtitle")}</p>
          </div>
          <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-2">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl border p-8 ${
                  plan.highlighted
                    ? "border-brand-teal bg-brand-navy text-white shadow-lg"
                    : "border-border bg-background"
                }`}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-8 rounded-full bg-brand-gold px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-navy">
                    {t("pricingMostPopular")}
                  </span>
                )}
                <h3
                  className={`text-lg font-bold ${plan.highlighted ? "text-white" : "text-brand-navy"}`}
                >
                  {plan.name}
                </h3>
                <div className="mt-3 flex items-end gap-1.5">
                  <span
                    className={`text-4xl font-bold ${plan.highlighted ? "text-white" : "text-brand-navy"}`}
                  >
                    {plan.price}
                  </span>
                  <span
                    className={`pb-1 text-sm ${plan.highlighted ? "text-white/60" : "text-muted-foreground"}`}
                  >
                    {plan.cadence}
                  </span>
                </div>
                <p
                  className={`mt-3 text-sm ${plan.highlighted ? "text-white/70" : "text-muted-foreground"}`}
                >
                  {plan.blurb}
                </p>
                <ul className="mt-6 space-y-3 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check
                        size={18}
                        className={`mt-0.5 shrink-0 ${plan.highlighted ? "text-brand-gold" : "text-brand-teal"}`}
                      />
                      <span className={plan.highlighted ? "text-white/90" : ""}>
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`mt-8 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-opacity hover:opacity-90 ${
                    plan.highlighted
                      ? "bg-brand-gold text-brand-navy"
                      : "bg-brand-teal text-white"
                  }`}
                >
                  {plan.cta} <ArrowRight size={16} />
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-xs text-muted-foreground">
            {t("pricingNote")}
          </p>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="eyebrow mb-3">{t("testimonialsEyebrow")}</p>
            <h2 className="text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl">
              {t("testimonialsTitle")}
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((item) => (
              <figure
                key={item.name}
                className="flex flex-col rounded-2xl border border-border bg-background p-6"
              >
                <div className="mb-4 flex gap-0.5 text-brand-gold">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={16} fill="currentColor" />
                  ))}
                </div>
                <blockquote className="flex-1 text-sm leading-relaxed text-foreground/90">
                  “{item.quote}”
                </blockquote>
                <figcaption className="mt-5 border-t border-border pt-4">
                  <p className="text-sm font-semibold text-brand-navy">
                    {item.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.role}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl">
            {t("finalCtaTitle")}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            {t("finalCtaSubtitle")}
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-teal px-7 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {tCommon("getStarted")} <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/40">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <Logo size={28} />
              <p className="mt-3 max-w-xs text-sm text-muted-foreground">
                {tCommon("tagline")}
              </p>
            </div>
            {footerCols.map((col) => (
              <div key={col.heading}>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand-navy">
                  {col.heading}
                </h3>
                <ul className="space-y-2 text-sm">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="text-muted-foreground transition-colors hover:text-brand-teal"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 sm:flex-row">
            <p className="text-xs text-muted-foreground">{t("footerRights")}</p>
            <p className="text-xs text-muted-foreground">{t("footerSupports")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
