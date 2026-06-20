"use client";

import { useTranslations } from "next-intl";
import { MessageCircle } from "lucide-react";

interface WhatsAppStatusProps {
  configured: boolean;
}

export function WhatsAppStatus({ configured }: WhatsAppStatusProps) {
  const t = useTranslations("Settings");

  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
          <MessageCircle size={20} />
        </span>
        <div>
          <h2 className="text-base font-bold text-brand-navy">
            {t("whatsappTitle")}
          </h2>
        </div>
      </div>

      {configured ? (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
          {t("whatsappConfigured")}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
            {t("whatsappNotConfigured")}
          </div>
          <p className="text-xs text-muted-foreground">
            {t("whatsappSetupInstructions")}
          </p>
        </div>
      )}
    </section>
  );
}
