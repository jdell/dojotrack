"use client";

import { useMemo, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Loader2, RefreshCw, Trash2 } from "lucide-react";
import type { SparringPairRow, SparringSessionDetail } from "@/lib/queries";

/** A fighter cell — belt swatch + name, or a muted "Bye" placeholder. */
function Fighter({
  name,
  belt,
  color,
}: {
  name: string | null;
  belt: string | null;
  color: string | null;
}) {
  if (!name) {
    return (
      <span className="flex-1 text-sm font-medium italic text-muted-foreground">
        Bye — sits out
      </span>
    );
  }
  return (
    <span className="flex min-w-0 flex-1 items-center gap-2">
      <span
        className="h-3 w-3 shrink-0 rounded-full border border-black/10"
        style={{ backgroundColor: color ?? "#e5e7eb" }}
        aria-hidden
      />
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-brand-navy">
          {name}
        </span>
        <span className="block text-xs text-muted-foreground">
          {belt ?? "No belt"}
        </span>
      </span>
    </span>
  );
}

/** Renders the pairings grouped by round, with regenerate / delete actions. */
export function SparringBoard({ session }: { session: SparringSessionDetail }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"regen" | "delete" | null>(null);
  const [error, setError] = useState("");

  const rounds = useMemo(() => {
    const byRound = new Map<number, SparringPairRow[]>();
    for (const p of session.pairs) {
      const list = byRound.get(p.round) ?? [];
      list.push(p);
      byRound.set(p.round, list);
    }
    return [...byRound.entries()].sort((a, b) => a[0] - b[0]);
  }, [session.pairs]);

  async function regenerate() {
    setBusy("regen");
    setError("");
    try {
      const res = await fetch(`/api/sparring/${session.id}/pairs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Could not regenerate pairs.");
      }
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not regenerate pairs.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!confirm("Delete this sparring session?")) return;
    setBusy("delete");
    setError("");
    try {
      const res = await fetch(`/api/sparring/${session.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Could not delete the session.");
      }
      router.push("/sparring");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not delete the session.",
      );
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <button
          type="button"
          onClick={regenerate}
          disabled={busy !== null}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-teal px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90 disabled:opacity-50"
        >
          {busy === "regen" ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <RefreshCw size={15} />
          )}
          Re-pair
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={busy !== null}
          className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
        >
          {busy === "delete" ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Trash2 size={15} />
          )}
          Delete session
        </button>
        <span className="text-xs text-muted-foreground">
          Re-pair reshuffles the draw and reaches for fresh matchups.
        </span>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>

      {rounds.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No pairings yet.
        </p>
      ) : (
        rounds.map(([round, pairs]) => (
          <section key={round} className="space-y-2">
            {session.rounds > 1 && (
              <h2 className="text-sm font-bold uppercase tracking-wide text-brand-teal">
                Round {round}
              </h2>
            )}
            <ul className="space-y-2">
              {pairs.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                    {p.mat ?? "–"}
                  </span>
                  <Fighter
                    name={p.studentAName}
                    belt={p.studentABelt}
                    color={p.studentAColor}
                  />
                  <span className="shrink-0 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    {p.studentBId ? "vs" : ""}
                  </span>
                  <Fighter
                    name={p.studentBName}
                    belt={p.studentBBelt}
                    color={p.studentBColor}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
