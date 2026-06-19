import { getTranslations } from "next-intl/server";
import { Check, Clock, Minus, Trophy } from "lucide-react";
import { getBeltProgress } from "@/lib/queries";
import { BeltBadge } from "@/components/belt-badge";

interface MyBeltProgressProps {
  studentId: string;
  clubId: string;
}

function StateIcon({ state }: { state: "met" | "in_progress" | "not_met" }) {
  const base = "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full";
  if (state === "met") return <span className={`${base} bg-green-100 text-green-700`}><Check size={12} /></span>;
  if (state === "in_progress") return <span className={`${base} bg-amber-100 text-amber-700`}><Clock size={12} /></span>;
  return <span className={`${base} bg-slate-100 text-slate-400`}><Minus size={12} /></span>;
}

export async function MyBeltProgress({ studentId, clubId }: MyBeltProgressProps) {
  const t = await getTranslations("MyProfile");
  const ts = await getTranslations("Students");

  const progress = await getBeltProgress(studentId, clubId);

  if (!progress || !progress.currentBelt) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-brand-navy">
          {t("beltProgress")}
        </h2>
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
          <Trophy size={32} className="mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {t("noBeltAssigned")}
          </p>
        </div>
      </section>
    );
  }

  const { currentBelt, nextBelt, requirements, metCount, totalCount } = progress;
  const pct = totalCount > 0 ? Math.round((metCount / totalCount) * 100) : 0;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-brand-navy">
        {t("beltProgress")}
      </h2>
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        {/* Current belt */}
        <div className="flex items-center gap-3">
          <BeltBadge name={currentBelt.name} color={currentBelt.color} />
        </div>

        {nextBelt ? (
          <>
            {/* Progress to next belt */}
            <p className="mt-4 text-sm font-medium text-brand-navy">
              {ts("progressTo", { belt: nextBelt.name })}
            </p>

            {/* Progress bar */}
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{ts("metCount", { met: metCount, total: totalCount })}</span>
                <span>{ts("percentComplete", { pct })}</span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-brand-teal transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {/* Requirements list */}
            {requirements.length > 0 && (
              <ul className="mt-4 space-y-2">
                {requirements.map((req) => (
                  <li
                    key={req.requirement.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <StateIcon state={req.state} />
                    <span className="text-brand-navy">{req.requirement.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {req.detail}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          /* Top of ladder */
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Trophy size={16} className="text-amber-500" />
            <span>{ts("topOfLadderTitle")}</span>
          </div>
        )}
      </div>
    </section>
  );
}
