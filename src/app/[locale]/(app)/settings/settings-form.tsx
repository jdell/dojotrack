"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Loader2 } from "lucide-react";
import type { ClubSettings } from "@/lib/queries";
import { DISCIPLINES, TIMEZONES } from "@/lib/constants";

interface SettingsFormProps {
  settings: ClubSettings;
  /** Public base shown next to the slug, e.g. "dojotrack.app". */
  publicHost: string;
}

/** Editable string fields, all initialised to "" when null. */
type FormState = {
  name: string;
  logoUrl: string;
  email: string;
  phone: string;
  address: string;
  websiteUrl: string;
  instagramUrl: string;
  facebookUrl: string;
  youtubeUrl: string;
  martialArt: string;
  timezone: string;
};

function initial(s: ClubSettings): FormState {
  return {
    name: s.name ?? "",
    logoUrl: s.logoUrl ?? "",
    email: s.email ?? "",
    phone: s.phone ?? "",
    address: s.address ?? "",
    websiteUrl: s.websiteUrl ?? "",
    instagramUrl: s.instagramUrl ?? "",
    facebookUrl: s.facebookUrl ?? "",
    youtubeUrl: s.youtubeUrl ?? "",
    martialArt: s.beltSystemId ?? s.disciplines[0] ?? "",
    timezone: s.timezone ?? "",
  };
}

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-teal";

export function SettingsForm({ settings, publicHost }: SettingsFormProps) {
  const t = useTranslations("Settings");
  const tCommon = useTranslations("Common");
  const [form, setForm] = useState<FormState>(() => initial(settings));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          logoUrl: form.logoUrl,
          email: form.email,
          phone: form.phone,
          address: form.address,
          websiteUrl: form.websiteUrl,
          instagramUrl: form.instagramUrl,
          facebookUrl: form.facebookUrl,
          youtubeUrl: form.youtubeUrl,
          martialArt: form.martialArt || null,
          timezone: form.timezone || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("errorSave"));
      setToast(true);
      setTimeout(() => setToast(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorSave"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Profile */}
      <section className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wide text-brand-navy">
          {t("sectionProfile")}
        </h2>

        <Field label={t("clubName")} required>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder={t("clubNamePlaceholder")}
            className={inputClass}
          />
        </Field>

        <Field label={t("publicUrl")} hint={t("publicUrlHint")}>
          <div className="flex items-center rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground">
            <span className="text-muted-foreground/70">{publicHost}/club/</span>
            <span className="font-medium text-brand-navy">{settings.slug}</span>
          </div>
        </Field>

        <Field label={t("logoUrl")} hint={t("logoUrlHint")}>
          <input
            type="url"
            value={form.logoUrl}
            onChange={(e) => set("logoUrl", e.target.value)}
            placeholder="https://…/logo.png"
            className={inputClass}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("defaultArt")}>
            <select
              value={form.martialArt}
              onChange={(e) => set("martialArt", e.target.value)}
              className={inputClass}
            >
              <option value="">{t("selectPlaceholder")}</option>
              {DISCIPLINES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.emoji} {d.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("timezone")}>
            <select
              value={form.timezone}
              onChange={(e) => set("timezone", e.target.value)}
              className={inputClass}
            >
              <option value="">{t("selectPlaceholder")}</option>
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      {/* Contact */}
      <section className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wide text-brand-navy">
          {t("sectionContact")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("email")}>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder={t("emailPlaceholder")}
              className={inputClass}
            />
          </Field>
          <Field label={t("phone")}>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+1 555 123 4567"
              className={inputClass}
            />
          </Field>
        </div>
        <Field label={t("address")}>
          <input
            type="text"
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
            placeholder={t("addressPlaceholder")}
            className={inputClass}
          />
        </Field>
        <Field label={t("website")}>
          <input
            type="url"
            value={form.websiteUrl}
            onChange={(e) => set("websiteUrl", e.target.value)}
            placeholder="https://yourdojo.com"
            className={inputClass}
          />
        </Field>
      </section>

      {/* Social */}
      <section className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wide text-brand-navy">
          {t("sectionSocial")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t("instagram")}>
            <input
              type="url"
              value={form.instagramUrl}
              onChange={(e) => set("instagramUrl", e.target.value)}
              placeholder="https://instagram.com/…"
              className={inputClass}
            />
          </Field>
          <Field label={t("facebook")}>
            <input
              type="url"
              value={form.facebookUrl}
              onChange={(e) => set("facebookUrl", e.target.value)}
              placeholder="https://facebook.com/…"
              className={inputClass}
            />
          </Field>
          <Field label={t("youtube")}>
            <input
              type="url"
              value={form.youtubeUrl}
              onChange={(e) => set("youtubeUrl", e.target.value)}
              placeholder="https://youtube.com/@…"
              className={inputClass}
            />
          </Field>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-teal px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {saving && <Loader2 size={16} className="animate-spin" />}
          {saving ? tCommon("saving") : tCommon("save")}
        </button>
      </div>

      {/* Success toast */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-brand-teal/30 bg-white px-4 py-3 text-sm font-medium text-brand-navy shadow-lg shadow-slate-900/10"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-teal text-white">
            <Check size={14} />
          </span>
          {t("toastSaved")}
        </div>
      )}
    </form>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-brand-navy">
        {label}
        {required && <span className="ml-0.5 text-brand-teal">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
