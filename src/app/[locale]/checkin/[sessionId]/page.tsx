import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CalendarX, Link2Off } from "lucide-react";
import { Logo } from "@/components/logo";
import { getSessionForCheckin } from "@/lib/queries";
import { disciplineMeta } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { CheckinForm } from "./checkin-form";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Public.checkin" });
  return {
    title: t("metaTitle"),
    robots: { index: false },
  };
}

export default async function CheckinPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const session = await getSessionForCheckin(sessionId);
  const t = await getTranslations("Public.checkin");

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-md items-center px-4 py-4">
          <Link href="/" className="flex items-center">
            <Logo size={26} />
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-900/[0.04]">
          {!session ? (
            <Problem
              icon={Link2Off}
              title={t("notAvailableTitle")}
              body={t("notAvailableBody")}
            />
          ) : session.cancelled ? (
            <Problem
              icon={CalendarX}
              title={t("cancelledTitle")}
              body={t("cancelledBody", {
                class: session.className,
                date: formatDate(session.date),
              })}
            />
          ) : (
            <>
              <p className="eyebrow">{session.clubName}</p>
              <h1 className="mt-1 text-xl font-bold text-brand-navy">
                {session.className}
              </h1>
              <p className="mb-6 mt-1 text-sm text-slate-500">
                {disciplineMeta(session.discipline).emoji}{" "}
                {t("prompt", { date: formatDate(session.date) })}
              </p>
              <CheckinForm
                sessionId={session.id}
                students={session.students}
              />
            </>
          )}
        </div>
      </main>

      <footer className="border-t border-slate-200 py-6">
        <div className="mx-auto flex max-w-md items-center justify-between px-4">
          <Logo size={22} />
          <p className="text-xs text-slate-400">{t("poweredBy")}</p>
        </div>
      </footer>
    </div>
  );
}

async function Problem({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Link2Off;
  title: string;
  body: string;
}) {
  const t = await getTranslations("Public.checkin");
  return (
    <div className="text-center">
      <Icon size={40} className="mx-auto text-slate-400" />
      <h1 className="mt-3 text-lg font-bold text-brand-navy">{title}</h1>
      <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{body}</p>
      <Link
        href="/"
        className="mt-6 inline-flex rounded-lg bg-brand-teal px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        {t("goToEntrenaDojo")}
      </Link>
    </div>
  );
}
