"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Check, Clock, Loader2, Minus } from "lucide-react";
import type { TechniqueStatus } from "@prisma/client";
import type { ProgressState, RequirementProgress } from "@/lib/queries";
import { requirementTypeMeta } from "@/lib/constants";

const STATUS_OPTIONS: TechniqueStatus[] = [
  "NOT_ASSESSED",
  "IN_PROGRESS",
  "PASSED",
];

function fromStatus(status: TechniqueStatus): {
  state: ProgressState;
  detail: string;
} {
  if (status === "PASSED") return { state: "met", detail: "PASSED" };
  if (status === "IN_PROGRESS")
    return { state: "in_progress", detail: "IN_PROGRESS" };
  return { state: "not_met", detail: "NOT_ASSESSED" };
}

/**
 * The next-belt requirement checklist with a live progress bar. Manual
 * requirements carry an instructor segmented control to set the assessment;
 * time and class requirements are read-only and computed.
 */
export function BeltProgressChecklist({
  studentId,
  nextBeltName,
  requirements: initial,
  totalCount,
}: {
  studentId: string;
  nextBeltName: string;
  requirements: RequirementProgress[];
  totalCount: number;
}) {
  const t = useTranslations("Students");
  const tBelts = useTranslations("Belts");
  const router = useRouter();
  const [requirements, setRequirements] =
    useState<RequirementProgress[]>(initial);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");

  const metCount = requirements.filter((r) => r.state === "met").length;
  const pct = totalCount > 0 ? Math.round((metCount / totalCount) * 100) : 0;

  async function assess(requirementId: string, status: TechniqueStatus) {
    setPending(requirementId);
    setError("");
    try {
      const res = await fetch("/api/techniques", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, requirementId, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("errorSave"));
      const { state, detail } = fromStatus(status);
      setRequirements((prev) =>
        prev.map((r) =>
          r.requirement.id === requirementId
            ? { ...r, logStatus: status, state, detail: t(`status.${detail}`) }
            : r,
        ),
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorSave"));
    } finally {
      setPending(null);
    }
  }

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-brand-navy">
            {t("progressTo", { belt: nextBeltName })}
          </span>
          <span className="text-muted-foreground">
            {t("metCount", { met: metCount, total: totalCount })}
          </span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-brand-teal transition-[width] duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {t("percentComplete", { pct })}
        </p>
      </div>

      {totalCount === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          {t("noRequirements", { belt: nextBeltName })}
        </p>
      ) : (
        <ul className="space-y-2">
          {requirements.map((rp) => {
            const meta = requirementTypeMeta(rp.requirement.type);
            return (
              <li
                key={rp.requirement.id}
                className="rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <StateIcon state={rp.state} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-brand-navy">
                      {rp.requirement.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <span aria-hidden>{meta.emoji}</span> {tBelts(`reqType.${rp.requirement.type}`)} ·{" "}
                      {rp.detail}
                      {rp.requirement.description
                        ? ` · ${rp.requirement.description}`
                        : ""}
                    </p>
                  </div>
                </div>

                {!meta.auto && (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5 pl-9">
                    {STATUS_OPTIONS.map((opt) => {
                      const active = (rp.logStatus ?? "NOT_ASSESSED") === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          disabled={pending === rp.requirement.id}
                          onClick={() => assess(rp.requirement.id, opt)}
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-50 ${
                            active
                              ? opt === "PASSED"
                                ? "bg-green-600 text-white"
                                : opt === "IN_PROGRESS"
                                  ? "bg-amber-500 text-white"
                                  : "bg-slate-500 text-white"
                              : "border border-border bg-card text-muted-foreground hover:bg-muted/50"
                          }`}
                        >
                          {pending === rp.requirement.id && active && (
                            <Loader2 size={12} className="animate-spin" />
                          )}
                          {t(`status.${opt}`)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </section>
  );
}

function StateIcon({ state }: { state: ProgressState }) {
  const base =
    "mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border";
  if (state === "met") {
    return (
      <span className={`${base} border-green-200 bg-green-100 text-green-700`}>
        <Check size={14} />
      </span>
    );
  }
  if (state === "in_progress") {
    return (
      <span className={`${base} border-amber-200 bg-amber-100 text-amber-700`}>
        <Clock size={13} />
      </span>
    );
  }
  return (
    <span className={`${base} border-border bg-slate-50 text-slate-400`}>
      <Minus size={13} />
    </span>
  );
}
