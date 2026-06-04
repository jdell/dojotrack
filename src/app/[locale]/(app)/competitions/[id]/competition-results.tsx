"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import type { CompetitionStatus, Medal } from "@prisma/client";
import type { CompetitionEntryRow, StudentOption } from "@/lib/queries";

interface EditableEntry {
  id: string;
  studentName: string;
  beltName: string | null;
  beltColor: string | null;
  placement: string;
  medal: Medal;
  wins: string;
  losses: string;
  division: string;
  weightClass: string;
  notes: string;
}

const MEDALS: { value: Medal; label: string }[] = [
  { value: "NONE", label: "— No medal" },
  { value: "GOLD", label: "🥇 Gold" },
  { value: "SILVER", label: "🥈 Silver" },
  { value: "BRONZE", label: "🥉 Bronze" },
];

const STATUSES: { value: CompetitionStatus; label: string }[] = [
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const fieldClass =
  "w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-teal";

function toEditable(e: CompetitionEntryRow): EditableEntry {
  return {
    id: e.id,
    studentName: e.studentName,
    beltName: e.beltName,
    beltColor: e.beltColor,
    placement: e.placement != null ? String(e.placement) : "",
    medal: e.medal,
    wins: String(e.wins),
    losses: String(e.losses),
    division: e.division ?? "",
    weightClass: e.weightClass ?? "",
    notes: e.notes ?? "",
  };
}

/** Entries + results manager for a competition: enter students, record medals. */
export function CompetitionResults({
  competitionId,
  status,
  entries,
  availableStudents,
}: {
  competitionId: string;
  status: CompetitionStatus;
  entries: CompetitionEntryRow[];
  availableStudents: StudentOption[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState<EditableEntry[]>(entries.map(toEditable));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [savedNote, setSavedNote] = useState("");

  // Add-entry form state.
  const [newStudent, setNewStudent] = useState("");
  const [newDivision, setNewDivision] = useState("");
  const [newWeight, setNewWeight] = useState("");

  function patch(id: string, patch: Partial<EditableEntry>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function changeStatus(next: CompetitionStatus) {
    setError("");
    try {
      const res = await fetch(`/api/competitions/${competitionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Could not update status.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update status.");
    }
  }

  async function addEntry() {
    if (!newStudent) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/competitions/${competitionId}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: newStudent,
          division: newDivision || null,
          weightClass: newWeight || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Could not add the entry.");
      }
      setNewStudent("");
      setNewDivision("");
      setNewWeight("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add the entry.");
    } finally {
      setBusy(false);
    }
  }

  async function removeEntry(entryId: string) {
    setError("");
    try {
      const res = await fetch(
        `/api/competitions/${competitionId}/entries?entryId=${entryId}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Could not remove the entry.");
      }
      setRows((prev) => prev.filter((r) => r.id !== entryId));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove the entry.");
    }
  }

  async function saveResults() {
    setBusy(true);
    setError("");
    setSavedNote("");
    try {
      const res = await fetch(`/api/competitions/${competitionId}/entries`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: rows.map((r) => ({
            id: r.id,
            placement: r.placement === "" ? null : Number(r.placement),
            medal: r.medal,
            wins: Number(r.wins) || 0,
            losses: Number(r.losses) || 0,
            division: r.division || null,
            weightClass: r.weightClass || null,
            notes: r.notes || null,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save results.");
      setSavedNote("Results saved.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save results.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <label className="text-sm font-medium text-slate-700">Status</label>
        <select
          value={status}
          onChange={(e) => changeStatus(e.target.value as CompetitionStatus)}
          className={`${fieldClass} w-auto bg-white`}
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-brand-navy">Enter a student</p>
        {availableStudents.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Every active student is already entered.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Student
              </label>
              <select
                value={newStudent}
                onChange={(e) => setNewStudent(e.target.value)}
                className={`${fieldClass} bg-white`}
              >
                <option value="">Select…</option>
                {availableStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Division
              </label>
              <input
                type="text"
                placeholder="Adult / Masters"
                value={newDivision}
                onChange={(e) => setNewDivision(e.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Weight class
              </label>
              <input
                type="text"
                placeholder="-70kg"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                className={fieldClass}
              />
            </div>
            <button
              type="button"
              onClick={addEntry}
              disabled={busy || !newStudent}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-teal px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90 disabled:opacity-50"
            >
              <Plus size={15} />
              Add
            </button>
          </div>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No students entered yet. Add an entry above to start recording results.
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li
              key={r.id}
              className="rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-brand-navy">{r.studentName}</p>
                  {r.beltName && (
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span
                        className="h-2.5 w-2.5 rounded-full border border-black/10"
                        style={{ backgroundColor: r.beltColor ?? "#e5e7eb" }}
                        aria-hidden
                      />
                      {r.beltName}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeEntry(r.id)}
                  aria-label={`Remove ${r.studentName}`}
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-[7rem_1fr_5rem_5rem]">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Placement
                  </label>
                  <input
                    type="number"
                    min={1}
                    placeholder="—"
                    value={r.placement}
                    onChange={(e) => patch(r.id, { placement: e.target.value })}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Medal
                  </label>
                  <select
                    value={r.medal}
                    onChange={(e) =>
                      patch(r.id, { medal: e.target.value as Medal })
                    }
                    className={`${fieldClass} bg-white`}
                  >
                    {MEDALS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Wins
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={r.wins}
                    onChange={(e) => patch(r.id, { wins: e.target.value })}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Losses
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={r.losses}
                    onChange={(e) => patch(r.id, { losses: e.target.value })}
                    className={fieldClass}
                  />
                </div>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder="Division"
                  value={r.division}
                  onChange={(e) => patch(r.id, { division: e.target.value })}
                  className={fieldClass}
                />
                <input
                  type="text"
                  placeholder="Weight class"
                  value={r.weightClass}
                  onChange={(e) => patch(r.id, { weightClass: e.target.value })}
                  className={fieldClass}
                />
              </div>

              <input
                type="text"
                placeholder="Notes (optional)"
                value={r.notes}
                onChange={(e) => patch(r.id, { notes: e.target.value })}
                className={`${fieldClass} mt-3`}
              />
            </li>
          ))}
        </ul>
      )}

      {rows.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
          <button
            type="button"
            onClick={saveResults}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-teal px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90 disabled:opacity-50"
          >
            {busy ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {busy ? "Saving…" : "Save results"}
          </button>
          {savedNote && (
            <span className="text-sm font-medium text-green-700">{savedNote}</span>
          )}
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      )}
      {rows.length === 0 && error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
