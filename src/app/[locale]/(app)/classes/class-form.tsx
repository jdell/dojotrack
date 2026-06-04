"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { Loader2 } from "lucide-react";
import type { ClassLevel, DayOfWeek } from "@prisma/client";
import type { InstructorOption } from "@/lib/queries";
import { DAY_LABELS, DAY_ORDER } from "@/lib/schedule";

interface DisciplineOption {
  value: string;
  label: string;
  emoji: string;
}

interface ClassFormProps {
  disciplines: DisciplineOption[];
  instructors: InstructorOption[];
}

const LEVELS: { value: ClassLevel; label: string }[] = [
  { value: "ALL_LEVELS", label: "All levels" },
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-teal";
const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

/** Create-class form. Submits to POST /api/classes, then returns to schedule. */
export function ClassForm({ disciplines, instructors }: ClassFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    discipline: disciplines[0]?.value ?? "",
    dayOfWeek: "MON" as DayOfWeek,
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
      if (!res.ok) throw new Error(data.error ?? "Could not add the class.");
      router.push("/classes");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add the class.");
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
          Class details
        </legend>
        <div>
          <label className={labelClass}>Class name</label>
          <input
            type="text"
            required
            placeholder="Adults Fundamentals"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Discipline</label>
            <select
              value={form.discipline}
              onChange={(e) => update("discipline", e.target.value)}
              className={`${inputClass} bg-white`}
            >
              {disciplines.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.emoji} {d.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Level</label>
            <select
              value={form.level}
              onChange={(e) => update("level", e.target.value)}
              className={`${inputClass} bg-white`}
            >
              {LEVELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-brand-navy">
          When &amp; where
        </legend>
        <div>
          <label className={labelClass}>Day of week</label>
          <select
            value={form.dayOfWeek}
            onChange={(e) => update("dayOfWeek", e.target.value)}
            className={`${inputClass} bg-white`}
          >
            {DAY_ORDER.map((d) => (
              <option key={d} value={d}>
                {DAY_LABELS[d]}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-muted-foreground">
            Recurs weekly on this day.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Start time</label>
            <input
              type="time"
              required
              value={form.startTime}
              onChange={(e) => update("startTime", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>End time</label>
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
          <label className={labelClass}>Location</label>
          <input
            type="text"
            placeholder="Main mat / Studio B"
            value={form.location}
            onChange={(e) => update("location", e.target.value)}
            className={inputClass}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-brand-navy">
          Staffing &amp; capacity
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Instructor</label>
            <select
              value={form.instructorId}
              onChange={(e) => update("instructorId", e.target.value)}
              className={`${inputClass} bg-white`}
            >
              <option value="">Unassigned</option>
              {instructors.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Max students</label>
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
          {loading ? "Saving…" : "Add class"}
        </button>
        <Link
          href="/classes"
          className="rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-brand-navy"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
