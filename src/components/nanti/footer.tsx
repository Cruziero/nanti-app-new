import { Link } from "@tanstack/react-router";
import { Logo } from "./logo";

const columns = [
  {
    title: "Product",
    links: [
      { label: "How it works", to: "/how-it-works" },
      { label: "Business", to: "/business" },
      { label: "Personal", to: "/personal" },
      { label: "Pricing", to: "/pricing" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", to: "/help" },
      { label: "Contact Support", href: "mailto:support@nanti.app" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About us", to: "/about" },
      { label: "Blog", to: "/blog" },
      { label: "Careers", to: "/careers" },
      { label: "Affiliate Program", to: "/affiliates" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms", to: "/legal/terms" },
      { label: "Privacy Policy", to: "/legal/privacy" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-5">
          <div className="md:col-span-1">
            <Logo />
            <p className="mt-4 max-w-[200px] text-[13.5px] leading-relaxed text-muted-foreground">
              Your AI memory for WhatsApp.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                {col.title}
              </p>
              <ul className="mt-3 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {"href" in link ? (
                      <a
                        href={link.href}
                        className="text-[14px] text-muted-foreground hover:text-foreground"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        to={link.to}
                        className="text-[14px] text-muted-foreground hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 border-t border-border pt-6">
          <p className="text-[12.5px] text-muted-foreground">
            &copy; {new Date().getFullYear()} NANTI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
