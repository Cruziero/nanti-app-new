import { Link, useRouterState } from "@tanstack/react-router";
import {
  Plus,
  Sparkles,
  Sun,
  Inbox,
  Hourglass,
  Settings as Cog,
  LogOut,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { NotificationCenter } from "./notification-center";
import { useNanti } from "@/lib/nanti-store";
import { isOverdue, openItems } from "@/lib/nanti-utils";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";

const navGroups = [
  {
    label: "NANTI",
    items: [
      { to: "/app/today", label: "Today", icon: Sun },
      { to: "/app", label: "Ask NANTI", icon: Sparkles, exact: true },
      { to: "/app/inbox", label: "Inbox", icon: Inbox, countKey: "/app/inbox" },
      { to: "/app/waiting", label: "Waiting", icon: Hourglass, countKey: "/app/waiting" },
    ],
  },
] as const;

const mobileNav = [
  { to: "/app/today", label: "Today", icon: Sun },
  { to: "/app", label: "Ask", icon: Sparkles, exact: true },
  { to: "__plus__", label: "", icon: Plus },
  { to: "/app/waiting", label: "Waiting", icon: Hourglass },
  { to: "/app/inbox", label: "Inbox", icon: Inbox },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { items, hydrated } = useNanti();
  const { user, signOut } = useSupabaseAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });

  const counts: Record<string, number> = hydrated
    ? {
        "/app/inbox": items.filter((i) => i.status === "inbox").length,
        "/app/waiting": openItems(items).filter((i) => i.kind === "waiting").length,
        "/app/today": items.filter(isOverdue).length,
        "/app/reminders": openItems(items).filter((i) => i.reminderEnabled).length,
      }
    : {};

  const isActive = (to: string, exact?: boolean) =>
    exact ? path === to || path === `${to}/` : path.startsWith(to);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-[200px] flex-col border-r border-border bg-sidebar lg:flex">
        <div className="flex items-center gap-2 px-4 py-4">
          <Logo />
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-5">
              <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/60">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((n) => {
                  const active = isActive(n.to, "exact" in n ? n.exact : false);
                  const count = "countKey" in n ? counts[n.countKey] : undefined;
                  return (
                    <Link
                      key={n.to}
                      to={n.to}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-1.5 text-[12.5px] font-medium transition-colors",
                        active
                          ? "bg-sidebar-accent text-foreground"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                      )}
                    >
                      <n.icon className="size-4 shrink-0" />
                      <span className="flex-1">{n.label}</span>
                      {!!count && count > 0 && (
                        <span className="text-[11px] text-muted-foreground/70">{count}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-border px-3 py-3">
          <Link
            to="/app/import"
            className="flex items-center gap-2.5 rounded-md bg-primary/10 px-2.5 py-2 text-[13px] font-medium text-primary transition-colors hover:bg-primary/20"
          >
            <Plus className="size-4" /> Bring to NANTI
          </Link>
          <Link
            to="/app/settings"
            className={cn(
              "mt-1 flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors",
              path.startsWith("/app/settings")
                ? "bg-sidebar-accent text-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <Cog className="size-4" /> Settings
          </Link>
          {user && (
            <div className="mt-2 flex items-center gap-2.5 px-2.5 py-1.5">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                {(user.email ?? "U")[0].toUpperCase()}
              </div>
              <span className="flex-1 truncate text-[12px] text-muted-foreground">
                {user.email}
              </span>
              <button
                onClick={() => signOut()}
                className="text-muted-foreground/50 transition-colors hover:text-muted-foreground"
              >
                <LogOut className="size-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/90 px-4 py-2.5 backdrop-blur-sm lg:hidden">
        <Logo />
        <NotificationCenter notifications={[]} onMarkRead={() => {}} />
      </header>

      {/* Main content */}
      <main className="pb-24 lg:pb-8 lg:pl-[200px]">
        <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm lg:hidden">
        {mobileNav.map((n) => {
          if (n.to === "__plus__") {
            return (
              <Link
                key="plus"
                to="/app/import"
                className="flex -mt-4 size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
              >
                <Plus className="size-5" />
              </Link>
            );
          }
          const active = isActive(n.to, "exact" in n ? n.exact : false);
          return (
            <Link
              key={n.to}
              to={n.to}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <n.icon className="size-[18px]" />
              {n.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-[20px] font-semibold tracking-tight sm:text-[24px]">{title}</h1>
        {subtitle && <p className="mt-0.5 text-[12.5px] text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Section({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: ReactNode;
}) {
  return (
    <section className="mb-6">
      <div className="mb-1 flex items-center gap-1.5 px-1">
        <h2 className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/60">
          {title}
        </h2>
        {count !== undefined && (
          <span className="text-[10.5px] text-muted-foreground/40">{count}</span>
        )}
      </div>
      <div className="divide-y divide-border">{children}</div>
    </section>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="px-1 py-10 text-center">
      <p className="text-[13px] font-medium text-foreground">{title}</p>
      {hint && <p className="mt-0.5 text-[12px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
