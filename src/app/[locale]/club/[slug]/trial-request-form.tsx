"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarPlus, Loader2, X, CheckCircle2 } from "lucide-react";

interface TrialRequestFormProps {
  clubSlug: string;
  classScheduleId: string;
  className: string;
}

export function TrialRequestForm({
  clubSlug,
  classScheduleId,
  className,
}: TrialRequestFormProps) {
  const t = useTranslations("Club");
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  function reset() {
    setName("");
    setEmail("");
    setPhone("");
    setMessage("");
    setSent(false);
    setError(null);
  }

  function handleClose() {
    setOpen(false);
    // Reset after close animation
    setTimeout(reset, 200);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() && !phone.trim()) {
      setError(t("trialContactRequired"));
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/trial-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clubSlug,
          classScheduleId,
          name: name.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          message: message.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error("Request failed");
      setSent(true);
    } catch {
      setError(t("trialError"));
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 flex items-center gap-1 rounded-lg bg-brand-gold px-2.5 py-1 text-xs font-semibold text-brand-navy transition-opacity hover:opacity-90"
      >
        <CalendarPlus size={12} />
        {t("bookTrialClass")}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <button
              type="button"
              onClick={handleClose}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-brand-navy">
              {t("trialFormTitle")}
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {className}
            </p>

            {sent ? (
              <div className="mt-6 flex flex-col items-center gap-3 py-4 text-center">
                <CheckCircle2 size={40} className="text-brand-teal" />
                <p className="text-sm font-medium text-brand-navy">
                  {t("trialSent")}
                </p>
                <button
                  type="button"
                  onClick={handleClose}
                  className="mt-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  {t("trialFormTitle")}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                    {t("trialName")} *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-brand-teal focus:ring-1 focus:ring-brand-teal dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                    {t("trialEmail")}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-brand-teal focus:ring-1 focus:ring-brand-teal dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                    {t("trialPhone")}
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-brand-teal focus:ring-1 focus:ring-brand-teal dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                    {t("trialMessage")}
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-brand-teal focus:ring-1 focus:ring-brand-teal dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                {error && (
                  <p className="text-xs font-medium text-red-600">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-teal px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {sending && <Loader2 size={14} className="animate-spin" />}
                  {t("trialSubmit")}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
