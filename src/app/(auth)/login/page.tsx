"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { createClient } from "@/lib/supabase/client";

type Step = "phone" | "otp";

export default function LoginPage() {
  const router = useRouter();
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
      setError(err instanceof Error ? err.message : "Could not send the code.");
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
      setError(err instanceof Error ? err.message : "Invalid code.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-900/[0.04]">
      <div className="mb-8 lg:hidden">
        <Logo size={32} />
      </div>

      <h1 className="mb-1 text-xl font-bold text-brand-navy">
        {step === "phone" ? "Log in" : "Enter the code"}
      </h1>
      <p className="mb-6 text-sm text-slate-500">
        {step === "phone"
          ? "We'll text you a one-time code."
          : `Code sent to ${phone}`}
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {step === "phone" ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Phone number
            </label>
            <input
              type="tel"
              required
              autoComplete="tel"
              placeholder="+1 555 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-teal"
            />
          </div>
          <button
            type="submit"
            disabled={loading || phone.replace(/\D/g, "").length < 6}
            className="w-full rounded-lg bg-brand-teal py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90 disabled:opacity-50 disabled:hover:bg-brand-teal"
          >
            {loading ? "Sending…" : "Send code"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Verification code
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
              className="w-full rounded-lg border border-slate-300 px-3 py-3 text-center font-mono text-xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-brand-teal"
            />
          </div>
          <button
            type="submit"
            disabled={loading || otp.length < 6}
            className="w-full rounded-lg bg-brand-teal py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90 disabled:opacity-50 disabled:hover:bg-brand-teal"
          >
            {loading ? "Verifying…" : "Log in"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("phone");
              setOtp("");
              setError("");
            }}
            className="w-full py-2 text-sm text-slate-500 transition-colors hover:text-slate-700"
          >
            ← Change number
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-xs text-slate-400">
        New club?{" "}
        <Link
          href="/register"
          className="font-medium text-brand-navy hover:underline"
        >
          Register here
        </Link>
      </p>
    </div>
  );
}
