"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Award,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  Settings,
  Swords,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  matches: (pathname: string) => boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    matches: (p) => p === "/" || p.startsWith("/dashboard"),
  },
  {
    label: "Students",
    href: "/students",
    icon: Users,
    matches: (p) => p.startsWith("/students"),
  },
  {
    label: "Classes",
    href: "/classes",
    icon: Calendar,
    matches: (p) => p.startsWith("/classes"),
  },
  {
    label: "Belts",
    href: "/belts",
    icon: Award,
    matches: (p) => p.startsWith("/belts"),
  },
  {
    label: "Payments",
    href: "/payments",
    icon: CreditCard,
    matches: (p) => p.startsWith("/payments"),
  },
  {
    label: "Competitions",
    href: "/competitions",
    icon: Trophy,
    matches: (p) => p.startsWith("/competitions"),
  },
  {
    label: "Sparring",
    href: "/sparring",
    icon: Swords,
    matches: (p) => p.startsWith("/sparring"),
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    matches: (p) => p.startsWith("/settings"),
  },
];

interface SidebarProps {
  clubName?: string;
  userName?: string;
}

export function Sidebar({
  clubName = "Your Dojo",
  userName = "Instructor",
}: SidebarProps) {
  const pathname = usePathname();
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
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setCollapsed((c) => !c)}
          className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {!collapsed && (
        <div className="px-4 pt-3 pb-1">
          <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
            Club
          </p>
          <p className="truncate text-sm font-semibold text-brand-navy">
            {clubName}
          </p>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto py-3">
        <ul className="space-y-1 px-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = item.matches(pathname);
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
                  title={collapsed ? item.label : undefined}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon size={18} className="shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div
        className={cn(
          "border-t border-sidebar-border p-3 text-xs text-muted-foreground",
          collapsed && "text-center",
        )}
      >
        {collapsed ? "·" : `Signed in as ${userName}`}
      </div>
    </aside>
  );
}
