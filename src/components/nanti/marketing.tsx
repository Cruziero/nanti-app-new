import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { SiteFooter } from "./footer";

const accentStyles = {
  emerald: "bg-[var(--accent-emerald-bg)] text-[var(--accent-emerald)]",
  teal: "bg-[var(--accent-teal-bg)] text-[var(--accent-teal)]",
  lime: "bg-[var(--accent-lime-bg)] text-[var(--accent-lime)]",
  mint: "bg-[var(--accent-mint-bg)] text-[var(--accent-mint)]",
  forest: "bg-[var(--accent-forest-bg)] text-[var(--accent-forest)]",
} as const;

export type AccentColor = keyof typeof accentStyles;

export function AccentChip({
  color,
  children,
  className,
}: {
  color: AccentColor;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-xl",
        accentStyles[color],
        className,
      )}
    >
      {children}
    </div>
  );
}

export function FloatingCard({
  children,
  rotate,
  className,
}: {
  children: ReactNode;
  rotate?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("rounded-3xl border border-border bg-background p-7 shadow-lift", className)}
      style={rotate ? { transform: `rotate(${rotate}deg)` } : undefined}
    >
      {children}
    </div>
  );
}

const navLinks = [
  { to: "/how-it-works", label: "How it works" },
  { to: "/business", label: "For Business" },
  { to: "/personal", label: "For Personal" },
  { to: "/pricing", label: "Pricing" },
];

export function MarketingNav() {
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link to="/" className="flex items-center">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={cn(
                "text-[14px] font-medium transition-colors",
                path === l.to ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/auth/login"
            className="text-[14px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Log in
          </Link>
          <Link
            to="/auth/signup"
            className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-2 text-[13.5px] font-semibold text-background transition-opacity hover:opacity-90"
          >
            Get started
          </Link>
        </div>

        <button
          className="flex size-9 items-center justify-center rounded-lg text-foreground md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-5 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-[15px] font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-3 flex gap-2 border-t border-border pt-3">
              <Link
                to="/auth/login"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-lg border border-border px-4 py-2.5 text-center text-[14px] font-medium"
              >
                Log in
              </Link>
              <Link
                to="/auth/signup"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-lg bg-foreground px-4 py-2.5 text-center text-[14px] font-semibold text-background"
              >
                Get started
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          <div className="md:col-span-1">
            <Logo />
            <p className="mt-4 max-w-[200px] text-[13.5px] leading-relaxed text-muted-foreground">
              Your AI memory for WhatsApp.
            </p>
          </div>
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
              Product
            </p>
            <ul className="mt-3 space-y-2.5">
              <li>
                <Link
                  to="/how-it-works"
                  className="text-[14px] text-muted-foreground hover:text-foreground"
                >
                  How it works
                </Link>
              </li>
              <li>
                <Link
                  to="/pricing"
                  className="text-[14px] text-muted-foreground hover:text-foreground"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/app" className="text-[14px] text-muted-foreground hover:text-foreground">
                  Workspace
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
              Use cases
            </p>
            <ul className="mt-3 space-y-2.5">
              <li>
                <Link
                  to="/business"
                  className="text-[14px] text-muted-foreground hover:text-foreground"
                >
                  For Business
                </Link>
              </li>
              <li>
                <Link
                  to="/personal"
                  className="text-[14px] text-muted-foreground hover:text-foreground"
                >
                  For Personal
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
              Legal
            </p>
            <ul className="mt-3 space-y-2.5">
              <li>
                <span className="text-[14px] text-muted-foreground">Privacy</span>
              </li>
              <li>
                <span className="text-[14px] text-muted-foreground">Terms</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-border pt-6">
          <p className="text-[12.5px] text-muted-foreground">© 2026 NANTI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingNav />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
