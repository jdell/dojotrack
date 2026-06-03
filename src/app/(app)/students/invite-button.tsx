"use client";

import { useState } from "react";
import { Check, Copy, LinkIcon, Loader2 } from "lucide-react";

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
}

/**
 * Generates a single-use invitation link via the API, then surfaces it with
 * copy-to-clipboard and a pre-filled WhatsApp share link. Used on the roster
 * to invite a new student without manually entering their details.
 */
export function InviteButton({
  unitLabel,
  variant = "secondary",
  className,
}: InviteButtonProps) {
  const [loading, setLoading] = useState(false);
  const [invite, setInvite] = useState<GeneratedInvite | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unitLabel }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error ?? "Could not create the invite.");
      setInvite({
        link: data.link,
        whatsappUrl: data.whatsappUrl,
        whatsappText: data.whatsappText,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create invite.");
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
      setError("Couldn't access the clipboard — copy the link manually.");
    }
  }

  const base =
    variant === "primary"
      ? "bg-brand-teal text-white hover:bg-brand-teal/90"
      : "border border-border bg-card text-brand-navy hover:bg-muted/50";

  return (
    <div className={className}>
      {!invite ? (
        <button
          type="button"
          onClick={generate}
          disabled={loading}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${base}`}
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <LinkIcon size={16} />
          )}
          Invite via link
        </button>
      ) : (
        <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Share this link to invite a student:
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
                  <Check size={14} className="text-brand-teal" /> Copied
                </>
              ) : (
                <>
                  <Copy size={14} /> Copy
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
            onClick={() => setInvite(null)}
            className="mt-2 text-xs text-muted-foreground hover:text-brand-navy"
          >
            Generate another
          </button>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
