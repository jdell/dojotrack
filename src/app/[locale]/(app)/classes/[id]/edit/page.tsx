import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  getClassDetail,
  getClubStyles,
  getCurrentClub,
  getInstructorOptions,
} from "@/lib/queries";
import { isDbConfigured } from "@/lib/db";
import { DISCIPLINES } from "@/lib/constants";
import { ClassEditForm } from "./class-edit-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Classes" });
  return { title: `${t("editClass")} — EntrenaDojo` };
}

export const dynamic = "force-dynamic";

export default async function ClassEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("Classes");
  if (!isDbConfigured()) notFound();

  const club = await getCurrentClub();
  if (!club) notFound();

  const detail = await getClassDetail(id, club.id);
  if (!detail) notFound();

  const instructors = await getInstructorOptions(club.id);
  const clubStyles = await getClubStyles(club.id);
  const activeStyles = clubStyles
    .filter((s) => s.active)
    .map((s) => ({ id: s.id, discipline: s.discipline, name: s.name }));
  const disciplines = DISCIPLINES.filter(
    (d) => club.disciplines.includes(d.value) || d.value === detail.discipline,
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href={`/classes/${id}`}
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-navy"
        >
          <ArrowLeft size={15} />
          {t("backToSchedule")}
        </Link>
        <p className="eyebrow">{t("editClass")}</p>
        <h1 className="text-2xl font-bold text-brand-navy">
          {detail.name}
        </h1>
      </div>

      <ClassEditForm
        classId={detail.id}
        initialData={{
          name: detail.name,
          discipline: detail.discipline,
          dayOfWeek: detail.dayOfWeek,
          daysOfWeek: [detail.dayOfWeek],
          startTime: detail.startTime,
          endTime: detail.endTime,
          instructorId: detail.instructorId ?? "",
          maxStudents: String(detail.maxStudents),
          location: detail.location ?? "",
          level: detail.level,
        }}
        disciplines={disciplines}
        instructors={instructors}
        styles={activeStyles.length > 0 ? activeStyles : undefined}
      />
    </div>
  );
}
