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

interface StyleOption {
  id: string;
  discipline: string;
  name: string;
}

interface ClassFormProps {
  disciplines: DisciplineOption[];
  instructors: InstructorOption[];
  styles?: StyleOption[];
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

/** Create-class form. Submits to POST /api/classes, then returns to schedule. */
export function ClassForm({
  disciplines,
  instructors,
  styles = [],
}: ClassFormProps) {
  const t = useTranslations("Classes");
  const ts = useTranslations("Styles");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const hasStyles = styles.length > 0;
  const [form, setForm] = useState({
    name: "",
    discipline: hasStyles
      ? styles[0]?.discipline ?? disciplines[0]?.value ?? ""
      : disciplines[0]?.value ?? "",
    styleId: hasStyles ? styles[0]?.id ?? "" : "",
    daysOfWeek: ["MON"] as DayOfWeek[],
    startTime: "18:00",
    endTime: "19:00",
    instructorId: "",
    maxStudents: "20",
    location: "",
    level: "ALL_LEVELS" as ClassLevel,
  });

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          discipline: form.discipline,
          styleId: form.styleId || null,
          daysOfWeek: form.daysOfWeek,
          startTime: form.startTime,
          endTime: form.endTime,
          instructorId: form.instructorId || null,
          maxStudents: Number(form.maxStudents),
          location: form.location || null,
          level: form.level,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("addClassError"));
      router.push("/classes");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("addClassError"));
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
            <label className={labelClass}>
              {hasStyles ? ts("selectStyle") : t("discipline")}
            </label>
            {hasStyles ? (
              <select
                value={form.styleId}
                onChange={(e) => {
                  const style = styles.find((s) => s.id === e.target.value);
                  setForm((f) => ({
                    ...f,
                    styleId: e.target.value,
                    discipline: style?.discipline ?? f.discipline,
                  }));
                }}
                className={`${inputClass} bg-background`}
              >
                {styles.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={form.discipline}
                onChange={(e) => update("discipline", e.target.value)}
                className={`${inputClass} bg-background`}
              >
                {disciplines.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.emoji} {d.label}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className={labelClass}>{t("level.label")}</label>
            <select
              value={form.level}
              onChange={(e) => update("level", e.target.value)}
              className={`${inputClass} bg-background`}
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
          <label className={labelClass}>{t("selectDays")}</label>
          <div className="flex flex-wrap gap-2">
            {DAY_ORDER.map((d) => {
              const checked = form.daysOfWeek.includes(d);
              return (
                <label
                  key={d}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    checked
                      ? "border-brand-teal bg-brand-teal/10 font-semibold text-brand-teal"
                      : "border-border text-muted-foreground hover:border-brand-teal/40"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      setForm((f) => ({
                        ...f,
                        daysOfWeek: checked
                          ? f.daysOfWeek.filter((x) => x !== d)
                          : [...f.daysOfWeek, d],
                      }));
                    }}
                    className="sr-only"
                  />
                  {t(`day.${d}`)}
                </label>
              );
            })}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("multipleDaysHint")}
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
              className={`${inputClass} bg-background`}
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
          disabled={loading || !form.name.trim() || form.daysOfWeek.length === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-teal px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90 disabled:opacity-50 disabled:hover:bg-brand-teal"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? t("saving") : t("addClass")}
        </button>
        <Link
          href="/classes"
          className="rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-brand-navy"
        >
          {t("cancel")}
        </Link>
      </div>
    </form>
  );
}
