"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
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
  const t = useTranslations("Belts");
  const tc = useTranslations("Common");
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
      if (!res.ok) throw new Error(data.error ?? t("errSchedule"));
      router.push(`/belts/exams/${data.exam.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errSchedule"));
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
          {t("examDetails")}
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>{t("beltTestedFor")}</label>
            <select
              value={targetRank.id}
              onChange={(e) => changeTarget(e.target.value)}
              className={`${inputClass} bg-white`}
            >
              {targets.map((target) => (
                <option key={target.id} value={target.id}>
                  {target.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>{t("date")}</label>
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
            <label className={labelClass}>{t("location")}</label>
            <input
              type="text"
              placeholder={t("locationPlaceholder")}
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t("feeLabel")}</label>
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
          <label className={labelClass}>{t("notesLabel")}</label>
          <textarea
            rows={2}
            placeholder={t("notesExamPlaceholder")}
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            className={`${inputClass} resize-y`}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-brand-navy">
          {t("candidates")}
          {prevRankName ? (
            <span className="ml-1 font-normal text-muted-foreground">
              {t("currentlyRank", { rank: prevRankName })}
            </span>
          ) : null}
        </legend>
        {suggestions.length === 0 ? (
          <p className="rounded-lg bg-muted/30 p-4 text-center text-sm text-muted-foreground">
            {t("noStudentsBelowToTest")}
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
                      {t("requirementsMet", {
                        met: s.metCount,
                        total: s.totalCount,
                      })}
                    </span>
                  </span>
                  {s.eligible && (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[0.65rem] font-semibold text-green-800">
                      {t("ready")}
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
          {loading ? t("scheduling") : t("newExam")}
        </button>
        <Link
          href="/belts/exams"
          className="rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-brand-navy"
        >
          {tc("cancel")}
        </Link>
      </div>
    </form>
  );
}
