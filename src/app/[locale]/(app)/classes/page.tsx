import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CalendarPlus } from "lucide-react";
import {
  getClassSchedules,
  getCurrentClub,
  getCurrentStudent,
} from "@/lib/queries";
import { ClassesView } from "./classes-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Classes" });
  return { title: `${t("title")} — DojoTrack` };
}

// Schedule + enrolment counts are per-request, DB-backed — never pre-rendered.
export const dynamic = "force-dynamic";

export default async function ClassesPage() {
  const t = await getTranslations("Classes");
  const club = await getCurrentClub();
  const student = club ? await getCurrentStudent(club.id) : null;
  const classes = club
    ? await getClassSchedules(club.id, student?.id ?? null)
    : [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">{t("eyebrow")}</p>
          <h1 className="text-2xl font-bold text-brand-navy">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        <Link
          href="/classes/new"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-teal px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90"
        >
          <CalendarPlus size={16} />
          {t("addClass")}
        </Link>
      </div>

      <ClassesView classes={classes} student={student} />
    </div>
  );
}
