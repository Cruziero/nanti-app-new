import { Link, useRouterState } from "@tanstack/react-router";
import { Plus, Sparkles, Sun, Inbox, Hourglass, FolderKanban, Users, Settings as Cog, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { useNanti } from "@/lib/nanti-store";
import { isOverdue, openItems } from "@/lib/nanti-utils";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";

const groups = [
  {
    label: "",
    items: [
      { to: "/app", label: "Tanya NANTI", icon: Sparkles, exact: true },
      { to: "/app/today", label: "Hari ini", icon: Sun },
    ],
  },
  {
    label: "Aksi",
    items: [
      { to: "/app/inbox", label: "Inbox", icon: Inbox },
      { to: "/app/waiting", label: "Menunggu", icon: Hourglass },
    ],
  },
  {
    label: "Konteks",
    items: [
      { to: "/app/projects", label: "Proyek", icon: FolderKanban },
      { to: "/app/people", label: "Orang", icon: Users },
    ],
  },
] as const;

const mobileNav = [
  { to: "/app", label: "AI", icon: Sparkles, exact: true },
  { to: "/app/today", label: "Hari ini", icon: Sun },
  { to: "/app/inbox", label: "Inbox", icon: Inbox },
  { to: "/app/waiting", label: "Menunggu", icon: Hourglass },
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
      }
    : {};

  const isActive = (to: string, exact?: boolean) =>
    exact ? path === to || path === `${to}/` : path.startsWith(to);

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-[248px] flex-col border-r border-sidebar-border bg-sidebar px-3 py-5 lg:flex">
        <div className="px-2.5 pb-7">
          <Logo />
        </div>

        <Link
          to="/app/import"
          className="mb-6 flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5 text-[13.5px] font-semibold transition-colors hover:border-primary/40 hover:bg-accent"
        >
          <span className="flex size-5 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Plus className="size-3.5" />
          </span>
          Impor percakapan
        </Link>

        <nav className="flex-1 space-y-6">
          {groups.map((group, gi) => (
            <div key={group.label || gi}>
              {group.label && (
                <p className="mb-1.5 px-2.5 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((n) => {
                  const active = isActive(n.to, "exact" in n ? n.exact : false);
                  const count = counts[n.to];
                  return (
                    <Link
                      key={n.to}
                      to={n.to}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] font-medium transition-colors",
                        active
                          ? "bg-sidebar-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                      )}
                    >
                      <n.icon className="size-4" />
                      <span className="flex-1">{n.label}</span>
                      {!!count && (
                        <span className="rounded-full bg-surface-strong px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                          {count}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <Link
          to="/app/settings"
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] font-medium transition-colors",
            path.startsWith("/app/settings")
              ? "bg-sidebar-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground",
          )}
        >
          <Cog className="size-4" /> Pengaturan
        </Link>

        {user && (
          <div className="mt-4 border-t border-sidebar-border pt-4">
            <div className="px-2.5">
              <p className="truncate text-[12px] text-muted-foreground">{user.email}</p>
            </div>
            <button
              onClick={() => signOut()}
              className="mt-2 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <LogOut className="size-4" /> Keluar
            </button>
          </div>
        )}
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/85 px-4 py-3 backdrop-blur lg:hidden">
        <Logo />
        <Link
          to="/app/import"
          className="rounded-lg bg-primary px-3 py-1.5 text-[13px] font-semibold text-primary-foreground"
        >
          Impor
        </Link>
      </header>

      <main className="pb-24 lg:pb-16 lg:pl-[248px]">
        <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-8 sm:py-12">{children}</div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {mobileNav.map((n) => {
          const active = isActive(n.to, "exact" in n ? n.exact : false);
          return (
            <Link
              key={n.to}
              to={n.to}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <n.icon className="size-[18px]" />
              {n.label}
            </Link>
          );
        })}
      </nav>

      <Link
        aria-label="Impor percakapan"
        to="/app/import"
        className="fixed bottom-20 right-4 z-30 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lift transition-transform active:scale-95 lg:hidden"
      >
        <Plus className="size-5" />
      </Link>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-[27px] font-semibold tracking-tight sm:text-[32px]">{title}</h1>
        {subtitle && <p className="mt-1.5 text-[14px] text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Section({ title, count, children }: { title: string; count?: number; children: ReactNode }) {
  return (
    <section className="mb-9">
      <div className="mb-2 flex items-center gap-2 px-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{title}</h2>
        {count !== undefined && <span className="text-[11px] text-muted-foreground/70">{count}</span>}
      </div>
      <div className="space-y-0.5">{children}</div>
    </section>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border px-6 py-10 text-center">
      <p className="text-[14px] font-medium text-foreground">{title}</p>
      {hint && <p className="mt-1 text-[13px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
