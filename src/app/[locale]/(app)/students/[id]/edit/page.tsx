import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  getBeltOptions,
  getCurrentClub,
  getFamilies,
  getStudentForEdit,
} from "@/lib/queries";
import { isDbConfigured } from "@/lib/db";
import { StudentEditForm } from "./student-edit-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Students" });
  return { title: `${t("editMemberTitle")} — EntrenaDojo` };
}

export const dynamic = "force-dynamic";

export default async function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("Students");

  if (!isDbConfigured()) notFound();

  const club = await getCurrentClub();
  if (!club) notFound();

  const student = await getStudentForEdit(id, club.id);
  if (!student) notFound();

  const [beltOptions, families] = await Promise.all([
    getBeltOptions(club),
    getFamilies(club.id),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href={`/students/${id}`}
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-navy"
        >
          <ArrowLeft size={15} />
          {t("backToProfile")}
        </Link>
        <p className="eyebrow">{t("editMemberEyebrow")}</p>
        <h1 className="text-2xl font-bold text-brand-navy">
          {t("editMemberTitle")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("editMemberSubtitle")}
        </p>
      </div>

      <StudentEditForm
        student={student}
        beltOptions={beltOptions}
        families={families}
      />
    </div>
  );
}
