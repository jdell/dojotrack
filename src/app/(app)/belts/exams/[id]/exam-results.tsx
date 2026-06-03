"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Award, CheckCircle2, Loader2 } from "lucide-react";
import type { CandidateResult } from "@prisma/client";
import type { ExamCandidateRow } from "@/lib/queries";

interface EditableRow {
  id: string;
  studentName: string;
  currentBeltName: string | null;
  currentBeltColor: string | null;
  metCount: number;
  totalCount: number;
  eligible: boolean;
  result: CandidateResult;
  techniquesScore: string;
  sparringPassed: boolean;
  notes: string;
}

const RESULTS: { value: CandidateResult; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "PASS", label: "Pass" },
  { value: "FAIL", label: "Fail" },
];

/**
 * Results entry for a grading exam. Set each candidate's outcome, score, and
 * sparring result; saving a PASS promotes the student server-side and reveals
 * their certificate.
 */
export function ExamResults({
  examId,
  completed,
  candidates,
}: {
  examId: string;
  completed: boolean;
  candidates: ExamCandidateRow[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState<EditableRow[]>(
    candidates.map((c) => ({
      id: c.id,
      studentName: c.studentName,
      currentBeltName: c.currentBeltName,
      currentBeltColor: c.currentBeltColor,
      metCount: c.metCount,
      totalCount: c.totalCount,
      eligible: c.eligible,
      result: c.result,
      techniquesScore:
        c.techniquesScore != null ? String(c.techniquesScore) : "",
      sparringPassed: c.sparringPassed ?? false,
      notes: c.notes ?? "",
    })),
  );
  // Server-confirmed results (drives certificate visibility).
  const [confirmed, setConfirmed] = useState<Map<string, CandidateResult>>(
    () => new Map(candidates.map((c) => [c.id, c.result] as const)),
  );
  const [markComplete, setMarkComplete] = useState(completed);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedNote, setSavedNote] = useState("");

  function patch(id: string, patch: Partial<EditableRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function save() {
    setSaving(true);
    setError("");
    setSavedNote("");
    try {
      const res = await fetch(`/api/exams/${examId}/results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          results: rows.map((r) => ({
            candidateId: r.id,
            result: r.result,
            techniquesScore: r.techniquesScore === "" ? null : r.techniquesScore,
            sparringPassed: r.sparringPassed,
            notes: r.notes || null,
          })),
          status: markComplete ? "COMPLETED" : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save results.");
      setConfirmed(new Map(rows.map((r) => [r.id, r.result] as const)));
      const promoted = data.promoted ?? 0;
      setSavedNote(
        promoted > 0
          ? `Results saved — ${promoted} student${promoted === 1 ? "" : "s"} promoted.`
          : "Results saved.",
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save results.");
    } finally {
      setSaving(false);
    }
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
        No candidates entered for this exam.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {rows.map((r) => (
          <li
            key={r.id}
            className="rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-brand-navy">{r.studentName}</p>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {r.currentBeltColor && (
                    <span
                      className="h-2.5 w-2.5 rounded-full border border-black/10"
                      style={{ backgroundColor: r.currentBeltColor }}
                      aria-hidden
                    />
                  )}
                  {r.currentBeltName ?? "No belt"} · {r.metCount}/{r.totalCount}{" "}
                  requirements met
                  {r.eligible && (
                    <span className="ml-1 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[0.65rem] font-semibold text-green-800">
                      Ready
                    </span>
                  )}
                </p>
              </div>
              {confirmed.get(r.id) === "PASS" && (
                <Link
                  href={`/certificate/${r.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-brand-gold/40 bg-brand-gold/10 px-3 py-1.5 text-xs font-semibold text-brand-navy transition-colors hover:bg-brand-gold/20"
                >
                  <Award size={14} className="text-brand-gold" />
                  Certificate
                </Link>
              )}
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-[8rem_7rem_1fr] sm:items-end">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Result
                </label>
                <select
                  value={r.result}
                  onChange={(e) =>
                    patch(r.id, { result: e.target.value as CandidateResult })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-teal"
                >
                  {RESULTS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Score
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="—"
                  value={r.techniquesScore}
                  onChange={(e) =>
                    patch(r.id, { techniquesScore: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>
              <label className="flex items-center gap-2 pb-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={r.sparringPassed}
                  onChange={(e) =>
                    patch(r.id, { sparringPassed: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-slate-300 text-brand-teal focus:ring-brand-teal"
                />
                Sparring passed
              </label>
            </div>

            <input
              type="text"
              placeholder="Notes (optional)"
              value={r.notes}
              onChange={(e) => patch(r.id, { notes: e.target.value })}
              className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-teal"
            />
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-teal px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <CheckCircle2 size={16} />
          )}
          {saving ? "Saving…" : "Save results"}
        </button>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={markComplete}
            onChange={(e) => setMarkComplete(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-brand-teal focus:ring-brand-teal"
          />
          Mark exam complete
        </label>
        {savedNote && (
          <span className="text-sm font-medium text-green-700">{savedNote}</span>
        )}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </div>
  );
}
