"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, Loader2 } from "lucide-react";

interface JoinFormProps {
  token: string;
  clubName: string;
  unitLabel: string | null;
}

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-teal";
const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

/**
 * Public sign-up form an invited student fills in. On success it creates the
 * student record and marks the invite as accepted, then shows a confirmation.
 */
export function JoinForm({ token, clubName, unitLabel }: JoinFormProps) {
  const t = useTranslations("Public.join");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    fullName: unitLabel ?? "",
    phone: "",
    email: "",
    dateOfBirth: "",
  });

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/invitations/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          phone: form.phone || null,
          email: form.email || null,
          dateOfBirth: form.dateOfBirth || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("errorComplete"));
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorSignUp"));
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="text-center">
        <CheckCircle2 size={44} className="mx-auto text-brand-teal" />
        <h2 className="mt-3 text-lg font-bold text-brand-navy">
          {t("successTitle")}
        </h2>
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
          {t("successBody", {
            name: form.fullName.split(" ")[0],
            club: clubName,
          })}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <div>
        <label className={labelClass}>{t("fullName")}</label>
        <input
          type="text"
          required
          placeholder={t("fullNamePlaceholder")}
          value={form.fullName}
          onChange={(e) => update("fullName", e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>{t("phone")}</label>
        <input
          type="tel"
          autoComplete="tel"
          placeholder="+1 555 123 4567"
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>{t("email")}</label>
        <input
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>{t("dateOfBirth")}</label>
        <input
          type="date"
          value={form.dateOfBirth}
          onChange={(e) => update("dateOfBirth", e.target.value)}
          className={inputClass}
        />
      </div>
      <button
        type="submit"
        disabled={loading || !form.fullName.trim()}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-teal py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90 disabled:opacity-50 disabled:hover:bg-brand-teal"
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {loading ? t("joining") : t("joinButton", { club: clubName })}
      </button>
    </form>
  );
}
