import type { ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";
import { Logo } from "@/components/logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { createClient } from "@/lib/supabase/server";
import { getCurrentClub, getCurrentUser } from "@/lib/queries";
import { isPlatformAdmin } from "@/lib/auth-context";
import type { Role } from "@prisma/client";

export default async function AppLayout({ children }: { children: ReactNode }) {
  // Best-effort display of the signed-in user and club name. Route protection
  // itself lives in middleware (which redirects to /login when Supabase is
  // configured).
  let userName = "Instructor";
  if (process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http")) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userName =
        user?.user_metadata?.full_name ??
        user?.phone ??
        user?.email ??
        userName;
    } catch {
      // Ignore — fall back to the default label.
    }
  }

  const club = await getCurrentClub();
  const currentUser = await getCurrentUser();
  const userRole: Role = currentUser?.role ?? "OWNER";

  // Check platform admin status for the sidebar admin link.
  let isAdmin = false;
  if (process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http")) {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      isAdmin = isPlatformAdmin(user?.email, user?.phone);
    } catch {
      // Ignore
    }
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <Sidebar clubName={club?.name} userName={userName} userRole={userRole} isAdmin={isAdmin} />
      <div className="flex flex-1 flex-col min-w-0">
        <header className="md:hidden sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-background px-4">
          <Logo size={26} />
          <LanguageSwitcher variant="light" />
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
