"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { Loader2, Pencil, Trash2 } from "lucide-react";

/** Edit + delete controls for the sparring detail page header. */
export function SparringActions({
  sessionId,
}: {
  sessionId: string;
}) {
  const t = useTranslations("Sparring");
  const tc = useTranslations("Common");
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/sparring/${sessionId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("deleteError"));
      router.push("/sparring");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("deleteError"),
      );
      setLoading(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {t("confirmDeleteSession")}
          </span>
          <button
            type="button"
            onClick={remove}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {loading && <Loader2 size={13} className="animate-spin" />}
            {tc("delete")}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="text-xs font-medium text-muted-foreground hover:text-brand-navy"
          >
            {tc("cancel")}
          </button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/sparring/${sessionId}/edit`}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-brand-teal hover:text-brand-teal"
      >
        <Pencil size={15} />
        {t("editSession")}
      </Link>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-red-200 hover:text-red-600"
      >
        <Trash2 size={15} />
        {t("deleteSession")}
      </button>
    </div>
  );
}
