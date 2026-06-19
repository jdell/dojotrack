import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSparringSessionDetail, getCurrentClub } from "@/lib/queries";
import { isDbConfigured } from "@/lib/db";
import { DISCIPLINES } from "@/lib/constants";
import { SparringEditForm } from "./sparring-edit-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Sparring" });
  return { title: `${t("editSession")} — EntrenaDojo` };
}

export const dynamic = "force-dynamic";

export default async function SparringEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("Sparring");
  if (!isDbConfigured()) notFound();

  const club = await getCurrentClub();
  if (!club) notFound();

  const session = await getSparringSessionDetail(id, club.id);
  if (!session) notFound();

  const disciplines = DISCIPLINES.filter(
    (d) =>
      club.disciplines.includes(d.value) ||
      d.value === session.discipline,
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href={`/sparring/${id}`}
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-navy"
        >
          <ArrowLeft size={15} />
          {t("backToSparring")}
        </Link>
        <p className="eyebrow">{t("editSession")}</p>
        <h1 className="text-2xl font-bold text-brand-navy">
          {session.name ?? t("sessionFallback")}
        </h1>
      </div>

      <SparringEditForm
        sessionId={session.id}
        initialData={{
          name: session.name ?? "",
          discipline: session.discipline ?? "",
          date: session.date.slice(0, 10),
          rounds: String(session.rounds),
          notes: session.notes ?? "",
        }}
        disciplines={disciplines}
      />
    </div>
  );
}
