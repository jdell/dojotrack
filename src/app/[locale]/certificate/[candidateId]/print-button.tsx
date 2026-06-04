"use client";

import { useTranslations } from "next-intl";
import { Printer } from "lucide-react";

/** Triggers the browser print dialog (used to save the certificate as a PDF). */
export function PrintButton() {
  const t = useTranslations("Public.certificate");
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-lg bg-brand-teal px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90"
    >
      <Printer size={16} />
      {t("printButton")}
    </button>
  );
}
