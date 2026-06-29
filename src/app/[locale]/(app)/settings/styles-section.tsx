"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Loader2,
  Plus,
  Power,
  Trash2,
  X,
} from "lucide-react";
import type { ClubStyle } from "@/lib/queries";
import { disciplineMeta } from "@/lib/constants";

interface DisciplineOption {
  value: string;
  label: string;
  emoji: string;
}

interface StylesSectionProps {
  styles: ClubStyle[];
  disciplines: DisciplineOption[];
}

const inputClass =
  "w-full rounded-lg border border-border px-3 py-2.5 text-sm bg-background text-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-teal";
const labelClass = "mb-1.5 block text-sm font-medium text-foreground";

export function StylesSection({
  styles: initialStyles,
  disciplines,
}: StylesSectionProps) {
  const t = useTranslations("Styles");
  const tc = useTranslations("Common");
  const router = useRouter();
  const [styles, setStyles] = useState(initialStyles);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Add form state
  const [newDiscipline, setNewDiscipline] = useState(
    disciplines[0]?.value ?? "",
  );
  const [newName, setNewName] = useState("");

  async function addStyle() {
    if (!newDiscipline) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/styles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discipline: newDiscipline,
          name: newName || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("errorAdd"));
      // Re-fetch styles to get accurate counts.
      const refreshRes = await fetch("/api/styles");
      const refreshData = await refreshRes.json();
      if (refreshRes.ok && refreshData.styles) {
        setStyles(
          refreshData.styles.map(mapApiStyle),
        );
      } else {
        // Fallback: just add locally.
        setStyles((prev) => [
          ...prev,
          {
            id: data.style.id,
            discipline: data.style.discipline,
            name: data.style.name,
            active: data.style.active,
            order: data.style.order,
            beltRankCount: 0,
            classCount: 0,
            studentCount: 0,
          },
        ]);
      }
      setAdding(false);
      setNewDiscipline(disciplines[0]?.value ?? "");
      setNewName("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorAdd"));
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(style: ClubStyle) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/styles/${style.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !style.active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("errorUpdate"));
      setStyles((prev) =>
        prev.map((s) =>
          s.id === style.id ? { ...s, active: !s.active } : s,
        ),
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorUpdate"));
    } finally {
      setBusy(false);
    }
  }

  async function moveStyle(styleId: string, direction: "up" | "down") {
    const idx = styles.findIndex((s) => s.id === styleId);
    const j = direction === "up" ? idx - 1 : idx + 1;
    if (idx < 0 || j < 0 || j >= styles.length) return;
    setBusy(true);
    setError("");
    try {
      const a = styles[idx];
      const b = styles[j];
      await Promise.all([
        fetch(`/api/styles/${a.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: b.order }),
        }),
        fetch(`/api/styles/${b.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: a.order }),
        }),
      ]);
      const next = [...styles];
      const tmpOrder = next[idx].order;
      next[idx] = { ...next[idx], order: next[j].order };
      next[j] = { ...next[j], order: tmpOrder };
      next.sort((x, y) => x.order - y.order);
      setStyles(next);
      router.refresh();
    } catch {
      setError(t("errorUpdate"));
    } finally {
      setBusy(false);
    }
  }

  async function deleteStyle(styleId: string) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/styles/${styleId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409) {
        throw new Error(t("cannotDelete"));
      }
      if (!res.ok) throw new Error(data.error ?? t("errorDelete"));
      setStyles((prev) => prev.filter((s) => s.id !== styleId));
      setConfirmDeleteId(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorDelete"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-brand-navy">{t("title")}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-teal px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Plus size={16} />
            {t("addStyle")}
          </button>
        )}
      </div>

      {error && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* Add style form */}
      {adding && (
        <div className="mt-4 rounded-lg border border-brand-teal/40 bg-brand-teal/5 p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr]">
            <div>
              <label className={labelClass}>{t("discipline")}</label>
              <select
                value={newDiscipline}
                onChange={(e) => setNewDiscipline(e.target.value)}
                className={`${inputClass} bg-background`}
              >
                {disciplines.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.emoji} {d.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{t("styleName")}</label>
              <input
                type="text"
                placeholder={
                  disciplines.find((d) => d.value === newDiscipline)?.label ?? ""
                }
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={addStyle}
              disabled={busy || !newDiscipline}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-teal px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-teal/90 disabled:opacity-50"
            >
              {busy && <Loader2 size={13} className="animate-spin" />}
              {tc("add")}
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setNewName("");
              }}
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-brand-navy"
            >
              <X size={13} />
              {tc("cancel")}
            </button>
          </div>
        </div>
      )}

      {/* Styles list */}
      <div className="mt-4 space-y-2">
        {styles.length === 0 ? (
          <p className="rounded-lg bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">
            {t("noStyles")}
          </p>
        ) : (
          styles.map((style, i) => {
            const meta = disciplineMeta(style.discipline);
            return (
              <div
                key={style.id}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                  style.active
                    ? "border-border bg-background"
                    : "border-border/50 bg-muted/20 opacity-60"
                }`}
              >
                <span className="text-lg" aria-hidden>
                  {meta.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-brand-navy">
                    {style.name}
                    {!style.active && (
                      <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                        ({t("inactive")})
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {meta.label} &middot;{" "}
                    {t("beltRanks", { count: style.beltRankCount })} &middot;{" "}
                    {t("classes", { count: style.classCount })} &middot;{" "}
                    {t("students", { count: style.studentCount })}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex shrink-0 items-center gap-0.5">
                  <IconButton
                    label={t("styleOrder")}
                    disabled={busy || i === 0}
                    onClick={() => moveStyle(style.id, "up")}
                  >
                    <ArrowUp size={14} />
                  </IconButton>
                  <IconButton
                    label={t("styleOrder")}
                    disabled={busy || i === styles.length - 1}
                    onClick={() => moveStyle(style.id, "down")}
                  >
                    <ArrowDown size={14} />
                  </IconButton>
                  <IconButton
                    label={
                      style.active
                        ? t("deactivateStyle")
                        : t("activateStyle")
                    }
                    disabled={busy}
                    onClick={() => toggleActive(style)}
                  >
                    <Power
                      size={14}
                      className={
                        style.active ? "text-green-600" : "text-muted-foreground"
                      }
                    />
                  </IconButton>
                  {confirmDeleteId === style.id ? (
                    <span className="ml-1 flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">
                        {t("confirmDelete")}
                      </span>
                      <button
                        type="button"
                        onClick={() => deleteStyle(style.id)}
                        disabled={busy}
                        className="rounded-md bg-red-600 px-2 py-0.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {tc("delete")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-xs font-medium text-muted-foreground hover:text-brand-navy"
                      >
                        {tc("cancel")}
                      </button>
                    </span>
                  ) : (
                    <IconButton
                      label={t("deleteStyle")}
                      disabled={busy}
                      danger
                      onClick={() => setConfirmDeleteId(style.id)}
                    >
                      <Trash2 size={14} />
                    </IconButton>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

/** Map an API-returned style to our ClubStyle shape. */
function mapApiStyle(s: {
  id: string;
  discipline: string;
  name: string;
  active: boolean;
  order: number;
  _count?: {
    beltRanks: number;
    classSchedules: number;
    studentStyles: number;
  };
}): ClubStyle {
  return {
    id: s.id,
    discipline: s.discipline,
    name: s.name,
    active: s.active,
    order: s.order,
    beltRankCount: s._count?.beltRanks ?? 0,
    classCount: s._count?.classSchedules ?? 0,
    studentCount: s._count?.studentStyles ?? 0,
  };
}

function IconButton({
  children,
  label,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md p-1.5 text-muted-foreground transition-colors disabled:opacity-30 ${
        danger ? "hover:bg-red-50 hover:text-red-600" : "hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}
