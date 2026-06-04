import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCertificateData } from "@/lib/queries";
import { isDbConfigured } from "@/lib/db";
import { formatDate, readableTextColor } from "@/lib/utils";
import { BRAND } from "@/lib/constants";
import { PrintButton } from "./print-button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Public.certificate" });
  return { title: t("metaTitle") };
}

export const dynamic = "force-dynamic";

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ candidateId: string }>;
}) {
  const { candidateId } = await params;
  const t = await getTranslations("Public.certificate");

  if (!isDbConfigured()) notFound();
  const cert = await getCertificateData(candidateId);
  if (!cert) notFound();

  if (!cert.passed) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-brand-navy">
          {t("unavailableTitle")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("unavailableBody")}
        </p>
        <Link
          href="/belts/exams"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-brand-teal hover:underline"
        >
          <ArrowLeft size={15} />
          {t("backToExams")}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40 px-4 py-10 print:bg-white print:p-0">
      {/* Print setup + force colour fidelity when printing. */}
      <style>{`
        @page { size: A4 landscape; margin: 12mm; }
        @media print {
          html, body { background: #fff; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="mx-auto mb-6 flex max-w-3xl items-center justify-between print:hidden">
        <Link
          href="/belts/exams"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-navy"
        >
          <ArrowLeft size={15} />
          {t("backToExams")}
        </Link>
        <PrintButton />
      </div>

      {/* The certificate */}
      <article className="mx-auto max-w-3xl bg-white p-3 shadow-lg print:max-w-none print:shadow-none">
        <div className="relative overflow-hidden rounded-lg border-[3px] border-brand-gold p-10 text-center sm:p-14">
          <div
            className="pointer-events-none absolute inset-2 rounded border border-brand-gold/40"
            aria-hidden
          />

          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-teal">
            {cert.clubName}
          </p>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-6 text-sm text-muted-foreground">
            {t("certifyThat")}
          </p>
          <p className="mt-2 text-2xl font-bold text-brand-navy sm:text-3xl">
            {cert.studentName}
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            {t("awardedRank")}
          </p>
          <p className="mt-3 inline-flex items-center gap-3">
            <span
              className="inline-flex items-center rounded-full border border-black/10 px-4 py-1.5 text-lg font-bold"
              style={{
                backgroundColor: cert.beltColor,
                color: readableTextColor(cert.beltColor),
              }}
            >
              {cert.beltName}
            </span>
          </p>

          <div className="mt-10 flex flex-wrap items-end justify-center gap-x-16 gap-y-6 text-sm">
            <div className="text-center">
              <p className="border-t border-slate-300 pt-1 font-medium text-brand-navy">
                {formatDate(cert.date)}
              </p>
              <p className="text-xs text-muted-foreground">{t("dateAwarded")}</p>
            </div>
            <div className="text-center">
              <p className="border-t border-slate-300 pt-1 font-medium text-brand-navy">
                {cert.instructorName}
              </p>
              <p className="text-xs text-muted-foreground">{t("assessedBy")}</p>
            </div>
          </div>

          {cert.location && (
            <p className="mt-8 text-xs text-muted-foreground">
              {t("awardedAt", { location: cert.location })}
            </p>
          )}
          <p className="mt-2 text-[0.65rem] uppercase tracking-widest text-muted-foreground">
            {t("issuedVia", { brand: BRAND.name })}
          </p>
        </div>
      </article>
    </div>
  );
}
