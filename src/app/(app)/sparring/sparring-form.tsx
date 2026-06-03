"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Swords } from "lucide-react";
import type { SparringRosterStudent } from "@/lib/queries";

interface DisciplineOption {
  value: string;
  label: string;
  emoji: string;
}

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-teal";
const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

/** Today's date as YYYY-MM-DD for the date input default. */
function todayInput(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

/**
 * Set up a sparring session: choose participants and rounds, then POST to
 * /api/sparring which generates the pairings and redirects to the board.
 */
export function SparringForm({
  roster,
  disciplines,
}: {
  roster: SparringRosterStudent[];
  disciplines: DisciplineOption[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [discipline, setDiscipline] = useState(disciplines[0]?.value ?? "");
  const [date, setDate] = useState(todayInput());
  const [rounds, setRounds] = useState("1");
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(roster.map((r) => r.id)),
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function setAll(on: boolean) {
    setSelected(on ? new Set(roster.map((r) => r.id)) : new Set());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/sparring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || null,
          discipline: discipline || null,
          date,
          rounds: Number(rounds),
          studentIds: Array.from(selected),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create the session.");
      router.push(`/sparring/${data.id}`);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not create the session.",
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Session name</label>
          <input
            type="text"
            placeholder="Friday open mat (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Discipline</label>
          <select
            value={discipline}
            onChange={(e) => setDiscipline(e.target.value)}
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
          <label className={labelClass}>Date</label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Rounds</label>
          <input
            type="number"
            min={1}
            max={10}
            value={rounds}
            onChange={(e) => setRounds(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <fieldset>
        <div className="mb-2 flex items-center justify-between">
          <legend className="text-sm font-semibold text-brand-navy">
            On the mat ({selected.size}/{roster.length})
          </legend>
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              onClick={() => setAll(true)}
              className="font-medium text-brand-teal hover:underline"
            >
              Select all
            </button>
            <span className="text-muted-foreground">·</span>
            <button
              type="button"
              onClick={() => setAll(false)}
              className="font-medium text-muted-foreground hover:underline"
            >
              Clear
            </button>
          </div>
        </div>
        {roster.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            No active students to pair. Add students first.
          </p>
        ) : (
          <div className="grid max-h-72 gap-1.5 overflow-y-auto rounded-lg border border-border p-2 sm:grid-cols-2">
            {roster.map((s) => {
              const on = selected.has(s.id);
              return (
                <label
                  key={s.id}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    on
                      ? "border-brand-teal/40 bg-brand-teal/5"
                      : "border-transparent hover:bg-muted/40"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => toggle(s.id)}
                    className="h-4 w-4 rounded border-slate-300 text-brand-teal focus:ring-brand-teal"
                  />
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full border border-black/10"
                    style={{ backgroundColor: s.beltColor ?? "#e5e7eb" }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate text-brand-navy">
                    {s.name}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {s.beltName ?? "No belt"}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </fieldset>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={loading || selected.size < 2}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-teal px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90 disabled:opacity-50 disabled:hover:bg-brand-teal"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Swords size={16} />
          )}
          {loading ? "Pairing…" : "Generate pairings"}
        </button>
        <Link
          href="/sparring"
          className="rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-brand-navy"
        >
          Cancel
        </Link>
        {selected.size < 2 && (
          <span className="text-xs text-muted-foreground">
            Select at least two students.
          </span>
        )}
      </div>
    </form>
  );
}
