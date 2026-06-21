"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Library, Plus } from "lucide-react";
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
  const [showLibrary, setShowLibrary] = useState(false);
  const [reqs, setReqs] = useState(requirements);

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
        <button
          type="button"
          onClick={() => setShowLibrary(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-brand-teal/30 bg-brand-teal/5 px-3 py-1.5 text-xs font-semibold text-brand-teal transition-colors hover:bg-brand-teal/10"
        >
          <Library size={14} />
          {t("browseLibrary")}
        </button>
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
