import { Link, useRouterState } from "@tanstack/react-router";
import {
  Plus,
  MessageSquare,
  CalendarDays,
  Inbox,
  Hourglass,
  Settings,
  LogOut,
  ListTodo,
  Link2,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useNanti } from "@/lib/nanti-store";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";

const destinations = [
  { to: "/app/today", label: "Today", icon: CalendarDays },
  { to: "/app/inbox", label: "Inbox", icon: Inbox },
  { to: "/app/today", label: "Tasks", icon: ListTodo, view: "all" },
  { to: "/app/waiting", label: "Waiting for", icon: Hourglass },
  { to: "/app", label: "NANTI AI", icon: MessageSquare },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { items, hydrated, settings } = useNanti();
  const { user, signOut } = useSupabaseAuth();
  const location = useRouterState({ select: (state) => state.location });
  const [leaving, setLeaving] = useState(false);
  const inbox = hydrated ? items.filter((i) => i.status === "inbox").length : 0;
  const allTasks = (location.search as { view?: string }).view === "all";
  const active = (label: string, to: string) =>
    label === "Tasks"
      ? location.pathname === to && allTasks
      : label === "Today"
        ? location.pathname === to && !allTasks
        : location.pathname.replace(/\/$/, "") === to;
  const logout = async () => {
    setLeaving(true);
    try {
      await signOut();
    } catch {
      toast.error("Couldn’t sign out. Please try again.");
    } finally {
      setLeaving(false);
    }
  };
  return (
    <div className="nanti-workspace min-h-screen bg-background text-foreground">
      <a
        href="#workspace-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-background focus:p-3"
      >
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 hidden w-[224px] flex-col border-r border-border bg-sidebar px-4 py-8 lg:flex">
        <Link to="/app/today" className="px-3 font-serif text-3xl font-semibold text-primary">
          NANTI
        </Link>
        <p className="mb-8 mt-4 break-words px-3 text-sm text-muted-foreground">
          {settings.name ? `${settings.name}’s workspace` : "Your workspace"}
        </p>
        <nav aria-label="Main navigation" className="space-y-2">
          {destinations.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              search={"view" in item ? { view: "all" } : { view: undefined }}
              aria-current={active(item.label, item.to) ? "page" : undefined}
              className={cn(
                "flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm transition-colors",
                active(item.label, item.to)
                  ? "bg-primary font-medium text-primary-foreground"
                  : "text-foreground hover:bg-sidebar-accent",
              )}
            >
              <item.icon aria-hidden="true" className="size-5 shrink-0" />
              <span>{item.label}</span>
              {item.label === "Inbox" && inbox > 0 && (
                <span className="ml-auto text-xs">{inbox}</span>
              )}
            </Link>
          ))}
        </nav>
        <div className="mt-8 space-y-2 border-t border-border pt-5">
          <Link
            to="/app/today"
            hash="connections"
            className="flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm hover:bg-sidebar-accent"
          >
            <Link2 aria-hidden="true" className="size-5" />
            Integrations
          </Link>
          <Link
            to="/app/settings"
            className="flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm hover:bg-sidebar-accent"
            aria-current={location.pathname === "/app/settings" ? "page" : undefined}
          >
            <Settings aria-hidden="true" className="size-5" />
            Settings
          </Link>
        </div>
        <div className="mt-auto pt-10">
          <p className="px-3 text-xs leading-6 text-muted-foreground">
            A place for everything
            <br />
            you need to remember.
          </p>
          {user && (
            <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
              <span className="min-w-0 flex-1 truncate px-2 text-xs text-muted-foreground">
                {user.email}
              </span>
              <button
                aria-label="Sign out"
                disabled={leaving}
                onClick={() => void logout()}
                className="flex size-11 items-center justify-center rounded-lg hover:bg-secondary disabled:opacity-50"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background px-4 py-2 lg:hidden">
        <Link to="/app/today" className="font-serif text-2xl font-semibold text-primary">
          NANTI
        </Link>
        <div className="flex gap-2">
          <Link
            to="/app/today"
            search={{ view: "all" }}
            className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm hover:bg-secondary"
          >
            All tasks
          </Link>
          <Link
            to="/app/settings"
            aria-label="Settings"
            className="flex size-11 items-center justify-center rounded-lg hover:bg-secondary"
          >
            <Settings className="size-5" />
          </Link>
        </div>
      </header>
      <main
        id="workspace-content"
        className="pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-12 lg:pl-[224px]"
      >
        <div
          className={cn(
            "mx-auto w-full px-4 py-7 sm:px-8 sm:py-10 xl:px-10",
            location.pathname === "/app/today" ? "max-w-[1440px]" : "max-w-4xl",
          )}
        >
          {children}
        </div>
      </main>
      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-30 flex justify-around gap-1 border-t border-border bg-background px-2 pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {[
          destinations[0],
          destinations[1],
          { to: "/app/import", label: "Import", icon: Plus },
          destinations[3],
          destinations[4],
        ].map((item) => (
          <Link
            key={item.label}
            to={item.to}
            search={{ view: undefined }}
            aria-current={active(item.label, item.to) ? "page" : undefined}
            className={cn(
              "flex min-h-16 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg text-[11px]",
              active(item.label, item.to) ? "font-semibold text-primary" : "text-muted-foreground",
            )}
          >
            <item.icon aria-hidden="true" className="size-5" />
            {item.label === "Waiting for"
              ? "Waiting"
              : item.label === "NANTI AI"
                ? "Ask"
                : item.label}
          </Link>
        ))}
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
