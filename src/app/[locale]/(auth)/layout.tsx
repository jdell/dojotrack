import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/logo";
import { BRAND } from "@/lib/constants";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Branded panel */}
      <div className="relative hidden flex-col items-center justify-center gap-6 overflow-hidden bg-gradient-to-br from-brand-teal to-brand-navy p-12 text-center text-white lg:flex">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -right-16 h-80 w-80 rounded-full bg-white/5" />
        <Link href="/" className="relative">
          <Logo size={56} inverted />
        </Link>
        <div className="relative space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">{BRAND.name}</h2>
          <p className="mx-auto max-w-xs text-sm leading-relaxed text-white/70">
            {BRAND.tagline}
          </p>
        </div>
      </div>

      {/* Form area */}
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 lg:min-h-0">
        {children}
      </div>
    </main>
  );
}
