"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ExternalLink } from "lucide-react";

interface ImpersonateButtonProps {
  clubId: string;
  clubName: string;
}

/**
 * Button that starts impersonating a club. Posts to the impersonate API, then
 * redirects to /dashboard where the admin will see the club's data.
 */
export function ImpersonateButton({ clubId, clubName }: ImpersonateButtonProps) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleImpersonate() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clubId }),
      });

      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        console.error("Impersonation failed:", data.error ?? res.statusText);
        alert(t("impersonateFailed"));
      }
    } catch {
      alert(t("impersonateFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleImpersonate}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-lg border border-brand-teal/30 bg-brand-teal/5 px-4 py-2.5 text-sm font-medium text-brand-teal transition-colors hover:bg-brand-teal/10 disabled:opacity-50"
    >
      <ExternalLink size={16} />
      {loading ? "..." : t("impersonate")}
    </button>
  );
}
