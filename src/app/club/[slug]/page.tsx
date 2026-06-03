import type { Metadata } from "next";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { Logo } from "@/components/logo";

/** Turn a slug like "gracie-barra-downtown" into "Gracie Barra Downtown". */
function humanize(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const name = humanize(slug);
  return {
    title: `${name} — DojoTrack`,
    description: `${name} on DojoTrack.`,
  };
}

export default async function ClubPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const name = humanize(slug) || "Club";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-teal text-2xl font-bold text-white">
              {name.charAt(0)}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-brand-navy">{name}</h1>
              <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                <MapPin size={14} /> Location coming soon
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <div className="mb-3 text-4xl">🥋</div>
          <h2 className="text-lg font-bold text-brand-navy">
            This club page is coming soon
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Class schedules, disciplines, and a sign-up form will live here once{" "}
            <span className="font-medium text-brand-navy">{name}</span> finishes
            setting up its public profile.
          </p>
          <Link
            href="/register"
            className="mt-6 inline-flex rounded-lg bg-brand-teal px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Run your own club on DojoTrack
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4">
          <Link href="/" className="flex items-center">
            <Logo size={24} />
          </Link>
          <p className="text-xs text-slate-400">Powered by DojoTrack</p>
        </div>
      </footer>
    </div>
  );
}
