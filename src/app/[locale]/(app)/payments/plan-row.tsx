"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CreditCard, Pencil } from "lucide-react";
import type { BillingInterval } from "@prisma/client";
import { formatMoney } from "@/lib/utils";
import { EditPlanForm } from "./edit-plan-form";

interface PlanRowProps {
  plan: {
    id: string;
    name: string;
    amount: string | number;
    currency: string;
    interval: BillingInterval;
    description: string | null;
    active: boolean;
    activeMembers: number;
  };
}

export function PlanRow({ plan }: PlanRowProps) {
  const t = useTranslations("Payments");
  const [editing, setEditing] = useState(false);

  return (
    <li className="relative">
      <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-teal/10 text-brand-teal">
          <CreditCard size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-brand-navy">
            {plan.name}
            {!plan.active && (
              <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[0.65rem] font-semibold text-slate-600">
                {t("inactive")}
              </span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("memberCount", { count: plan.activeMembers })}
            {plan.description ? ` · ${plan.description}` : ""}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-bold text-brand-navy">
            {formatMoney(plan.amount, plan.currency)}
            <span className="text-xs font-normal text-muted-foreground">
              {t(`intervalShort.${plan.interval}`)}
            </span>
          </p>
          <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
            {t(`interval.${plan.interval}`)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(!editing)}
          aria-label={t("editPlan")}
          className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-brand-navy"
        >
          <Pencil size={15} />
        </button>
      </div>
      {editing && (
        <EditPlanForm plan={plan} onClose={() => setEditing(false)} />
      )}
    </li>
  );
}
