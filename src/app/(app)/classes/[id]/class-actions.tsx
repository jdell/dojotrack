"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";

/** Delete-class control for the class detail page header. */
export function ClassActions({ classId }: { classId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/classes/${classId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not delete the class.");
      router.push("/classes");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete.");
      setLoading(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Delete class?</span>
          <button
            type="button"
            onClick={remove}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {loading && <Loader2 size={13} className="animate-spin" />}
            Delete
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="text-xs font-medium text-muted-foreground hover:text-brand-navy"
          >
            Cancel
          </button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-red-200 hover:text-red-600"
    >
      <Trash2 size={15} />
      Delete
    </button>
  );
}
