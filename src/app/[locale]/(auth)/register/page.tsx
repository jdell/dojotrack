"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Logo } from "@/components/logo";
import { createClient } from "@/lib/supabase/client";
import { DISCIPLINES } from "@/lib/constants";
import type { Discipline } from "@/types";

type Step = "form" | "otp";

export default function RegisterPage() {
  const router = useRouter();
  const t = useTranslations("Auth");
  const locale = useLocale();
  const [step, setStep] = useState<Step>("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otp, setOtp] = useState("");
  const [form, setForm] = useState({
    clubName: "",
    instructorName: "",
    phone: "",
    discipline: "bjj" as Discipline,
  });

  function update<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        phone: form.phone,
        options: {
          data: {
            full_name: form.instructorName,
            club_name: form.clubName,
            discipline: form.discipline,
          },
        },
      });
      if (error) throw error;
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorSendCode"));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({
        phone: form.phone,
        token: otp,
        type: "sms",
      });
      if (error) throw error;

      // The Supabase user now exists — provision the club + owner rows.
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clubName: form.clubName,
          ownerName: form.instructorName,
          phone: form.phone,
          martialArt: form.discipline,
          locale,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? t("errorSetupClub"));
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorInvalidCode"));
    } finally {
      setLoading(false);
    }
  }

  if (step === "otp") {
    return (
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-xl shadow-slate-900/[0.04]">
        <div className="mb-8 lg:hidden">
          <Logo size={32} />
        </div>
        <h1 className="mb-1 text-xl font-bold text-brand-navy">
          {t("registerVerifyTitle")}
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          {t("loginCodeSentTo", { phone: form.phone })}
        </p>
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            placeholder="• • • • • •"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            className="w-full rounded-lg border border-border px-3 py-3 text-center font-mono text-xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-brand-teal"
          />
          <button
            type="submit"
            disabled={loading || otp.length < 6}
            className="w-full rounded-lg bg-brand-teal py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90 disabled:opacity-50 disabled:hover:bg-brand-teal"
          >
            {loading ? t("verifying") : t("createClub")}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("form");
              setOtp("");
              setError("");
            }}
            className="w-full py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("back")}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-xl shadow-slate-900/[0.04]">
      <div className="mb-8 lg:hidden">
        <Logo size={32} />
      </div>

      <h1 className="mb-1 text-xl font-bold text-brand-navy">
        {t("registerTitle")}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">{t("registerSubtitle")}</p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {t("clubNameLabel")}
          </label>
          <input
            type="text"
            required
            placeholder={t("clubNamePlaceholder")}
            value={form.clubName}
            onChange={(e) => update("clubName", e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-teal"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {t("yourNameLabel")}
          </label>
          <input
            type="text"
            required
            placeholder={t("yourNamePlaceholder")}
            value={form.instructorName}
            onChange={(e) => update("instructorName", e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-teal"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {t("phoneLabel")}
          </label>
          <input
            type="tel"
            required
            autoComplete="tel"
            placeholder={t("phonePlaceholder")}
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-teal"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {t("disciplineLabel")}
          </label>
          <select
            value={form.discipline}
            onChange={(e) => update("discipline", e.target.value as Discipline)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-teal"
          >
            {DISCIPLINES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full rounded-lg bg-brand-teal py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90 disabled:opacity-50 disabled:hover:bg-brand-teal"
        >
          {loading ? t("sending") : t("continue")}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        {t("haveClub")}{" "}
        <Link
          href="/login"
          className="font-medium text-brand-navy hover:underline"
        >
          {t("logInButton")}
        </Link>
      </p>
    </div>
  );
}
