"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Ban,
  CalendarDays,
  Check,
  CheckCircle2,
  Loader2,
  RotateCcw,
  UserPlus,
} from "lucide-react";
import type { SessionBookingRow, SessionDetail } from "@/lib/queries";
import { formatDate } from "@/lib/utils";

interface SessionManagerProps {
  session: SessionDetail;
  students: { id: string; fullName: string }[];
  maxStudents: number;
  timeLabel: string;
}

/**
 * One upcoming session: its enrolled students with manual check-in, a picker to
 * check in a drop-in, and instructor controls to cancel/reinstate the session.
 */
export function SessionManager({
  session,
  students,
  maxStudents,
  timeLabel,
}: SessionManagerProps) {
  const router = useRouter();
  const [rows, setRows] = useState<SessionBookingRow[]>(session.bookings);
  const [cancelled, setCancelled] = useState(session.cancelled);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [pickerId, setPickerId] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const checkedInCount = rows.filter((r) => r.checkedIn).length;
  const enrolledCount = rows.filter((r) => r.status === "BOOKED").length;

  const available = useMemo(() => {
    const present = new Set(rows.map((r) => r.studentId));
    return students.filter((s) => !present.has(s.id));
  }, [rows, students]);

  async function checkIn(studentId: string) {
    setBusy(studentId);
    setError("");
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classSessionId: session.id,
          studentId,
          method: "MANUAL",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not check in.");
      setRows((prev) =>
        prev.map((r) =>
          r.studentId === studentId
            ? { ...r, checkedIn: true, method: "MANUAL" }
            : r,
        ),
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not check in.");
    } finally {
      setBusy(null);
    }
  }

  async function addDropIn() {
    if (!pickerId) return;
    const student = students.find((s) => s.id === pickerId);
    if (!student) return;
    setBusy(pickerId);
    setError("");
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classSessionId: session.id,
          studentId: pickerId,
          method: "MANUAL",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not check in.");
      setRows((prev) => [
        ...prev,
        {
          bookingId: null,
          studentId: student.id,
          studentName: student.fullName,
          status: null,
          checkedIn: true,
          checkedInAt: null,
          method: "MANUAL",
        },
      ]);
      setPickerId("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not check in.");
    } finally {
      setBusy(null);
    }
  }

  async function setSessionCancelled(next: boolean) {
    setBusy("session");
    setError("");
    try {
      const res = await fetch(`/api/sessions/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cancelled: next,
          cancelReason: next ? cancelReason : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not update session.");
      setCancelled(next);
      setShowCancel(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 font-semibold text-brand-navy">
            <CalendarDays size={15} className="text-brand-teal" />
            {formatDate(session.date)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{timeLabel}</p>
        </div>
        {cancelled ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
            <Ban size={12} /> Cancelled
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">
            {checkedInCount} in · {enrolledCount}/{maxStudents} booked
          </span>
        )}
      </div>

      {cancelled ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-red-50 p-3">
          <p className="text-sm text-red-700">
            {session.cancelReason
              ? `Cancelled — ${session.cancelReason}`
              : "This session has been cancelled."}
          </p>
          <button
            type="button"
            onClick={() => setSessionCancelled(false)}
            disabled={busy === "session"}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-brand-navy transition-colors hover:bg-muted/50 disabled:opacity-50"
          >
            {busy === "session" ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <RotateCcw size={13} />
            )}
            Reinstate
          </button>
        </div>
      ) : (
        <>
          {rows.length === 0 ? (
            <p className="mt-4 rounded-lg bg-muted/30 p-4 text-center text-sm text-muted-foreground">
              No one booked yet.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {rows.map((r) => (
                <li
                  key={r.studentId}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-brand-navy">
                      {r.studentName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.status === "WAITLISTED"
                        ? "Waitlisted"
                        : r.status === "BOOKED"
                          ? "Booked"
                          : "Drop-in"}
                    </p>
                  </div>
                  {r.checkedIn ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-teal">
                      <CheckCircle2 size={15} /> Checked in
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => checkIn(r.studentId)}
                      disabled={busy === r.studentId}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-brand-teal px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-teal/90 disabled:opacity-50"
                    >
                      {busy === r.studentId ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Check size={13} />
                      )}
                      Check in
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {/* Drop-in check-in */}
          {available.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
              <select
                value={pickerId}
                onChange={(e) => setPickerId(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-teal"
              >
                <option value="">Add a drop-in…</option>
                {available.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={addDropIn}
                disabled={!pickerId || busy === pickerId}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-brand-navy transition-colors hover:bg-muted/50 disabled:opacity-50"
              >
                <UserPlus size={14} />
                Check in
              </button>
            </div>
          )}

          {/* Cancel session */}
          <div className="mt-4 border-t border-border pt-4">
            {showCancel ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Reason (optional) — e.g. instructor away"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-teal"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSessionCancelled(true)}
                    disabled={busy === "session"}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                  >
                    {busy === "session" ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Ban size={13} />
                    )}
                    Confirm cancellation
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCancel(false)}
                    className="text-xs font-medium text-muted-foreground hover:text-brand-navy"
                  >
                    Keep session
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Booked students will be notified.
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowCancel(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-red-600"
              >
                <Ban size={13} />
                Cancel this session
              </button>
            )}
          </div>
        </>
      )}

      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
    </div>
  );
}
