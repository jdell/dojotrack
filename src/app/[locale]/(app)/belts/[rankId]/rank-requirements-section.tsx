"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Library, Loader2, Plus, X } from "lucide-react";
import type { RequirementDTO } from "@/lib/queries";
import { requirementTypeMeta } from "@/lib/constants";
import { RequirementsLibraryModal } from "./requirements-library-modal";

interface Props {
  rankId: string;
  rankName: string;
  discipline: string;
  requirements: RequirementDTO[];
}

/**
 * Client wrapper for the requirements section on the belt rank detail page.
 * Manages the Library modal state and renders the requirement list with an
 * "Add from library" CTA.
 */
export function RankRequirementsSection({
  rankId,
  rankName,
  discipline,
  requirements,
}: Props) {
  const t = useTranslations("Belts");
  const tCommon = useTranslations("Common");
  const [showLibrary, setShowLibrary] = useState(false);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [reqs, setReqs] = useState(requirements);
  const [addName, setAddName] = useState("");
  const [addType, setAddType] = useState<string>("TECHNIQUE");
  const [addTarget, setAddTarget] = useState("");
  const [addAge, setAddAge] = useState("common");
  const [addLoading, setAddLoading] = useState(false);

  function handleImported() {
    // Force a full page reload to get fresh data from the server
    window.location.reload();
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-brand-navy">
          {t("requirements")}
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowLibrary(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-teal/30 bg-brand-teal/5 px-3 py-1.5 text-xs font-semibold text-brand-teal transition-colors hover:bg-brand-teal/10"
          >
            <Library size={14} />
            {t("browseLibrary")}
          </button>
          <Link
            href={`/belts/${rankId}#add`}
            onClick={(e) => {
              e.preventDefault();
              setShowManualAdd(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-teal px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-teal/90"
          >
            <Plus size={14} />
            {t("addRequirement")}
          </Link>
        </div>
      </div>

      {reqs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
          <div className="mx-auto mb-3 text-3xl">📚</div>
          <p className="text-sm font-medium text-brand-navy">
            {t("addFromLibrary")}
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            {t("addFromLibraryHint", { discipline, belt: rankName })}
          </p>
          <button
            type="button"
            onClick={() => setShowLibrary(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand-teal px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90"
          >
            <Library size={15} />
            {t("browseLibrary")}
          </button>
          <p className="mt-3 text-xs text-muted-foreground">
            {t.rich("noRequirementsSet", {
              link: (chunks) => (
                <Link href="/belts" className="font-medium text-brand-teal">
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </div>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {reqs.map((req) => {
            const meta = requirementTypeMeta(req.type);
            return (
              <li
                key={req.id}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 shadow-sm"
              >
                <span className="mt-0.5 text-lg" aria-hidden>
                  {meta.emoji}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-brand-navy">
                    {req.name}
                    {req.targetValue != null && (
                      <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                        {req.targetValue}{" "}
                        {meta.unit ? t(`reqUnit.${req.type}`) : ""}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t(`reqType.${req.type}`)}
                    {req.description ? ` · ${req.description}` : ""}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {showManualAdd && (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-brand-navy">{t("addRequirement")}</p>
            <button type="button" onClick={() => setShowManualAdd(false)} className="rounded-md p-1 text-muted-foreground hover:bg-muted">
              <X size={15} />
            </button>
          </div>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!addName.trim()) return;
              setAddLoading(true);
              try {
                const res = await fetch("/api/belt-requirements", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    beltRankId: rankId,
                    name: addName.trim(),
                    type: addType,
                    targetValue: ["TIME", "CLASSES"].includes(addType) && addTarget ? Number(addTarget) : undefined,
                    ageGroup: addAge,
                  }),
                });
                if (res.ok) {
                  setAddName("");
                  setAddTarget("");
                  setShowManualAdd(false);
                  window.location.reload();
                }
              } finally {
                setAddLoading(false);
              }
            }}
            className="grid gap-3 sm:grid-cols-2"
          >
            <div className="sm:col-span-2">
              <input
                type="text"
                required
                placeholder={t("requirementName")}
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
              />
            </div>
            <select
              value={addType}
              onChange={(e) => setAddType(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="TECHNIQUE">{t("reqType.TECHNIQUE")}</option>
              <option value="TIME">{t("reqType.TIME")}</option>
              <option value="CLASSES">{t("reqType.CLASSES")}</option>
              <option value="COMPETITION">{t("reqType.COMPETITION")}</option>
              <option value="CUSTOM">{t("reqType.CUSTOM")}</option>
            </select>
            <select
              value={addAge}
              onChange={(e) => setAddAge(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="common">{t("common")}</option>
              <option value="adults">{t("adults")}</option>
              <option value="children">{t("children")}</option>
            </select>
            {["TIME", "CLASSES"].includes(addType) && (
              <input
                type="number"
                min={1}
                placeholder={addType === "TIME" ? t("targetMonths") : t("targetClasses")}
                value={addTarget}
                onChange={(e) => setAddTarget(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            )}
            <button
              type="submit"
              disabled={addLoading || !addName.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-teal px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {addLoading && <Loader2 size={14} className="animate-spin" />}
              {tCommon("add")}
            </button>
          </form>
        </div>
      )}

      {showLibrary && (
        <RequirementsLibraryModal
          discipline={discipline}
          beltName={rankName}
          rankId={rankId}
          onImported={handleImported}
          onClose={() => setShowLibrary(false)}
        />
      )}
    </section>
  );
}
