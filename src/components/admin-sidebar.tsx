"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  LayoutDashboard,
  Settings,
} from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";

interface NavItem {
  key: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  matches: (pathname: string) => boolean;
}

const ADMIN_NAV: NavItem[] = [
  {
    key: "dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    matches: (p) => p === "/admin",
  },
  {
    key: "clubs",
    href: "/admin/clubs",
    icon: Building2,
    matches: (p) => p.startsWith("/admin/clubs"),
  },
  {
    key: "revenue",
    href: "/admin",
    icon: DollarSign,
    matches: () => false, // placeholder — not yet implemented
  },
  {
    key: "settings",
    href: "/admin",
    icon: Settings,
    matches: () => false, // placeholder
  },
];

interface AdminSidebarProps {
  adminEmail?: string;
}

export function AdminSidebar({ adminEmail = "Admin" }: AdminSidebarProps) {
  const pathname = usePathname();
  const t = useTranslations("Admin");
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden md:flex h-screen sticky top-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex items-center justify-between gap-2 px-3 h-14 border-b border-sidebar-border">
        {collapsed ? (
          <Logo size={28} showWordmark={false} className="mx-auto" />
        ) : (
          <Logo size={28} />
        )}
        <button
          type="button"
          aria-label={collapsed ? "Expand" : "Collapse"}
          onClick={() => setCollapsed((c) => !c)}
          className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {!collapsed && (
        <div className="px-4 pt-3 pb-1">
          <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
            {t("platformAdmin")}
          </p>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto py-3">
        <ul className="space-y-1 px-2">
          {ADMIN_NAV.map((item) => {
            const Icon = item.icon;
            const active = item.matches(pathname);
            const label = t(item.key);
            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-brand-teal text-white"
                      : "text-brand-navy hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    collapsed && "justify-center px-2",
                  )}
                  title={collapsed ? label : undefined}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon size={18} className="shrink-0" />
                  {!collapsed && <span>{label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-sidebar-border px-4 py-3">
        {!collapsed && (
          <Link
            href="/dashboard"
            className="text-xs text-muted-foreground hover:text-brand-navy transition-colors"
          >
            {t("backToApp")}
          </Link>
        )}
      </div>

      <div
        className={cn(
          "border-t border-sidebar-border p-3 text-xs text-muted-foreground",
          collapsed && "text-center",
        )}
      >
        {collapsed ? "·" : adminEmail}
      </div>
    </aside>
  );
}
