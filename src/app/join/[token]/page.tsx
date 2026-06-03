import type { Metadata } from "next";
import Link from "next/link";
import { CalendarX, Clock, Link2Off } from "lucide-react";
import { Logo } from "@/components/logo";
import { getInvitationByToken } from "@/lib/queries";
import { JoinForm } from "./join-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Join a club — DojoTrack",
  robots: { index: false },
};

export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await getInvitationByToken(token);

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
              <p className="eyebrow">You&apos;re invited</p>
              <h1 className="mt-1 text-xl font-bold text-brand-navy">
                Join {invite.clubName}
              </h1>
              <p className="mb-6 mt-1 text-sm text-slate-500">
                Fill in your details to enrol{" "}
                {invite.unitLabel ? (
                  <span className="font-medium text-brand-navy">
                    {invite.unitLabel}
                  </span>
                ) : (
                  "as a member"
                )}
                .
              </p>
              <JoinForm
                token={token}
                clubName={invite.clubName ?? "the club"}
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
          <p className="text-xs text-slate-400">Powered by DojoTrack</p>
        </div>
      </footer>
    </div>
  );
}

function InviteProblem({
  status,
}: {
  status: "accepted" | "expired" | "not_found" | "unavailable";
}) {
  const content = {
    accepted: {
      icon: Clock,
      title: "This invite has been used",
      body: "Looks like this link was already claimed. Ask your club for a fresh invite if you still need to sign up.",
    },
    expired: {
      icon: CalendarX,
      title: "This invite has expired",
      body: "Invite links are valid for a limited time. Ask your club to send you a new one.",
    },
    not_found: {
      icon: Link2Off,
      title: "Invite not found",
      body: "We couldn't find this invite. Double-check the link, or ask your club to resend it.",
    },
    unavailable: {
      icon: Link2Off,
      title: "Invites aren't available yet",
      body: "This DojoTrack instance isn't connected to a database yet, so invites can't be validated.",
    },
  }[status];

  const Icon = content.icon;
  return (
    <div className="text-center">
      <Icon size={40} className="mx-auto text-slate-400" />
      <h1 className="mt-3 text-lg font-bold text-brand-navy">
        {content.title}
      </h1>
      <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
        {content.body}
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex rounded-lg bg-brand-teal px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        Go to DojoTrack
      </Link>
    </div>
  );
}
