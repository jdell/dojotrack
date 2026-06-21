"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  Check,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Library,
  Loader2,
  Square,
  X,
} from "lucide-react";
import {
  findLibraryBelt,
  findLibraryDiscipline,
  getCategories,
  type LibraryRequirement,
} from "@/lib/requirements-library";
import { requirementTypeMeta } from "@/lib/constants";

interface Props {
  discipline: string;
  beltName: string;
  rankId: string;
  onImported: () => void;
  onClose: () => void;
}

const TYPE_COLORS: Record<string, string> = {
  TIME: "bg-amber-100 text-amber-700",
  CLASSES: "bg-blue-100 text-blue-700",
  TECHNIQUE: "bg-emerald-100 text-emerald-700",
  COMPETITION: "bg-purple-100 text-purple-700",
  CUSTOM: "bg-slate-100 text-slate-700",
};

const AGE_COLORS: Record<string, string> = {
  adults: "bg-blue-100 text-blue-700",
  children: "bg-purple-100 text-purple-700",
};

export function RequirementsLibraryModal({
  discipline,
  beltName,
  rankId,
  onImported,
  onClose,
}: Props) {
  const t = useTranslations("Belts");
  const tc = useTranslations("Common");
  const router = useRouter();

  // Find matching library data
  const libraryDiscipline = useMemo(
    () => findLibraryDiscipline(discipline),
    [discipline],
  );
  const libraryBelt = useMemo(
    () => (libraryDiscipline ? findLibraryBelt(libraryDiscipline, beltName) : undefined),
    [libraryDiscipline, beltName],
  );

  const categories = useMemo(
    () => (libraryBelt ? getCategories(libraryBelt.requirements) : []),
    [libraryBelt],
  );

  // Selection state — keyed by index in the requirements array
  const [selected, setSelected] = useState<Set<number>>(() => {
    if (!libraryBelt) return new Set();
    // Pre-select all by default
    return new Set(libraryBelt.requirements.map((_, i) => i));
  });

  // Collapsed categories
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const toggle = useCallback((index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const toggleCategory = useCallback(
    (category: string) => {
      if (!libraryBelt) return;
      const indices = libraryBelt.requirements
        .map((r, i) => (r.category === category ? i : -1))
        .filter((i) => i !== -1);
      const allSelected = indices.every((i) => selected.has(i));
      setSelected((prev) => {
        const next = new Set(prev);
        for (const i of indices) {
          if (allSelected) next.delete(i);
          else next.add(i);
        }
        return next;
      });
    },
    [libraryBelt, selected],
  );

  const toggleCollapseCategory = useCallback((category: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (!libraryBelt) return;
    setSelected(new Set(libraryBelt.requirements.map((_, i) => i)));
  }, [libraryBelt]);

  const deselectAll = useCallback(() => {
    setSelected(new Set());
  }, []);

  const handleImport = useCallback(async () => {
    if (!libraryBelt || selected.size === 0) return;
    setImporting(true);
    setError("");
    const items = libraryBelt.requirements.filter((_, i) => selected.has(i));
    setProgress({ done: 0, total: items.length });

    try {
      for (let i = 0; i < items.length; i++) {
        const req = items[i];
        const res = await fetch("/api/belt-requirements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            beltRankId: rankId,
            name: req.name,
            type: req.type,
            targetValue: req.targetValue ?? null,
            description: req.description ?? null,
            ageGroup: req.ageGroup,
            order: i,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? t("errAdd"));
        }
        setProgress({ done: i + 1, total: items.length });
      }
      router.refresh();
      onImported();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errAdd"));
    } finally {
      setImporting(false);
    }
  }, [libraryBelt, selected, rankId, router, onImported, onClose, t]);

  // ----- Render -----

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-[5vh] sm:pt-[10vh]">
      <div
        className="relative w-full max-w-2xl rounded-2xl border border-border bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lib-modal-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-teal/10">
              <Library size={18} className="text-brand-teal" />
            </div>
            <div>
              <h2
                id="lib-modal-title"
                className="text-lg font-bold text-brand-navy"
              >
                {t("requirementsLibrary")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {libraryDiscipline?.label ?? discipline} &mdash; {beltName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-brand-navy"
            aria-label={tc("close")}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
          {!libraryDiscipline || !libraryBelt ? (
            <NoLibraryAvailable discipline={discipline} beltName={beltName} />
          ) : (
            <>
              {/* Hint */}
              <p className="mb-4 text-sm text-muted-foreground">
                {t("libraryHint")}
              </p>

              {/* Global select/deselect */}
              <div className="mb-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-xs font-medium text-brand-teal hover:underline"
                >
                  {t("selectAll")}
                </button>
                <span className="text-xs text-muted-foreground">/</span>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="text-xs font-medium text-muted-foreground hover:text-brand-navy hover:underline"
                >
                  {t("deselectAll")}
                </button>
              </div>

              {/* Categories */}
              {categories.map((category) => {
                const catReqs = libraryBelt.requirements
                  .map((r, i) => ({ req: r, index: i }))
                  .filter(({ req }) => req.category === category);
                const allCatSelected = catReqs.every(({ index }) =>
                  selected.has(index),
                );
                const isCollapsed = collapsed.has(category);
                const selectedInCat = catReqs.filter(({ index }) =>
                  selected.has(index),
                ).length;

                return (
                  <div key={category} className="mb-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleCollapseCategory(category)}
                        className="flex items-center gap-1.5 text-sm font-semibold text-brand-navy"
                      >
                        {isCollapsed ? (
                          <ChevronRight size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        )}
                        {t(`category_${category}`)}
                      </button>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
                        {selectedInCat}/{catReqs.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleCategory(category)}
                        className="ml-auto text-[0.65rem] font-medium text-brand-teal hover:underline"
                      >
                        {allCatSelected ? t("deselectAll") : t("selectAll")}
                      </button>
                    </div>

                    {!isCollapsed && (
                      <ul className="mt-1.5 space-y-1">
                        {catReqs.map(({ req, index }) => (
                          <RequirementRow
                            key={index}
                            req={req}
                            checked={selected.has(index)}
                            onToggle={() => toggle(index)}
                          />
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        {libraryDiscipline && libraryBelt && (
          <div className="flex items-center justify-between border-t border-border px-5 py-3">
            <p className="text-sm text-muted-foreground">
              {t("selectedCount", { count: selected.size })}
            </p>
            <div className="flex items-center gap-2">
              {error && (
                <p className="text-xs text-red-600">{error}</p>
              )}
              {importing && (
                <p className="text-xs text-muted-foreground">
                  {progress.done}/{progress.total}
                </p>
              )}
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
              >
                {tc("cancel")}
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={importing || selected.size === 0}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-teal px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90 disabled:opacity-50"
              >
                {importing ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Check size={14} />
                )}
                {t("addSelected")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function RequirementRow({
  req,
  checked,
  onToggle,
}: {
  req: LibraryRequirement;
  checked: boolean;
  onToggle: () => void;
}) {
  const t = useTranslations("Belts");
  const meta = requirementTypeMeta(req.type);

  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-start gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors ${
          checked
            ? "border-brand-teal/40 bg-brand-teal/5"
            : "border-border bg-white hover:bg-muted/30"
        }`}
      >
        <span className="mt-0.5 shrink-0 text-brand-teal">
          {checked ? <CheckSquare size={16} /> : <Square size={16} className="text-slate-300" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-brand-navy">
            {req.name}
            {req.targetValue != null && (
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                {req.targetValue} {meta.unit ?? ""}
              </span>
            )}
          </p>
          {req.description && (
            <p className="text-xs text-muted-foreground">{req.description}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span
            className={`rounded-full px-1.5 py-0.5 text-[0.6rem] font-semibold ${
              TYPE_COLORS[req.type] ?? "bg-slate-100 text-slate-700"
            }`}
          >
            {t(`reqType.${req.type}`)}
          </span>
          {req.ageGroup !== "common" && (
            <span
              className={`rounded-full px-1.5 py-0.5 text-[0.6rem] font-semibold ${
                AGE_COLORS[req.ageGroup] ?? ""
              }`}
            >
              {t(req.ageGroup)}
            </span>
          )}
        </div>
      </button>
    </li>
  );
}

function NoLibraryAvailable({
  discipline,
  beltName,
}: {
  discipline: string;
  beltName: string;
}) {
  const t = useTranslations("Belts");

  return (
    <div className="py-8 text-center">
      <div className="mx-auto mb-3 text-4xl">📚</div>
      <h3 className="text-base font-semibold text-brand-navy">
        {t("noLibraryAvailable")}
      </h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        {t("noLibraryHint", { discipline, belt: beltName })}
      </p>
    </div>
  );
}
