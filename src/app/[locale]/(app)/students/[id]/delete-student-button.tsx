"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Loader2, Trash2 } from "lucide-react";

interface DeleteStudentButtonProps {
  studentId: string;
  studentName: string;
}

export function DeleteStudentButton({
  studentId,
  studentName,
}: DeleteStudentButtonProps) {
  const t = useTranslations("Students");
  const tc = useTranslations("Common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canConfirm = confirmation === studentName;

  async function handleDelete() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          throw new Error(t("cannotDeleteActive"));
        }
        throw new Error(data.error ?? t("errorDelete"));
      }
      router.push("/students");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorDelete"));
      setLoading(false);
    }
  }

  function handleClose() {
    if (loading) return;
    setOpen(false);
    setConfirmation("");
    setError("");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-card px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
      >
        <Trash2 size={16} />
        {t("deleteStudent")}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={handleClose}
        >
          <div
            className="mx-4 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-foreground">
              {t("confirmDeleteTitle")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("confirmDeleteBody")}
            </p>

            <label className="mt-4 block text-sm font-medium text-foreground">
              {t("typeNameToConfirm", { name: studentName })}
            </label>
            <input
              type="text"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500"
              autoFocus
              disabled={loading}
            />

            {error && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {tc("cancel")}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={!canConfirm || loading}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50 disabled:hover:bg-red-600"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {t("deleteStudent")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
