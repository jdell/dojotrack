import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  ArrowLeft,
  Clock,
  Mail,
  MessageCircle,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { ContactForm } from "./contact-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Contact" });
  return { title: `${t("contactTitle")} — EntrenaDojo` };
}

export default async function ContactPage() {
  const t = await getTranslations("Contact");

  const faqs = [
    { q: t("faq1Q"), a: t("faq1A") },
    { q: t("faq2Q"), a: t("faq2A") },
    { q: t("faq3Q"), a: t("faq3A") },
  ];

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
            {t("contactTitle")}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-16">
        {/* Title */}
        <section className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-brand-navy sm:text-5xl">
            {t("contactTitle")}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            {t("contactSubtitle")}
          </p>
        </section>

        {/* Contact methods */}
        <section className="mt-14 grid gap-6 sm:grid-cols-2">
          {/* Email card */}
          <a
            href="mailto:hola@entrenadojo.es"
            className="group rounded-2xl border border-border bg-background p-6 transition-shadow hover:shadow-md"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-teal/10 text-brand-teal">
              <Mail size={22} />
            </div>
            <h3 className="mb-1.5 text-lg font-bold tracking-tight text-brand-navy">
              {t("contactEmail")}
            </h3>
            <p className="text-sm text-brand-teal group-hover:underline">
              hola@entrenadojo.es
            </p>
          </a>

          {/* WhatsApp card */}
          <a
            href={`https://wa.me/34XXXXXXXXX?text=${encodeURIComponent(t("contactWhatsAppMessage"))}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-2xl border border-border bg-background p-6 transition-shadow hover:shadow-md"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-teal/10 text-brand-teal">
              <MessageCircle size={22} />
            </div>
            <h3 className="mb-1.5 text-lg font-bold tracking-tight text-brand-navy">
              {t("contactWhatsApp")}
            </h3>
            <p className="text-sm text-brand-teal group-hover:underline">
              WhatsApp
            </p>
          </a>
        </section>

        {/* Contact form */}
        <section className="mt-14">
          <ContactForm />
        </section>

        {/* Response time */}
        <section className="mt-10 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Clock size={16} className="text-brand-teal" />
          <p>{t("contactResponseTime")}</p>
        </section>

        {/* FAQ teaser */}
        <section className="mt-20">
          <h2 className="mb-8 text-2xl font-bold tracking-tight text-brand-navy">
            {t("faqTitle")}
          </h2>
          <div className="space-y-6">
            {faqs.map((faq) => (
              <div
                key={faq.q}
                className="rounded-2xl border border-border bg-background p-6"
              >
                <h3 className="font-bold text-brand-navy">{faq.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
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
            {t("contactTitle")}
          </Link>
        </div>
      </footer>
    </div>
  );
}
