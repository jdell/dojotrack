"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy, MessageCircle, X } from "lucide-react";
import type { BillingInterval } from "@prisma/client";
import { formatMoney } from "@/lib/utils";

interface ShareLinkPopoverProps {
  planId: string;
  planName: string;
  planAmount: number;
  planCurrency: string;
  planInterval: BillingInterval;
  clubSlug: string;
  onClose: () => void;
}

export function ShareLinkPopover({
  planId,
  planName,
  planAmount,
  planCurrency,
  planInterval,
  clubSlug,
  onClose,
}: ShareLinkPopoverProps) {
  const t = useTranslations("Pay");
  const tPayments = useTranslations("Payments");
  const [copied, setCopied] = useState(false);

  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  const paymentUrl = `${origin}/pay/${clubSlug}?plan=${planId}`;

  const price = `${formatMoney(Number(planAmount), planCurrency)}${tPayments(`intervalShort.${planInterval}`)}`;
  const whatsappMessage = t("paymentLinkMessage", {
    plan: `${planName} (${price})`,
    link: paymentUrl,
  });
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(paymentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the text in the input
    }
  }

  return (
    <div className="mt-2 rounded-xl border border-border bg-card p-4 shadow-lg animate-in fade-in slide-in-from-top-1">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-brand-navy">
          {t("shareLink")}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-brand-navy"
        >
          <X size={14} />
        </button>
      </div>

      {/* Link display + copy */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          readOnly
          value={paymentUrl}
          className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 select-all"
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-teal px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-teal/90"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? t("linkCopied") : t("copyLink")}
        </button>
      </div>

      {/* WhatsApp share */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
      >
        <MessageCircle size={14} />
        {t("whatsappShare")}
      </a>
    </div>
  );
}
