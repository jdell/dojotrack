"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CheckCircle2, Loader2, LogIn, Shield, Users } from "lucide-react";

interface StaffInviteProps {
  token: string;
  clubName: string;
  role: "ADMIN" | "INSTRUCTOR";
}

/**
 * Staff invitation acceptance flow. Unlike the student JoinForm, this requires
 * the invitee to be logged in first (they need a Supabase auth account).
 * Shows the role they've been invited as and a login/accept flow.
 */
export function StaffInvite({ token, clubName, role }: StaffInviteProps) {
  const t = useTranslations("Public.join");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");

  const RoleIcon = role === "ADMIN" ? Shield : Users;
  const roleLabel = role === "ADMIN" ? t("roleAdmin") : t("roleInstructor");

  async function handleAccept() {
    if (!name.trim()) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/invitations/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          setError(t("staffLoginRequired"));
        } else {
          throw new Error(data.error ?? t("errorComplete"));
        }
        return;
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorComplete"));
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="text-center">
        <CheckCircle2 size={44} className="mx-auto text-brand-teal" />
        <h2 className="mt-3 text-lg font-bold text-brand-navy">
          {t("staffSuccessTitle")}
        </h2>
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
          {t("staffSuccessBody", { club: clubName, role: roleLabel })}
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex rounded-lg bg-brand-teal px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          {t("goToDashboard")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-teal/10">
          <RoleIcon size={24} className="text-brand-teal" />
        </div>
        <div>
          <p className="eyebrow">{t("staffEyebrow")}</p>
          <h1 className="text-xl font-bold text-brand-navy">
            {t("staffHeading", { club: clubName })}
          </h1>
        </div>
      </div>

      <div className="rounded-lg border border-brand-teal/20 bg-brand-teal/5 px-4 py-3">
        <p className="text-sm font-medium text-brand-navy">
          {t("staffRoleLabel")}: <span className="text-brand-teal">{roleLabel}</span>
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          {role === "ADMIN" ? t("staffAdminDesc") : t("staffInstructorDesc")}
        </p>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
        <p className="text-sm text-amber-800">
          <LogIn size={14} className="inline mr-1.5 -mt-0.5" />
          {t("staffLoginNote")}
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
          {error === t("staffLoginRequired") && (
            <Link
              href="/login"
              className="mt-2 block font-semibold text-red-800 underline"
            >
              {t("staffLoginLink")}
            </Link>
          )}
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          {t("staffNameLabel")}
        </label>
        <input
          type="text"
          required
          placeholder={t("staffNamePlaceholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-teal"
        />
      </div>

      <button
        type="button"
        onClick={handleAccept}
        disabled={loading || !name.trim()}
        className="w-full rounded-lg bg-brand-teal py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 size={16} className="mx-auto animate-spin" />
        ) : (
          t("staffAcceptButton", { role: roleLabel })
        )}
      </button>
    </div>
  );
}
