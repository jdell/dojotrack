"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  ArrowRight,
  Award,
  Building2,
  CalendarDays,
  Check,
  CreditCard,
  Users,
  X,
  Zap,
} from "lucide-react";

const STORAGE_KEY = "entrenadojo-onboarding-dismissed";

interface OnboardingChecklistProps {
  completedSteps: {
    hasProfile: boolean;
    hasBeltRanks: boolean;
    hasClasses: boolean;
    hasStudents: boolean;
    hasPaymentPlans: boolean;
    hasStripe: boolean;
  };
}

export function OnboardingChecklist({
  completedSteps,
}: OnboardingChecklistProps) {
  const t = useTranslations("Dashboard");
  const [dismissed, setDismissed] = useState(true); // Start hidden to avoid flash

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === "true");
  }, []);

  if (dismissed) return null;

  const steps = [
    {
      key: "step1" as const,
      done: completedSteps.hasProfile,
      href: "/settings" as const,
      icon: Building2,
    },
    {
      key: "step2" as const,
      done: completedSteps.hasBeltRanks,
      href: "/belts" as const,
      icon: Award,
    },
    {
      key: "step3" as const,
      done: completedSteps.hasClasses,
      href: "/classes" as const,
      icon: CalendarDays,
    },
    {
      key: "step4" as const,
      done: completedSteps.hasStudents,
      href: "/students" as const,
      icon: Users,
    },
    {
      key: "step5" as const,
      done: completedSteps.hasPaymentPlans,
      href: "/payments" as const,
      icon: CreditCard,
    },
    {
      key: "step6" as const,
      done: completedSteps.hasStripe,
      href: "/settings" as const,
      icon: Zap,
    },
  ];

  const completed = steps.filter((s) => s.done).length;

  function handleDismiss() {
    localStorage.setItem(STORAGE_KEY, "true");
    setDismissed(true);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      {/* Header */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-brand-navy">
              {t("onboardingTitle")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("onboardingSubtitle")}
            </p>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-brand-navy"
            aria-label={t("onboardingDismiss")}
            title={t("onboardingDismiss")}
          >
            <X size={16} />
          </button>
        </div>
        {/* Progress bar */}
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {t("onboardingProgress", { completed, total: 6 })}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-brand-teal transition-[width] duration-500"
              style={{ width: `${Math.round((completed / 6) * 100)}%` }}
            />
          </div>
        </div>
      </div>
      {/* Steps */}
      <ul className="divide-y divide-border border-t border-border">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <li
              key={step.key}
              className={`flex items-center gap-3 px-5 py-3 ${step.done ? "opacity-60" : ""}`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${
                  step.done
                    ? "border-brand-teal bg-brand-teal text-white"
                    : "border-slate-300 bg-white text-slate-400"
                }`}
              >
                {step.done ? <Check size={14} /> : <Icon size={14} />}
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-medium ${step.done ? "text-muted-foreground line-through" : "text-brand-navy"}`}
                >
                  {t(`${step.key}Title`)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t(`${step.key}Desc`)}
                </p>
              </div>
              {!step.done && (
                <Link
                  href={step.href}
                  className="inline-flex items-center gap-1 rounded-lg bg-brand-teal/10 px-3 py-1.5 text-xs font-semibold text-brand-teal transition-colors hover:bg-brand-teal/20"
                >
                  Go
                  <ArrowRight size={12} />
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
