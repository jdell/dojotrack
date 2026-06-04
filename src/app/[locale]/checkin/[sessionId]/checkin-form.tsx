"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, Loader2 } from "lucide-react";

interface CheckinFormProps {
  sessionId: string;
  students: { id: string; fullName: string; alreadyCheckedIn: boolean }[];
}

/**
 * Self-check-in: an authenticated student taps their name to record QR-scan
 * attendance for the session. Auth → student mapping arrives later, so for now
 * the student selects themselves from the club roster.
 */
export function CheckinForm({ sessionId, students }: CheckinFormProps) {
  const t = useTranslations("Public.checkin");
  const [loading, setLoading] = useState<string | null>(null);
  const [done, setDone] = useState<{ name: string } | null>(null);
  const [checkedIn, setCheckedIn] = useState<Set<string>>(
    () => new Set(students.filter((s) => s.alreadyCheckedIn).map((s) => s.id)),
  );
  const [error, setError] = useState("");

  async function checkIn(student: { id: string; fullName: string }) {
    setLoading(student.id);
    setError("");
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classSessionId: sessionId,
          studentId: student.id,
          method: "QR_SCAN",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("errorCheckYouIn"));
      setCheckedIn((prev) => new Set(prev).add(student.id));
      setDone({ name: student.fullName });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorCheckIn"));
    } finally {
      setLoading(null);
    }
  }

  if (done) {
    return (
      <div className="text-center">
        <CheckCircle2 size={44} className="mx-auto text-brand-teal" />
        <h2 className="mt-3 text-lg font-bold text-brand-navy">
          {t("successTitle")}
        </h2>
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
          {t("successBody", { name: done.name.split(" ")[0] })}
        </p>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <p className="rounded-lg bg-slate-50 p-4 text-center text-sm text-slate-500">
        {t("noMembers")}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <ul className="max-h-80 space-y-1.5 overflow-y-auto">
        {students.map((s) => {
          const already = checkedIn.has(s.id);
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => checkIn(s)}
                disabled={already || loading === s.id}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-200 px-4 py-3 text-left text-sm font-medium text-brand-navy transition-colors hover:border-brand-teal hover:bg-brand-teal/5 disabled:cursor-default disabled:hover:border-slate-200 disabled:hover:bg-transparent"
              >
                <span className="truncate">{s.fullName}</span>
                {already ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-teal">
                    <CheckCircle2 size={15} /> {t("in")}
                  </span>
                ) : loading === s.id ? (
                  <Loader2 size={16} className="animate-spin text-brand-teal" />
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {t("tapToCheckIn")}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
