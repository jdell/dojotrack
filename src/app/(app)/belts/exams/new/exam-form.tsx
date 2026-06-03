"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import type {
  ExamTargetOption,
  SuggestedCandidate,
} from "@/lib/queries";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-teal";
const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

/**
 * Create-exam form. Choosing a target belt reloads the page (so the server can
 * suggest the candidates at the rank below); the most-ready are pre-selected.
 */
export function ExamForm({
  targets,
  targetRank,
  prevRankName,
  suggestions,
}: {
  targets: ExamTargetOption[];
  targetRank: ExamTargetOption;
  prevRankName: string | null;
  suggestions: SuggestedCandidate[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    date: "",
    location: "",
    fee: "",
    notes: "",
  });
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(suggestions.filter((s) => s.eligible).map((s) => s.studentId)),
  );

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggle(studentId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  }

  function changeTarget(id: string) {
    router.replace(`/belts/exams/new?targetRankId=${id}`);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetBeltRankId: targetRank.id,
          date: form.date,
          location: form.location || null,
          fee: form.fee || null,
          notes: form.notes || null,
          candidateIds: Array.from(selected),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not schedule the exam.");
      router.push(`/belts/exams/${data.exam.id}`);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not schedule the exam.",
      );
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm"
    >
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-brand-navy">
          Exam details
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Belt being tested for</label>
            <select
              value={targetRank.id}
              onChange={(e) => changeTarget(e.target.value)}
              className={`${inputClass} bg-white`}
            >
              {targets.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Date</label>
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => update("date", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Location</label>
            <input
              type="text"
              placeholder="Main dojo"
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Fee (optional)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              placeholder="0.00"
              value={form.fee}
              onChange={(e) => update("fee", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>Notes (optional)</label>
          <textarea
            rows={2}
            placeholder="Anything candidates should bring or know."
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            className={`${inputClass} resize-y`}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-brand-navy">
          Candidates
          {prevRankName ? (
            <span className="ml-1 font-normal text-muted-foreground">
              (currently {prevRankName})
            </span>
          ) : null}
        </legend>
        {suggestions.length === 0 ? (
          <p className="rounded-lg bg-muted/30 p-4 text-center text-sm text-muted-foreground">
            No students are at the rank below to test.
          </p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
            {suggestions.map((s) => (
              <li key={s.studentId}>
                <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-muted/20">
                  <input
                    type="checkbox"
                    checked={selected.has(s.studentId)}
                    onChange={() => toggle(s.studentId)}
                    className="h-4 w-4 rounded border-slate-300 text-brand-teal focus:ring-brand-teal"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-brand-navy">
                      {s.studentName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {s.metCount}/{s.totalCount} requirements met
                    </span>
                  </span>
                  {s.eligible && (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[0.65rem] font-semibold text-green-800">
                      Ready
                    </span>
                  )}
                </label>
              </li>
            ))}
          </ul>
        )}
      </fieldset>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={loading || !form.date}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-teal px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90 disabled:opacity-50"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? "Scheduling…" : "Schedule exam"}
        </button>
        <Link
          href="/belts/exams"
          className="rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-brand-navy"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
