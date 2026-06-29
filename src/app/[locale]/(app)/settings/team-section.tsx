"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Plus, Trash2 } from "lucide-react";
import type { TeamMember } from "@/lib/queries";
import type { Role } from "@prisma/client";
import { initials } from "@/lib/utils";

const ASSIGNABLE_ROLES: { value: Role; labelKey: string }[] = [
  { value: "ADMIN", labelKey: "roleAdmin" },
  { value: "INSTRUCTOR", labelKey: "roleInstructor" },
  { value: "STUDENT", labelKey: "roleStudent" },
];

const INVITE_ROLES: { value: "ADMIN" | "INSTRUCTOR"; labelKey: string }[] = [
  { value: "ADMIN", labelKey: "roleAdmin" },
  { value: "INSTRUCTOR", labelKey: "roleInstructor" },
];

interface TeamSectionProps {
  members: TeamMember[];
  currentUserId: string;
  currentUserRole: Role;
}

export function TeamSection({
  members: initialMembers,
  currentUserId,
  currentUserRole,
}: TeamSectionProps) {
  const t = useTranslations("Team");
  const [members, setMembers] = useState(initialMembers);
  const [changingRole, setChangingRole] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteContact, setInviteContact] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "INSTRUCTOR">("INSTRUCTOR");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);

  const isOwner = currentUserRole === "OWNER";
  const isAdmin = currentUserRole === "ADMIN";
  const canManage = isOwner || isAdmin;

  async function handleChangeRole(userId: string, newRole: Role) {
    setChangingRole(userId);
    try {
      const res = await fetch(`/api/team/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? t("errorChangeRole"));
        return;
      }
      const { member } = await res.json();
      setMembers((prev) =>
        prev.map((m) => (m.id === userId ? { ...m, ...member } : m)),
      );
    } catch {
      alert(t("errorChangeRole"));
    } finally {
      setChangingRole(null);
    }
  }

  async function handleRemove(userId: string, name: string | null) {
    if (!confirm(t("confirmRemove", { name: name ?? "?" }))) return;
    setRemoving(userId);
    try {
      const res = await fetch(`/api/team/${userId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? t("errorRemove"));
        return;
      }
      setMembers((prev) => prev.filter((m) => m.id !== userId));
    } catch {
      alert(t("errorRemove"));
    } finally {
      setRemoving(null);
    }
  }

  async function handleInvite() {
    if (!inviteContact.trim()) return;
    setInviting(true);
    setInviteMsg(null);
    try {
      const isEmail = inviteContact.includes("@");
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: inviteRole,
          ...(isEmail
            ? { email: inviteContact.trim() }
            : { recipientName: inviteContact.trim() }),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setInviteMsg(data.error ?? t("errorInvite"));
        return;
      }
      setInviteMsg(t("inviteSent"));
      setInviteContact("");
      setShowInvite(false);
    } catch {
      setInviteMsg(t("errorInvite"));
    } finally {
      setInviting(false);
    }
  }

  function roleLabel(role: Role): string {
    const map: Record<Role, string> = {
      OWNER: t("roleOwner"),
      ADMIN: t("roleAdmin"),
      INSTRUCTOR: t("roleInstructor"),
      STUDENT: t("roleStudent"),
      PARENT: t("roleParent"),
    };
    return map[role] ?? role;
  }

  /** Which roles the current user can assign to a given target. */
  function assignableRoles(targetRole: Role): { value: Role; labelKey: string }[] {
    // ADMIN cannot change OWNER role.
    if (!isOwner && targetRole === "OWNER") return [];
    // Only OWNER can assign OWNER.
    const base = isOwner
      ? [{ value: "OWNER" as Role, labelKey: "roleOwner" }, ...ASSIGNABLE_ROLES]
      : ASSIGNABLE_ROLES;
    return base;
  }

  function canRemoveMember(member: TeamMember): boolean {
    if (!canManage) return false;
    // Cannot remove self.
    if (member.id === currentUserId) return false;
    // ADMIN cannot remove OWNER or other ADMIN.
    if (isAdmin && (member.role === "OWNER" || member.role === "ADMIN")) return false;
    return true;
  }

  function canChangeRole(member: TeamMember): boolean {
    if (!canManage) return false;
    // ADMIN cannot change OWNER role.
    if (isAdmin && member.role === "OWNER") return false;
    return true;
  }

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-brand-navy">{t("title")}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => setShowInvite(!showInvite)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-teal px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Plus size={16} />
            {t("inviteStaff")}
          </button>
        )}
      </div>

      {/* Invite form */}
      {showInvite && canManage && (
        <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-brand-navy">
                {t("inviteEmailPlaceholder")}
              </label>
              <input
                type="text"
                value={inviteContact}
                onChange={(e) => setInviteContact(e.target.value)}
                placeholder={t("inviteEmailPlaceholder")}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-brand-navy">
                {t("selectRole")}
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as "ADMIN" | "INSTRUCTOR")}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                {INVITE_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {t(r.labelKey)}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleInvite}
              disabled={inviting || !inviteContact.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-navy px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {inviting && <Loader2 size={14} className="animate-spin" />}
              {t("sendInvite")}
            </button>
          </div>
          {inviteMsg && (
            <p className="mt-2 text-sm text-muted-foreground">{inviteMsg}</p>
          )}
        </div>
      )}

      {/* Members list */}
      <div className="mt-4 divide-y divide-border">
        {members.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t("noTeamMembers")}
          </p>
        ) : (
          members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
            >
              {/* Avatar */}
              {member.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={member.photoUrl}
                  alt={member.fullName ?? ""}
                  className="h-10 w-10 shrink-0 rounded-full border border-border object-cover"
                />
              ) : (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-teal/10 text-sm font-semibold text-brand-teal">
                  {initials(member.fullName ?? "?")}
                </span>
              )}

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-brand-navy">
                  {member.fullName ?? "-"}
                  {member.id === currentUserId && (
                    <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>
                  )}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {member.email ?? member.phone ?? "-"}
                </p>
              </div>

              {/* Role */}
              {canChangeRole(member) ? (
                <div className="relative">
                  <select
                    value={member.role}
                    onChange={(e) =>
                      handleChangeRole(member.id, e.target.value as Role)
                    }
                    disabled={changingRole === member.id}
                    className="rounded-md border border-border bg-background px-2 py-1 text-xs font-medium"
                  >
                    {assignableRoles(member.role).map((r) => (
                      <option key={r.value} value={r.value}>
                        {t(r.labelKey)}
                      </option>
                    ))}
                  </select>
                  {changingRole === member.id && (
                    <Loader2
                      size={12}
                      className="absolute -right-5 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground"
                    />
                  )}
                </div>
              ) : (
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-brand-navy">
                  {roleLabel(member.role)}
                </span>
              )}

              {/* Remove */}
              {canRemoveMember(member) && (
                <button
                  type="button"
                  onClick={() => handleRemove(member.id, member.fullName)}
                  disabled={removing === member.id}
                  className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
                  title={t("removeFromClub")}
                >
                  {removing === member.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
