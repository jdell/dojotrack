"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Loader2 } from "lucide-react";
import { disciplineMeta } from "@/lib/constants";
import type { ClassCard } from "@/lib/queries";

interface MyClassesProps {
  classes: ClassCard[];
  studentId: string;
}

export function MyClasses({ classes, studentId }: MyClassesProps) {
  const t = useTranslations("MyProfile");
  const tc = useTranslations("Classes");
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleBook(classScheduleId: string) {
    setLoadingId(classScheduleId);
    try {
      await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classScheduleId, studentId }),
      });
      router.refresh();
    } catch {
      // silently fail
    } finally {
      setLoadingId(null);
    }
  }

  async function handleCancel(classSessionId: string) {
    setLoadingId(classSessionId);
    try {
      await fetch("/api/bookings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classSessionId, studentId }),
      });
      router.refresh();
    } catch {
      // silently fail
    } finally {
      setLoadingId(null);
    }
  }

  if (classes.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
        {tc("emptyTitle")}
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {classes.map((cls) => {
        const meta = disciplineMeta(cls.discipline);
        const isBooked = cls.bookingStatus === "BOOKED";
        const isWaitlisted = cls.bookingStatus === "WAITLISTED";
        const isLoading = loadingId === cls.id || loadingId === cls.nextSessionId;

        return (
          <div
            key={cls.id}
            className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex-1">
              <h3 className="text-base font-bold text-brand-navy">{cls.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {meta.emoji} {meta.label}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {tc(`dayShort.${cls.dayOfWeek}`)} &middot; {cls.startTime}&ndash;{cls.endTime}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {cls.enrolledCount} / {cls.maxStudents} {tc("enrolledCapacity")}
              </p>
            </div>

            <div className="mt-4 flex items-center gap-2">
              {isBooked && (
                <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                  {t("alreadyBooked")}
                </span>
              )}
              {isWaitlisted && (
                <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                  {tc("waitlisted")}
                </span>
              )}

              {(isBooked || isWaitlisted) && cls.nextSessionId && (
                <button
                  type="button"
                  onClick={() => handleCancel(cls.nextSessionId!)}
                  disabled={isLoading}
                  className="ml-auto inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted/40 disabled:opacity-50"
                >
                  {isLoading && <Loader2 size={12} className="animate-spin" />}
                  {t("cancelBooking")}
                </button>
              )}

              {!isBooked && !isWaitlisted && !cls.isFull && (
                <button
                  type="button"
                  onClick={() => handleBook(cls.id)}
                  disabled={isLoading}
                  className="ml-auto inline-flex items-center gap-1 rounded-lg bg-brand-teal px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-teal/90 disabled:opacity-50"
                >
                  {isLoading && <Loader2 size={12} className="animate-spin" />}
                  {t("bookClass")}
                </button>
              )}

              {!isBooked && !isWaitlisted && cls.isFull && (
                <span className="ml-auto text-xs font-semibold text-muted-foreground">
                  {t("classFull")}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
