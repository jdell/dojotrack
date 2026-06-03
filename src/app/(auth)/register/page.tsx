"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { createClient } from "@/lib/supabase/client";
import { DISCIPLINES } from "@/lib/constants";
import type { Discipline } from "@/types";

type Step = "form" | "otp";

export default function RegisterPage() {
  const router = useRouter();
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
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error ?? "Could not finish setting up your club.",
        );
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code.");
    } finally {
      setLoading(false);
    }
  }

  if (step === "otp") {
    return (
      <div className="w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-900/[0.04]">
        <div className="mb-8 lg:hidden">
          <Logo size={32} />
        </div>
        <h1 className="mb-1 text-xl font-bold text-brand-navy">
          Verify your number
        </h1>
        <p className="mb-6 text-sm text-slate-500">Code sent to {form.phone}</p>
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
            className="w-full rounded-lg border border-slate-300 px-3 py-3 text-center font-mono text-xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-brand-teal"
          />
          <button
            type="submit"
            disabled={loading || otp.length < 6}
            className="w-full rounded-lg bg-brand-teal py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90 disabled:opacity-50 disabled:hover:bg-brand-teal"
          >
            {loading ? "Verifying…" : "Create club"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("form");
              setOtp("");
              setError("");
            }}
            className="w-full py-2 text-sm text-slate-500 transition-colors hover:text-slate-700"
          >
            ← Back
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-900/[0.04]">
      <div className="mb-8 lg:hidden">
        <Logo size={32} />
      </div>

      <h1 className="mb-1 text-xl font-bold text-brand-navy">
        Register your club
      </h1>
      <p className="mb-6 text-sm text-slate-500">
        Set up your dojo in under a minute.
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Club name
          </label>
          <input
            type="text"
            required
            placeholder="Gracie Barra Downtown"
            value={form.clubName}
            onChange={(e) => update("clubName", e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-teal"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Your name
          </label>
          <input
            type="text"
            required
            placeholder="Head instructor"
            value={form.instructorName}
            onChange={(e) => update("instructorName", e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-teal"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Phone number
          </label>
          <input
            type="tel"
            required
            autoComplete="tel"
            placeholder="+1 555 123 4567"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-teal"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Primary discipline
          </label>
          <select
            value={form.discipline}
            onChange={(e) => update("discipline", e.target.value as Discipline)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-teal"
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
          {loading ? "Sending code…" : "Continue"}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-400">
        Already have a club?{" "}
        <Link
          href="/login"
          className="font-medium text-brand-navy hover:underline"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
