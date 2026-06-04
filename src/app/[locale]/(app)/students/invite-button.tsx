"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy, LinkIcon, Loader2, Mail } from "lucide-react";

interface InviteButtonProps {
  /** Optional label for the unit being invited, e.g. a student's name. */
  unitLabel?: string;
  variant?: "primary" | "secondary";
  className?: string;
}

interface GeneratedInvite {
  link: string;
  whatsappUrl: string;
  whatsappText: string;
  emailed: boolean;
  email: string | null;
}

/**
 * Generates a single-use invitation link via the API, then surfaces it with
 * copy-to-clipboard and a pre-filled WhatsApp share link. Optionally takes an
 * email address — when given, the API emails the invite directly (see
 * src/lib/email.ts) in addition to returning the shareable link.
 */
export function InviteButton({
  unitLabel,
  variant = "secondary",
  className,
}: InviteButtonProps) {
  const t = useTranslations("Students");
  const tc = useTranslations("Common");
  const [loading, setLoading] = useState(false);
  const [invite, setInvite] = useState<GeneratedInvite | null>(null);
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setLoading(true);
    setError("");
    const trimmedEmail = email.trim();
    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unitLabel,
          email: trimmedEmail || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("errorInvite"));
      setInvite({
        link: data.link,
        whatsappUrl: data.whatsappUrl,
        whatsappText: data.whatsappText,
        emailed: Boolean(data.emailed),
        email: trimmedEmail || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorInvite"));
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!invite) return;
    try {
      await navigator.clipboard.writeText(invite.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(t("errorClipboard"));
    }
  }

  const base =
    variant === "primary"
      ? "bg-brand-teal text-white hover:bg-brand-teal/90"
      : "border border-border bg-card text-brand-navy hover:bg-muted/50";

  return (
    <div className={className}>
      {!invite ? (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5">
            <Mail size={14} className="text-muted-foreground" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("inviteEmailPlaceholder")}
              className="w-52 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <button
            type="button"
            onClick={generate}
            disabled={loading}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${base}`}
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : email.trim() ? (
              <Mail size={16} />
            ) : (
              <LinkIcon size={16} />
            )}
            {email.trim() ? t("sendInvite") : t("inviteViaLink")}
          </button>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
          {invite.emailed && invite.email && (
            <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-brand-teal">
              <Check size={14} /> {t("inviteEmailedTo", { email: invite.email })}
            </p>
          )}
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            {t("inviteShare")}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-md bg-muted/50 px-2.5 py-1.5 text-xs text-brand-navy">
              {invite.link}
            </code>
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold text-brand-navy transition-colors hover:bg-muted/50"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-brand-teal" /> {tc("copied")}
                </>
              ) : (
                <>
                  <Copy size={14} /> {tc("copy")}
                </>
              )}
            </button>
            <a
              href={invite.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md bg-[#25D366] px-2.5 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            >
              WhatsApp
            </a>
          </div>
          <button
            type="button"
            onClick={() => {
              setInvite(null);
              setEmail("");
            }}
            className="mt-2 text-xs text-muted-foreground hover:text-brand-navy"
          >
            {t("generateAnother")}
          </button>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
