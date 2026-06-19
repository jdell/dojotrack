"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { Loader2 } from "lucide-react";
import type { ClassLevel, DayOfWeek } from "@prisma/client";
import type { InstructorOption } from "@/lib/queries";
import { DAY_ORDER } from "@/lib/schedule";

interface DisciplineOption {
  value: string;
  label: string;
  emoji: string;
}

interface ClassEditFormProps {
  classId: string;
  initialData: {
    name: string;
    discipline: string;
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    instructorId: string;
    maxStudents: string;
    location: string;
    level: ClassLevel;
  };
  disciplines: DisciplineOption[];
  instructors: InstructorOption[];
}

const LEVEL_ORDER: ClassLevel[] = [
  "ALL_LEVELS",
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
];

const inputClass =
  "w-full rounded-lg border border-border px-3 py-2.5 text-sm bg-background text-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-teal";
const labelClass = "mb-1.5 block text-sm font-medium text-foreground";

/** Edit-class form. Submits PATCH to /api/classes/[id], then returns to detail. */
export function ClassEditForm({
  classId,
  initialData,
  disciplines,
  instructors,
}: ClassEditFormProps) {
  const t = useTranslations("Classes");
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
      const res = await fetch(`/api/classes/${classId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          discipline: form.discipline,
          dayOfWeek: form.dayOfWeek,
          startTime: form.startTime,
          endTime: form.endTime,
          instructorId: form.instructorId || null,
          maxStudents: Number(form.maxStudents),
          location: form.location || null,
          level: form.level,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("errorUpdateClass"));
      router.push(`/classes/${classId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorUpdateClass"));
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
          {t("classDetails")}
        </legend>
        <div>
          <label className={labelClass}>{t("className")}</label>
          <input
            type="text"
            required
            placeholder={t("classNamePlaceholder")}
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
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
            <label className={labelClass}>{t("level.label")}</label>
            <select
              value={form.level}
              onChange={(e) => update("level", e.target.value)}
              className={inputClass}
            >
              {LEVEL_ORDER.map((value) => (
                <option key={value} value={value}>
                  {t(`level.${value}`)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-brand-navy">
          {t("whenWhere")}
        </legend>
        <div>
          <label className={labelClass}>{t("dayOfWeek")}</label>
          <select
            value={form.dayOfWeek}
            onChange={(e) => update("dayOfWeek", e.target.value)}
            className={inputClass}
          >
            {DAY_ORDER.map((d) => (
              <option key={d} value={d}>
                {t(`day.${d}`)}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("recursWeekly")}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>{t("startTime")}</label>
            <input
              type="time"
              required
              value={form.startTime}
              onChange={(e) => update("startTime", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t("endTime")}</label>
            <input
              type="time"
              required
              value={form.endTime}
              onChange={(e) => update("endTime", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
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
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-brand-navy">
          {t("staffingCapacity")}
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>{t("instructor")}</label>
            <select
              value={form.instructorId}
              onChange={(e) => update("instructorId", e.target.value)}
              className={inputClass}
            >
              <option value="">{t("unassigned")}</option>
              {instructors.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>{t("maxStudents")}</label>
            <input
              type="number"
              min={1}
              required
              value={form.maxStudents}
              onChange={(e) => update("maxStudents", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </fieldset>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading || !form.name.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-teal px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90 disabled:opacity-50 disabled:hover:bg-brand-teal"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? t("saving") : t("updateClass")}
        </button>
        <Link
          href={`/classes/${classId}`}
          className="rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-brand-navy"
        >
          {t("cancel")}
        </Link>
      </div>
    </form>
  );
}
