"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { Check, Clock, Minus } from "lucide-react";
import type { TechniqueStatus } from "@prisma/client";
import type {
  ProgressState,
  RankCandidateRow,
  RequirementDTO,
  RequirementProgress,
} from "@/lib/queries";
import { requirementTypeMeta } from "@/lib/constants";

/** Cycle order when an instructor taps a manual assessment cell. */
const NEXT_STATUS: Record<TechniqueStatus, TechniqueStatus> = {
  NOT_ASSESSED: "IN_PROGRESS",
  IN_PROGRESS: "PASSED",
  PASSED: "NOT_ASSESSED",
};

// The visible status is derived from `logStatus` at render time (translated via
// the `techStatus` map), so `detail` here is only a non-rendered placeholder.
function fromStatus(status: TechniqueStatus): {
  state: ProgressState;
  detail: string;
} {
  if (status === "PASSED") return { state: "met", detail: "" };
  if (status === "IN_PROGRESS") return { state: "in_progress", detail: "" };
  return { state: "not_met", detail: "" };
}

/**
 * The eligible-candidate grid for a belt rank: one row per student at the rank
 * below, one column per requirement. Manual requirement cells are tappable so
 * an instructor can assess many students at once (e.g. straight after a class).
 */
export function RankCandidateMatrix({
  requirements,
  candidates: initial,
}: {
  requirements: RequirementDTO[];
  candidates: RankCandidateRow[];
}) {
  const t = useTranslations("Belts");
  const router = useRouter();
  const [candidates, setCandidates] = useState<RankCandidateRow[]>(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function cycle(
    studentId: string,
    requirement: RequirementProgress,
  ) {
    const current = requirement.logStatus ?? "NOT_ASSESSED";
    const next = NEXT_STATUS[current];
    const cellKey = `${studentId}:${requirement.requirement.id}`;
    setBusy(cellKey);
    setError("");
    try {
      const res = await fetch("/api/techniques", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          requirementId: requirement.requirement.id,
          status: next,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("errSave"));
      const { state, detail } = fromStatus(next);
      setCandidates((prev) =>
        prev.map((c) => {
          if (c.studentId !== studentId) return c;
          const reqs = c.requirements.map((rp) =>
            rp.requirement.id === requirement.requirement.id
              ? { ...rp, logStatus: next, state, detail }
              : rp,
          );
          return {
            ...c,
            requirements: reqs,
            metCount: reqs.filter((r) => r.state === "met").length,
          };
        }),
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errSave"));
    } finally {
      setBusy(null);
    }
  }

  if (candidates.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
        {t("noStudentsBelow")}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
              <th className="sticky left-0 z-10 bg-muted/30 px-4 py-3 font-semibold">
                {t("student")}
              </th>
              {requirements.map((req) => (
                <th
                  key={req.id}
                  className="px-3 py-3 text-center font-semibold"
                  title={req.name}
                >
                  <span className="mr-1" aria-hidden>
                    {requirementTypeMeta(req.type).emoji}
                  </span>
                  <span className="inline-block max-w-[7rem] truncate align-middle normal-case">
                    {req.name}
                  </span>
                </th>
              ))}
              <th className="px-4 py-3 text-center font-semibold">
                {t("progress")}
              </th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((c) => (
              <tr
                key={c.studentId}
                className="border-b border-border last:border-0 hover:bg-muted/10"
              >
                <td className="sticky left-0 z-10 bg-card px-4 py-3">
                  <Link
                    href={`/students/${c.studentId}/belt`}
                    className="font-medium text-brand-navy hover:text-brand-teal"
                  >
                    {c.studentName}
                  </Link>
                  {c.eligible && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[0.65rem] font-semibold text-green-800">
                      {t("ready")}
                    </span>
                  )}
                </td>
                {c.requirements.map((rp) => {
                  const auto = requirementTypeMeta(rp.requirement.type).auto;
                  const cellKey = `${c.studentId}:${rp.requirement.id}`;
                  return (
                    <td key={rp.requirement.id} className="px-3 py-2 text-center">
                      {auto ? (
                        <AutoCell progress={rp} />
                      ) : (
                        <button
                          type="button"
                          onClick={() => cycle(c.studentId, rp)}
                          disabled={busy === cellKey}
                          title={t("cellTooltip", {
                            name: rp.requirement.name,
                            status: t(
                              `techStatus.${rp.logStatus ?? "NOT_ASSESSED"}`,
                            ),
                          })}
                          className="mx-auto block"
                        >
                          <StatusDot state={rp.state} pending={busy === cellKey} />
                        </button>
                      )}
                    </td>
                  );
                })}
                <td className="px-4 py-3 text-center">
                  <ProgressPill met={c.metCount} total={c.totalCount} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">{t("matrixHint")}</p>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function AutoCell({ progress }: { progress: RequirementProgress }) {
  const t = useTranslations("Belts");
  const met = progress.state === "met";
  return (
    <span
      title={t("autoDetail", {
        current: progress.current ?? 0,
        target: progress.requirement.targetValue ?? 0,
        unit: t(`reqUnit.${progress.requirement.type}`),
      })}
      className={`inline-flex min-w-[2.5rem] items-center justify-center rounded-md px-2 py-1 text-xs font-semibold ${
        met
          ? "bg-green-100 text-green-800"
          : "bg-slate-100 text-slate-500"
      }`}
    >
      {progress.current ?? 0}
    </span>
  );
}

function StatusDot({
  state,
  pending,
}: {
  state: ProgressState;
  pending: boolean;
}) {
  const base =
    "inline-flex h-7 w-7 items-center justify-center rounded-full border transition-colors";
  if (pending) {
    return (
      <span className={`${base} animate-pulse border-border bg-muted`}>·</span>
    );
  }
  if (state === "met") {
    return (
      <span className={`${base} border-green-200 bg-green-100 text-green-700`}>
        <Check size={15} />
      </span>
    );
  }
  if (state === "in_progress") {
    return (
      <span className={`${base} border-amber-200 bg-amber-100 text-amber-700`}>
        <Clock size={14} />
      </span>
    );
  }
  return (
    <span className={`${base} border-border bg-slate-50 text-slate-400`}>
      <Minus size={14} />
    </span>
  );
}

function ProgressPill({ met, total }: { met: number; total: number }) {
  const pct = total > 0 ? Math.round((met / total) * 100) : 0;
  return (
    <div className="mx-auto w-24">
      <div className="flex items-center justify-between text-[0.7rem] text-muted-foreground">
        <span>
          {met}/{total}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-brand-teal"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
