import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin-sidebar";
import { getAuthUser, isPlatformAdmin } from "@/lib/auth-context";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getAuthUser();
  if (!user || !isPlatformAdmin(user.email, user.phone)) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <AdminSidebar adminEmail={user.email ?? "Admin"} />
      <div className="flex flex-1 flex-col min-w-0">
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
