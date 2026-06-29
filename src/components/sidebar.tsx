"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Award,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  Settings,
  Shield,
  Swords,
  Trophy,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { LanguageSwitcher } from "./language-switcher";
import type { Role } from "@prisma/client";

interface NavItem {
  /** Key under the `Nav` message namespace. */
  key: string;
  href: string;
  icon: LucideIcon;
  matches: (pathname: string) => boolean;
}

/** Full nav for owners and instructors. */
const ADMIN_NAV_ITEMS: NavItem[] = [
  {
    key: "dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    matches: (p) => p === "/" || p.startsWith("/dashboard"),
  },
  {
    key: "students",
    href: "/students",
    icon: Users,
    matches: (p) => p.startsWith("/students"),
  },
  {
    key: "classes",
    href: "/classes",
    icon: Calendar,
    matches: (p) => p.startsWith("/classes"),
  },
  {
    key: "belts",
    href: "/belts",
    icon: Award,
    matches: (p) => p.startsWith("/belts"),
  },
  {
    key: "payments",
    href: "/payments",
    icon: CreditCard,
    matches: (p) => p.startsWith("/payments"),
  },
  {
    key: "competitions",
    href: "/competitions",
    icon: Trophy,
    matches: (p) => p.startsWith("/competitions"),
  },
  {
    key: "sparring",
    href: "/sparring",
    icon: Swords,
    matches: (p) => p.startsWith("/sparring"),
  },
  {
    key: "settings",
    href: "/settings",
    icon: Settings,
    matches: (p) => p.startsWith("/settings"),
  },
];

/** Nav for instructors — no payments, competitions, or sparring. */
const INSTRUCTOR_NAV_ITEMS: NavItem[] = [
  {
    key: "dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    matches: (p) => p === "/" || p.startsWith("/dashboard"),
  },
  {
    key: "classes",
    href: "/classes",
    icon: Calendar,
    matches: (p) => p.startsWith("/classes"),
  },
  {
    key: "students",
    href: "/students",
    icon: Users,
    matches: (p) => p.startsWith("/students"),
  },
  {
    key: "belts",
    href: "/belts",
    icon: Award,
    matches: (p) => p.startsWith("/belts"),
  },
  {
    key: "settings",
    href: "/settings",
    icon: Settings,
    matches: (p) => p.startsWith("/settings"),
  },
];

/** Simplified nav for students and parents. */
const STUDENT_NAV_ITEMS: NavItem[] = [
  {
    key: "myProfile",
    href: "/my",
    icon: User,
    matches: (p) => p === "/my" || p.startsWith("/my/"),
  },
  {
    key: "classes",
    href: "/classes",
    icon: Calendar,
    matches: (p) => p.startsWith("/classes"),
  },
  {
    key: "settings",
    href: "/settings",
    icon: Settings,
    matches: (p) => p.startsWith("/settings"),
  },
];

interface SidebarProps {
  clubName?: string;
  userName?: string;
  userRole?: Role;
  isAdmin?: boolean;
}

export function Sidebar({
  clubName = "Your Dojo",
  userName = "Instructor",
  userRole = "OWNER",
  isAdmin = false,
}: SidebarProps) {
  const pathname = usePathname();
  const t = useTranslations("Nav");
  const [collapsed, setCollapsed] = useState(false);

  const isStudentRole = userRole === "STUDENT" || userRole === "PARENT";
  const isInstructor = userRole === "INSTRUCTOR";
  const navItems = isStudentRole ? STUDENT_NAV_ITEMS : isInstructor ? INSTRUCTOR_NAV_ITEMS : ADMIN_NAV_ITEMS;

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
          aria-label={collapsed ? t("expandSidebar") : t("collapseSidebar")}
          onClick={() => setCollapsed((c) => !c)}
          className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {!collapsed && (
        <div className="px-4 pt-3 pb-1">
          <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
            {t("club")}
          </p>
          <p className="truncate text-sm font-semibold text-brand-navy">
            {clubName}
          </p>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto py-3">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.matches(pathname);
            const label = t(item.key);
            return (
              <li key={item.href}>
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

      {isAdmin && (
        <div className="px-2 pb-1">
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition-colors text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              collapsed && "justify-center px-2",
            )}
            title={collapsed ? "Admin" : undefined}
          >
            <Shield size={16} className="shrink-0" />
            {!collapsed && <span>Admin</span>}
          </Link>
        </div>
      )}

      {!collapsed && (
        <div className="border-t border-sidebar-border px-2 py-2">
          <LanguageSwitcher variant="dark" />
        </div>
      )}

      <div
        className={cn(
          "border-t border-sidebar-border p-3 text-xs text-muted-foreground",
          collapsed && "text-center",
        )}
      >
        {collapsed ? "·" : t("signedInAs", { name: userName })}
      </div>
    </aside>
  );
}
