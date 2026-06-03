import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, Users } from "lucide-react";
import { getSparringSessionDetail } from "@/lib/queries";
import { isDbConfigured } from "@/lib/db";
import { disciplineMeta } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { SparringBoard } from "./sparring-board";

export const metadata: Metadata = { title: "Sparring session — DojoTrack" };

export const dynamic = "force-dynamic";

export default async function SparringDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isDbConfigured()) notFound();

  const session = await getSparringSessionDetail(id);
  if (!session) notFound();

  const discipline = session.discipline
    ? disciplineMeta(session.discipline)
    : null;
  const participants = new Set<string>();
  for (const p of session.pairs) {
    participants.add(p.studentAId);
    if (p.studentBId) participants.add(p.studentBId);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/sparring"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-navy"
        >
          <ArrowLeft size={15} />
          Back to sparring
        </Link>
        <p className="eyebrow">Sparring session</p>
        <h1 className="text-2xl font-bold text-brand-navy">
          {session.name ?? "Sparring session"}
        </h1>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarClock size={14} />
            {formatDate(session.date)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users size={14} />
            {participants.size}{" "}
            {participants.size === 1 ? "participant" : "participants"}
          </span>
          {discipline && (
            <span>
              {discipline.emoji} {discipline.label}
            </span>
          )}
        </p>
      </div>

      <SparringBoard session={session} />
    </div>
  );
}
