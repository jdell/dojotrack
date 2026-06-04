import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CalendarX, Clock, Link2Off } from "lucide-react";
import { Logo } from "@/components/logo";
import { getInvitationByToken } from "@/lib/queries";
import { JoinForm } from "./join-form";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Public.join" });
  return {
    title: t("metaTitle"),
    robots: { index: false },
  };
}

export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await getInvitationByToken(token);
  const t = await getTranslations("Public.join");

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
          {invite.status === "valid" ? (
            <>
              <p className="eyebrow">{t("eyebrow")}</p>
              <h1 className="mt-1 text-xl font-bold text-brand-navy">
                {t("heading", { club: invite.clubName ?? t("fallbackClub") })}
              </h1>
              <p className="mb-6 mt-1 text-sm text-slate-500">
                {invite.unitLabel ? (
                  t.rich("enrolNamed", {
                    name: (chunks) => (
                      <span className="font-medium text-brand-navy">
                        {chunks}
                      </span>
                    ),
                    label: invite.unitLabel,
                  })
                ) : (
                  t("enrolMember")
                )}
              </p>
              <JoinForm
                token={token}
                clubName={invite.clubName ?? t("fallbackClub")}
                unitLabel={invite.unitLabel}
              />
            </>
          ) : (
            <InviteProblem status={invite.status} />
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

async function InviteProblem({
  status,
}: {
  status: "accepted" | "expired" | "not_found" | "unavailable";
}) {
  const t = await getTranslations("Public.join");
  const icons = {
    accepted: Clock,
    expired: CalendarX,
    not_found: Link2Off,
    unavailable: Link2Off,
  } as const;

  const Icon = icons[status];
  return (
    <div className="text-center">
      <Icon size={40} className="mx-auto text-slate-400" />
      <h1 className="mt-3 text-lg font-bold text-brand-navy">
        {t(`problem.${status}.title`)}
      </h1>
      <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
        {t(`problem.${status}.body`)}
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex rounded-lg bg-brand-teal px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        {t("goToDojoTrack")}
      </Link>
    </div>
  );
}
