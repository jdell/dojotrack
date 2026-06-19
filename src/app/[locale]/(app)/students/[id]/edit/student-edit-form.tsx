"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { Loader2 } from "lucide-react";
import type {
  BeltOption,
  FamilyOption,
  StudentEditData,
} from "@/lib/queries";

interface StudentEditFormProps {
  student: StudentEditData;
  beltOptions: BeltOption[];
  families: FamilyOption[];
}

const NEW_FAMILY = "__new__";

const inputClass =
  "w-full rounded-lg border border-border px-3 py-2.5 text-sm bg-background text-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-teal";
const labelClass = "mb-1.5 block text-sm font-medium text-foreground";

/**
 * Edit-student form. Pre-populated with the member's current values and
 * submits a PATCH to /api/students/[id], updating only what changed. On success
 * it returns to the student's profile page.
 */
export function StudentEditForm({
  student,
  beltOptions,
  families,
}: StudentEditFormProps) {
  const t = useTranslations("Students");
  const tc = useTranslations("Common");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [familyChoice, setFamilyChoice] = useState(student.familyId ?? "");
  const [form, setForm] = useState({
    fullName: student.fullName,
    phone: student.phone ?? "",
    email: student.email ?? "",
    dateOfBirth: student.dateOfBirth ?? "",
    beltRankId: student.beltRankId ?? "",
    weight: student.weight != null ? String(student.weight) : "",
    medicalNotes: student.medicalNotes ?? "",
    emergencyContact: student.emergencyContact ?? "",
    emergencyPhone: student.emergencyPhone ?? "",
    newFamilyName: "",
    active: student.active ? "true" : "false",
  });

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = {
        fullName: form.fullName,
        phone: form.phone || null,
        email: form.email || null,
        dateOfBirth: form.dateOfBirth || null,
        beltRankId: form.beltRankId || null,
        weight: form.weight === "" ? null : form.weight,
        medicalNotes: form.medicalNotes || null,
        emergencyContact: form.emergencyContact || null,
        emergencyPhone: form.emergencyPhone || null,
        familyId:
          familyChoice && familyChoice !== NEW_FAMILY ? familyChoice : null,
        newFamilyName:
          familyChoice === NEW_FAMILY
            ? form.newFamilyName.trim() || null
            : null,
        active: form.active === "true",
      };
      const res = await fetch(`/api/students/${student.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("errorUpdate"));
      router.push(`/students/${student.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorUpdate"));
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm"
    >
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Identity */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-brand-navy">
          {t("sectionMemberDetails")}
        </legend>
        <div>
          <label className={labelClass}>{t("fieldFullName")}</label>
          <input
            type="text"
            required
            placeholder={t("placeholderFullName")}
            value={form.fullName}
            onChange={(e) => update("fullName", e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>{t("fieldPhone")}</label>
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
            <label className={labelClass}>{t("fieldEmail")}</label>
            <input
              type="email"
              autoComplete="email"
              placeholder="alex@example.com"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>{t("fieldDateOfBirth")}</label>
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => update("dateOfBirth", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t("fieldBeltRank")}</label>
            <select
              value={form.beltRankId}
              onChange={(e) => update("beltRankId", e.target.value)}
              className={`${inputClass} bg-background`}
            >
              <option value="">{t("optionNoBeltYet")}</option>
              {beltOptions.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>{t("fieldWeight")}</label>
            <input
              type="number"
              min={0}
              placeholder="70"
              value={form.weight}
              onChange={(e) => update("weight", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t("fieldMembershipStatus")}</label>
            <select
              value={form.active}
              onChange={(e) => update("active", e.target.value)}
              className={`${inputClass} bg-background`}
            >
              <option value="true">{t("optionActive")}</option>
              <option value="false">{t("optionInactive")}</option>
            </select>
          </div>
        </div>
      </fieldset>

      {/* Family */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-brand-navy">
          {t("sectionFamily")}
        </legend>
        <div>
          <label className={labelClass}>{t("fieldAddToFamily")}</label>
          <select
            value={familyChoice}
            onChange={(e) => setFamilyChoice(e.target.value)}
            className={`${inputClass} bg-background`}
          >
            <option value="">{t("optionNoFamily")}</option>
            {families.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
            <option value={NEW_FAMILY}>{t("optionCreateFamily")}</option>
          </select>
        </div>
        {familyChoice === NEW_FAMILY && (
          <div>
            <label className={labelClass}>{t("fieldNewFamilyName")}</label>
            <input
              type="text"
              placeholder={t("placeholderNewFamilyName")}
              value={form.newFamilyName}
              onChange={(e) => update("newFamilyName", e.target.value)}
              className={inputClass}
            />
          </div>
        )}
      </fieldset>

      {/* Emergency + medical */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-brand-navy">
          {t("sectionSafety")}
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>{t("fieldEmergencyContact")}</label>
            <input
              type="text"
              placeholder={t("placeholderEmergencyContact")}
              value={form.emergencyContact}
              onChange={(e) => update("emergencyContact", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t("fieldEmergencyPhone")}</label>
            <input
              type="tel"
              placeholder="+1 555 987 6543"
              value={form.emergencyPhone}
              onChange={(e) => update("emergencyPhone", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>{t("fieldMedicalNotes")}</label>
          <textarea
            rows={3}
            placeholder={t("placeholderMedicalNotes")}
            value={form.medicalNotes}
            onChange={(e) => update("medicalNotes", e.target.value)}
            className={`${inputClass} resize-y`}
          />
        </div>
      </fieldset>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading || !form.fullName.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-teal px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90 disabled:opacity-50 disabled:hover:bg-brand-teal"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? tc("saving") : t("updateButton")}
        </button>
        <Link
          href={`/students/${student.id}`}
          className="rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-brand-navy"
        >
          {tc("cancel")}
        </Link>
      </div>
    </form>
  );
}
