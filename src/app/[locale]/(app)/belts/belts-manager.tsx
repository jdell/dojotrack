"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Library,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import type { BeltRankWithRequirements, RequirementDTO } from "@/lib/queries";
import { REQUIREMENT_TYPES, requirementTypeMeta } from "@/lib/constants";
import { RequirementsLibraryModal } from "./[rankId]/requirements-library-modal";

type ReqType = (typeof REQUIREMENT_TYPES)[number]["value"];

const AGE_GROUPS = ["adults", "children", "common"] as const;

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-teal";
const labelClass = "mb-1 block text-xs font-medium text-slate-700";

interface FormValues {
  name: string;
  type: ReqType;
  targetValue: string;
  description: string;
  ageGroup: string;
}

const EMPTY_FORM: FormValues = {
  name: "",
  type: "TECHNIQUE",
  targetValue: "",
  description: "",
  ageGroup: "common",
};

/**
 * Per-club belt requirement configuration: every rank, expandable, with inline
 * add / edit / delete and up-down reordering of its requirements.
 * Also supports reordering and deleting ranks themselves.
 */
export function BeltsManager({
  ranks: initialRanks,
  discipline,
}: {
  ranks: BeltRankWithRequirements[];
  discipline: string;
}) {
  const t = useTranslations("Belts");
  const tc = useTranslations("Common");
  const router = useRouter();
  const [ranks, setRanks] = useState(initialRanks);
  const [expanded, setExpanded] = useState<string | null>(
    ranks.find((r) => r.requirements.length > 0)?.id ?? ranks[0]?.id ?? null,
  );
  const [rankBusy, setRankBusy] = useState(false);
  const [rankError, setRankError] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  async function moveRank(rankId: string, direction: "up" | "down") {
    setRankBusy(true);
    setRankError("");
    try {
      const res = await fetch("/api/belt-ranks/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rankId, direction }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("errReorder"));
      // Swap locally
      const idx = ranks.findIndex((r) => r.id === rankId);
      const j = direction === "up" ? idx - 1 : idx + 1;
      if (idx >= 0 && j >= 0 && j < ranks.length) {
        const next = [...ranks];
        const tmpOrder = next[idx].order;
        next[idx] = { ...next[idx], order: next[j].order };
        next[j] = { ...next[j], order: tmpOrder };
        next.sort((a, b) => a.order - b.order);
        setRanks(next);
      }
      router.refresh();
    } catch (err) {
      setRankError(err instanceof Error ? err.message : t("errReorder"));
    } finally {
      setRankBusy(false);
    }
  }

  async function deleteRank(rankId: string) {
    setRankBusy(true);
    setRankError("");
    try {
      const res = await fetch(`/api/belt-ranks/${rankId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409) {
        throw new Error(t("cannotDeleteAssigned"));
      }
      if (!res.ok) throw new Error(data.error ?? t("errDelete"));
      setRanks((prev) => prev.filter((r) => r.id !== rankId));
      setConfirmDeleteId(null);
      router.refresh();
    } catch (err) {
      setRankError(err instanceof Error ? err.message : t("errDelete"));
    } finally {
      setRankBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {rankError && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {rankError}
        </p>
      )}
      {ranks.map((rank, i) => (
        <div key={rank.id} className="relative">
          <RankRow
            rank={rank}
            discipline={discipline}
            open={expanded === rank.id}
            onToggle={() =>
              setExpanded((cur) => (cur === rank.id ? null : rank.id))
            }
            rankActions={
              <div
                className="flex items-center gap-0.5"
                onClick={(e) => e.stopPropagation()}
              >
                <IconButton
                  label={t("moveUp")}
                  disabled={rankBusy || i === 0}
                  onClick={() => moveRank(rank.id, "up")}
                >
                  <ArrowUp size={14} />
                </IconButton>
                <IconButton
                  label={t("moveDown")}
                  disabled={rankBusy || i === ranks.length - 1}
                  onClick={() => moveRank(rank.id, "down")}
                >
                  <ArrowDown size={14} />
                </IconButton>
                {confirmDeleteId === rank.id ? (
                  <span className="ml-1 flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">
                      {t("confirmDeleteRank")}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteRank(rank.id)}
                      disabled={rankBusy}
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
                    label={t("deleteRank")}
                    disabled={rankBusy}
                    danger
                    onClick={() => setConfirmDeleteId(rank.id)}
                  >
                    <Trash2 size={14} />
                  </IconButton>
                )}
              </div>
            }
          />
        </div>
      ))}
    </div>
  );
}

function RankRow({
  rank,
  discipline,
  open,
  onToggle,
  rankActions,
}: {
  rank: BeltRankWithRequirements;
  discipline: string;
  open: boolean;
  onToggle: () => void;
  rankActions?: React.ReactNode;
}) {
  const t = useTranslations("Belts");
  const tc = useTranslations("Common");
  const router = useRouter();
  const [reqs, setReqs] = useState<RequirementDTO[]>(rank.requirements);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function add(values: FormValues) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/belt-requirements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          beltRankId: rank.id,
          name: values.name,
          type: values.type,
          targetValue: values.targetValue || null,
          description: values.description || null,
          ageGroup: values.ageGroup,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("errAdd"));
      setReqs((prev) => [...prev, data.requirement as RequirementDTO]);
      setAdding(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errAdd"));
    } finally {
      setBusy(false);
    }
  }

  async function save(id: string, values: FormValues) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/belt-requirements/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          type: values.type,
          targetValue: values.targetValue || null,
          description: values.description || null,
          ageGroup: values.ageGroup,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("errSave"));
      setReqs((prev) =>
        prev.map((r) => (r.id === id ? (data.requirement as RequirementDTO) : r)),
      );
      setEditingId(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errSave"));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/belt-requirements/${id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("errDelete"));
      setReqs((prev) => prev.filter((r) => r.id !== id));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errDelete"));
    } finally {
      setBusy(false);
    }
  }

  async function move(index: number, dir: -1 | 1) {
    const j = index + dir;
    if (j < 0 || j >= reqs.length) return;
    const a = reqs[index];
    const b = reqs[j];
    setBusy(true);
    setError("");
    try {
      await Promise.all([
        fetch(`/api/belt-requirements/${a.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: b.order }),
        }),
        fetch(`/api/belt-requirements/${b.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: a.order }),
        }),
      ]);
      const next = [...reqs];
      next[index] = { ...b, order: a.order };
      next[j] = { ...a, order: b.order };
      setReqs(next);
      router.refresh();
    } catch {
      setError(t("errReorder"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30"
      >
        {open ? (
          <ChevronDown size={16} className="shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight size={16} className="shrink-0 text-muted-foreground" />
        )}
        <span
          className="h-3 w-8 shrink-0 rounded-full border border-black/10"
          style={{ backgroundColor: rank.color }}
          aria-hidden
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-brand-navy">
            {rank.name}
          </span>
          <span className="text-xs text-muted-foreground">
            {t("studentCount", { count: rank.studentCount })} ·{" "}
            {t("requirementCount", { count: reqs.length })}
          </span>
        </span>
        {rankActions}
        <Link
          href={`/belts/${rank.id}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-brand-teal transition-colors hover:bg-brand-teal/10"
        >
          {t("candidates")}
          <ArrowUpRight size={13} />
        </Link>
      </button>

      {open && (
        <div className="border-t border-border px-4 py-3">
          {reqs.length === 0 && !adding ? (
            <div className="rounded-lg bg-muted/30 px-3 py-4 text-center">
              <p className="text-sm text-muted-foreground">
                {t("noRequirementsForRank", { rank: rank.name })}
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {reqs.map((req, i) =>
                editingId === req.id ? (
                  <li key={req.id}>
                    <RequirementForm
                      initial={{
                        name: req.name,
                        type: req.type,
                        targetValue:
                          req.targetValue != null ? String(req.targetValue) : "",
                        description: req.description ?? "",
                        ageGroup: req.ageGroup ?? "common",
                      }}
                      busy={busy}
                      submitLabel={tc("save")}
                      onSubmit={(v) => save(req.id, v)}
                      onCancel={() => setEditingId(null)}
                    />
                  </li>
                ) : (
                  <li
                    key={req.id}
                    className="flex items-start gap-3 rounded-lg border border-border px-3 py-2.5"
                  >
                    <span className="mt-0.5 text-base" aria-hidden>
                      {requirementTypeMeta(req.type).emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-brand-navy">
                        {req.name}
                        {req.targetValue != null && (
                          <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                            {req.targetValue}{" "}
                            {requirementTypeMeta(req.type).unit
                              ? t(`reqUnit.${req.type}`)
                              : ""}
                          </span>
                        )}
                        {req.ageGroup && req.ageGroup !== "common" && (
                          <span className={`ml-1.5 inline-flex items-center rounded-full px-1.5 py-0.5 text-[0.6rem] font-semibold ${
                            req.ageGroup === "adults"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-purple-100 text-purple-700"
                          }`}>
                            {t(req.ageGroup)}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t(`reqType.${req.type}`)}
                        {req.description ? ` · ${req.description}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <IconButton
                        label={t("moveUp")}
                        disabled={busy || i === 0}
                        onClick={() => move(i, -1)}
                      >
                        <ArrowUp size={14} />
                      </IconButton>
                      <IconButton
                        label={t("moveDown")}
                        disabled={busy || i === reqs.length - 1}
                        onClick={() => move(i, 1)}
                      >
                        <ArrowDown size={14} />
                      </IconButton>
                      <IconButton
                        label={t("editRequirement")}
                        disabled={busy}
                        onClick={() => setEditingId(req.id)}
                      >
                        <Pencil size={14} />
                      </IconButton>
                      <IconButton
                        label={t("deleteRequirement")}
                        disabled={busy}
                        danger
                        onClick={() => remove(req.id)}
                      >
                        <Trash2 size={14} />
                      </IconButton>
                    </div>
                  </li>
                ),
              )}
            </ul>
          )}

          {adding ? (
            <div className="mt-2">
              <RequirementForm
                initial={EMPTY_FORM}
                busy={busy}
                submitLabel={tc("add")}
                onSubmit={add}
                onCancel={() => setAdding(false)}
              />
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-xs font-semibold text-brand-teal transition-colors hover:bg-brand-teal/5"
              >
                <Plus size={14} />
                {t("addRequirement")}
              </button>
              <button
                type="button"
                onClick={() => setShowLibrary(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-brand-teal/30 bg-brand-teal/5 px-3 py-2 text-xs font-semibold text-brand-teal transition-colors hover:bg-brand-teal/10"
              >
                <Library size={14} />
                {t("browseLibrary")}
              </button>
            </div>
          )}

          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

          {showLibrary && (
            <RequirementsLibraryModal
              discipline={discipline}
              beltName={rank.name}
              rankId={rank.id}
              onImported={() => {
                // Reload the page to get fresh data
                window.location.reload();
              }}
              onClose={() => setShowLibrary(false)}
            />
          )}
        </div>
      )}
    </section>
  );
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

function RequirementForm({
  initial,
  busy,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: FormValues;
  busy: boolean;
  submitLabel: string;
  onSubmit: (values: FormValues) => void;
  onCancel: () => void;
}) {
  const t = useTranslations("Belts");
  const tc = useTranslations("Common");
  const [values, setValues] = useState<FormValues>(initial);
  const meta = requirementTypeMeta(values.type);

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(values);
      }}
      className="space-y-3 rounded-lg border border-brand-teal/40 bg-brand-teal/5 p-3"
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_10rem]">
        <div>
          <label className={labelClass}>{t("requirementLabel")}</label>
          <input
            type="text"
            required
            autoFocus
            placeholder={t("requirementPlaceholder")}
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>{t("typeLabel")}</label>
          <select
            value={values.type}
            onChange={(e) => set("type", e.target.value as ReqType)}
            className={`${inputClass} bg-white`}
          >
            {REQUIREMENT_TYPES.map((rt) => (
              <option key={rt.value} value={rt.value}>
                {rt.emoji} {t(`reqType.${rt.value}`)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
        {meta.unit && (
          <div>
            <label className={labelClass}>
              {t("targetLabel", { unit: t(`reqUnit.${values.type}`) })}
            </label>
            <input
              type="number"
              min={0}
              required={meta.auto}
              placeholder={t("targetPlaceholder")}
              value={values.targetValue}
              onChange={(e) => set("targetValue", e.target.value)}
              className={inputClass}
            />
          </div>
        )}
        <div className={meta.unit ? "" : "sm:col-span-2"}>
          <label className={labelClass}>{t("notesLabel")}</label>
          <input
            type="text"
            placeholder={t("notesPlaceholder")}
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label className={labelClass}>{t("ageGroup")}</label>
        <select
          value={values.ageGroup}
          onChange={(e) => set("ageGroup", e.target.value)}
          className={`${inputClass} bg-white w-auto`}
        >
          {AGE_GROUPS.map((ag) => (
            <option key={ag} value={ag}>
              {t(ag)}
            </option>
          ))}
        </select>
        <p className="mt-1 text-[0.65rem] text-muted-foreground">
          {t("ageGroupHint")}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={busy || !values.name.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-teal px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-teal/90 disabled:opacity-50"
        >
          {busy && <Loader2 size={13} className="animate-spin" />}
          {submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-brand-navy"
        >
          <X size={13} />
          {tc("cancel")}
        </button>
      </div>
    </form>
  );
}
