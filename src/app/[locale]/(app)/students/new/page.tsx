import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import { getBeltOptions, getCurrentClub, getFamilies } from "@/lib/queries";
import { StudentForm } from "../student-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Students" });
  return { title: `${t("addStudent")} — EntrenaDojo` };
}

export const dynamic = "force-dynamic";

export default async function NewStudentPage() {
  const t = await getTranslations("Students");
  const club = await getCurrentClub();
  const [beltOptions, families] = await Promise.all([
    getBeltOptions(club),
    club ? getFamilies(club.id) : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/students"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-navy"
        >
          <ArrowLeft size={15} />
          {t("backToRoster")}
        </Link>
        <p className="eyebrow">{t("newMemberEyebrow")}</p>
        <h1 className="text-2xl font-bold text-brand-navy">
          {t("newMemberTitle")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("newMemberSubtitle")}
        </p>
      </div>

      <StudentForm beltOptions={beltOptions} families={families} />
    </div>
  );
}
