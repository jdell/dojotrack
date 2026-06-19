"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { Loader2 } from "lucide-react";

interface DisciplineOption {
  value: string;
  label: string;
  emoji: string;
}

interface SparringEditFormProps {
  sessionId: string;
  initialData: {
    name: string;
    discipline: string;
    date: string;
    rounds: string;
    notes: string;
  };
  disciplines: DisciplineOption[];
}

const inputClass =
  "w-full rounded-lg border border-border px-3 py-2.5 text-sm bg-background text-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-teal";
const labelClass = "mb-1.5 block text-sm font-medium text-foreground";

/** Edit-sparring form. PATCHes /api/sparring/[id], then returns to detail. */
export function SparringEditForm({
  sessionId,
  initialData,
  disciplines,
}: SparringEditFormProps) {
  const t = useTranslations("Sparring");
  const tc = useTranslations("Common");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ ...initialData });

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/sparring/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name || null,
          discipline: form.discipline || null,
          date: form.date,
          rounds: Number(form.rounds),
          notes: form.notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error ?? t("errorUpdateSession"));
      router.push(`/sparring/${sessionId}`);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("errorUpdateSession"),
      );
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-sm"
    >
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>{t("sessionName")}</label>
          <input
            type="text"
            placeholder={t("sessionNamePlaceholder")}
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>{t("discipline")}</label>
          <select
            value={form.discipline}
            onChange={(e) => update("discipline", e.target.value)}
            className={inputClass}
          >
            {disciplines.map((d) => (
              <option key={d.value} value={d.value}>
                {d.emoji} {d.label}
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
        <div>
          <label className={labelClass}>{t("rounds")}</label>
          <input
            type="number"
            min={1}
            max={10}
            value={form.rounds}
            onChange={(e) => update("rounds", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>{t("notes")}</label>
        <textarea
          rows={2}
          placeholder={t("notesPlaceholder")}
          value={form.notes}
          onChange={(e) => update("notes", e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={loading || !form.date}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-teal px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90 disabled:opacity-50 disabled:hover:bg-brand-teal"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? tc("saving") : t("updateSession")}
        </button>
        <Link
          href={`/sparring/${sessionId}`}
          className="rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-brand-navy"
        >
          {tc("cancel")}
        </Link>
      </div>
    </form>
  );
}
