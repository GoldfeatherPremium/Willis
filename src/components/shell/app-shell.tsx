"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Building2,
  Sparkles,
  FileText,
  FolderOpen,
  Users,
  Settings,
  CreditCard,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/brand/icon";
import { Avatar } from "@/components/ui/avatar";
import type { UserHome } from "@/lib/types/database";

interface ShellProps {
  user: { id: string; email?: string | null };
  profile: { full_name: string | null; avatar_url: string | null } | null;
  homes: UserHome[];
  children: React.ReactNode;
}

const NAV = [
  { href: "/app", label: "Overview", icon: Home },
  { href: "/app/homes", label: "My Homes", icon: Building2 },
  { href: "/app/assistant", label: "AI Assistant", icon: Sparkles },
  { href: "/app/documents", label: "Documents", icon: FileText },
  { href: "/app/reports", label: "Reports", icon: FolderOpen },
  { href: "/app/family", label: "Family", icon: Users }
];

const NAV_BOTTOM = [
  { href: "/app/settings", label: "Settings", icon: Settings },
  { href: "/app/billing", label: "Billing", icon: CreditCard }
];

export function AppShell({ user, profile, homes, children }: ShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function signOutNav() {
    await signOut();
  }

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
      {NAV.map((item) => {
        const active = item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active ? "bg-accent-soft text-accent" : "text-secondary hover:bg-surface hover:text-primary"
            )}
          >
            <item.icon className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
            {item.label}
          </Link>
        );
      })}
      <div className="mt-4 border-t border-border pt-4">
        {NAV_BOTTOM.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-accent-soft text-accent" : "text-secondary hover:bg-surface hover:text-primary"
              )}
            >
              <item.icon style={{ width: 18, height: 18 }} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-dvh bg-bg">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-bg-secondary/40 lg:flex">
        <div className="flex items-center gap-2 px-5 py-5">
          <Icon className="h-7 w-7" />
          <span className="font-display text-base font-bold tracking-tight text-primary">HomeAtlas</span>
        </div>
        {nav}
        <div className="border-t border-border p-3">
          <button
            onClick={signOutNav}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-secondary transition-colors hover:bg-surface hover:text-primary"
          >
            <LogOut style={{ width: 18, height: 18 }} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-border bg-bg-secondary">
            <div className="flex items-center justify-between px-5 py-5">
              <div className="flex items-center gap-2">
                <Icon className="h-7 w-7" />
                <span className="font-display text-base font-bold text-primary">HomeAtlas</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="rounded-lg p-1 text-secondary hover:text-primary">
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-bg/80 px-4 py-3 backdrop-blur-md sm:px-6">
          <button
            className="rounded-lg border border-border p-2 text-secondary hover:text-primary lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/app" className="flex items-center gap-2 lg:hidden">
            <Icon className="h-6 w-6" />
          </Link>
          <div className="flex flex-1 items-center justify-end gap-3">
            {homes.length > 0 && (
              <Link
                href={`/app/homes/${homes[0]!.home_id}/rooms`}
                className="hidden rounded-xl border border-border bg-surface px-3.5 py-2 text-sm font-medium text-primary transition-colors hover:bg-surface-hover sm:inline-flex"
              >
                New scan
              </Link>
            )}
            <Avatar name={profile?.full_name ?? user.email ?? "User"} src={profile?.avatar_url} />
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
