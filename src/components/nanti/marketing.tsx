import { Link, useRouterState } from "@tanstack/react-router";
import { useState, useEffect, useRef, type ReactNode, type CSSProperties } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { SiteFooter } from "./footer";
import { LangProvider, LangToggle, useCopy } from "@/lib/i18n";

/* ─── Navigation ─── */

const NAV = {
  id: {
    links: [
      { to: "/how-it-works", label: "Cara kerja" },
      { to: "/business", label: "Untuk Bisnis" },
      { to: "/personal", label: "Untuk Pribadi" },
    ],
    login: "Masuk",
    cta: "Coba NANTI gratis",
    menu: "Menu",
  },
  en: {
    links: [
      { to: "/how-it-works", label: "How it works" },
      { to: "/business", label: "For Business" },
      { to: "/personal", label: "For Personal" },
    ],
    login: "Log in",
    cta: "Try NANTI for free",
    menu: "Menu",
  },
};

export function MarketingNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const t = useCopy(NAV);
  const navLinks = t.links;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 right-0 left-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-border/50 bg-white/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] backdrop-blur-xl"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5 sm:px-8">
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
                path === l.to ? "text-foreground" : "text-[#5F6368] hover:text-foreground",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <LangToggle />
          <Link
            to="/auth/login"
            className="text-[14px] font-medium text-[#5F6368] transition-colors hover:text-foreground"
          >
            {t.login}
          </Link>
          <Link
            to="/welcome"
            className="inline-flex items-center rounded-full bg-[#107E71] px-4 py-2 text-[13.5px] font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#0b5e54] hover:shadow-md"
          >
            {t.cta}
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <LangToggle />
          <button
            className="flex size-9 items-center justify-center rounded-lg text-foreground md:hidden"
            onClick={() => setOpen(!open)}
            aria-label={t.menu}
            aria-expanded={open}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-white/95 backdrop-blur-xl md:hidden">
          <nav className="mx-auto flex max-w-[1200px] flex-col gap-1 px-5 py-4">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-[15px] font-medium text-[#5F6368] hover:bg-[#F7F8F6] hover:text-foreground"
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
                {t.login}
              </Link>
              <Link
                to="/welcome"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-full bg-[#107E71] px-4 py-2.5 text-center text-[14px] font-semibold text-white"
              >
                {t.cta}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

/* ─── Layout ─── */

export function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <LangProvider>
      <div className="flex min-h-screen flex-col bg-white">
        <MarketingNav />
        <main className="flex-1 pt-16">{children}</main>
        <SiteFooter />
      </div>
    </LangProvider>
  );
}

/* ─── Scroll reveal hook ─── */

export function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, visible };
}

/* ─── Reveal wrapper ─── */

export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
        className,
      )}
      style={{ transitionDelay: `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}
