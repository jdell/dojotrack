"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Logo } from "@/components/logo";
import { createClient } from "@/lib/supabase/client";

type Step = "phone" | "otp";

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations("Auth");
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({ phone });
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
        phone,
        token: otp,
        type: "sms",
      });
      if (error) throw error;
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorInvalidCode"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-xl shadow-slate-900/[0.04]">
      <div className="mb-8 lg:hidden">
        <Logo size={32} />
      </div>

      <h1 className="mb-1 text-xl font-bold text-brand-navy">
        {step === "phone" ? t("loginTitle") : t("loginCodeTitle")}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {step === "phone"
          ? t("loginSubtitle")
          : t("loginCodeSentTo", { phone })}
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {step === "phone" ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              {t("phoneLabel")}
            </label>
            <input
              type="tel"
              required
              autoComplete="tel"
              placeholder={t("phonePlaceholder")}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-teal"
            />
          </div>
          <button
            type="submit"
            disabled={loading || phone.replace(/\D/g, "").length < 6}
            className="w-full rounded-lg bg-brand-teal py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90 disabled:opacity-50 disabled:hover:bg-brand-teal"
          >
            {loading ? t("sending") : t("sendCode")}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              {t("verificationLabel")}
            </label>
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
          </div>
          <button
            type="submit"
            disabled={loading || otp.length < 6}
            className="w-full rounded-lg bg-brand-teal py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90 disabled:opacity-50 disabled:hover:bg-brand-teal"
          >
            {loading ? t("verifying") : t("logInButton")}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("phone");
              setOtp("");
              setError("");
            }}
            className="w-full py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("changeNumber")}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-xs text-muted-foreground">
        {t("newClub")}{" "}
        <Link
          href="/register"
          className="font-medium text-brand-navy hover:underline"
        >
          {t("registerHere")}
        </Link>
      </p>
    </div>
  );
}
