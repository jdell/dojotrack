import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/logo";
import { getPublicPaymentData } from "@/lib/queries";
import { initials } from "@/lib/utils";
import { PayForm } from "./pay-form";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const data = await getPublicPaymentData(slug);
  if (!data) return { title: "Pay — EntrenaDojo" };
  const t = await getTranslations({ locale, namespace: "Pay" });
  return {
    title: `${t("payTitle")} — ${data.club.name} — EntrenaDojo`,
    description: t("paySubtitle", { club: data.club.name }),
  };
}

export default async function PublicPayPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ plan?: string; status?: string }>;
}) {
  const { slug } = await params;
  const { plan: planId, status } = await searchParams;

  const data = await getPublicPaymentData(slug);
  if (!data) notFound();

  const t = await getTranslations("Pay");
  const { club, plans } = data;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-2xl px-4 py-8">
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
              <p className="mt-1 text-sm text-slate-500">
                {t("paySubtitle", { club: club.name })}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
        <PayForm
          club={{ name: club.name, slug: club.slug }}
          plans={plans}
          preselectedPlanId={planId ?? null}
          status={status ?? null}
        />
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4">
          <Link href={`/club/${slug}`} className="text-xs text-slate-400 hover:text-brand-navy transition-colors">
            {club.name}
          </Link>
          <Link href="/" className="flex items-center">
            <Logo size={24} />
          </Link>
        </div>
      </footer>
    </div>
  );
}
