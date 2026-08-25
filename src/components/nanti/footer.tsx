import { Link } from "@tanstack/react-router";
import { Logo } from "./logo";

const columns = [
  {
    title: "Product",
    links: [
      { label: "How it works", to: "/how-it-works" },
      { label: "Features", to: "/how-it-works" },
      { label: "Pricing", to: "/pricing" },
      { label: "For Business", to: "/business" },
      { label: "For Personal", to: "/personal" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Help", to: "/help" },
      { label: "Blog", to: "/blog" },
      { label: "Contact", href: "mailto:support@nanti.app" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", to: "/legal/privacy" },
      { label: "Terms", to: "/legal/terms" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-[#E7E9E7] bg-[#F7F8F6]">
      <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-5">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-4 max-w-[240px] text-[14px] leading-relaxed text-[#5F6368]">
              Your AI memory for the conversations that matter.
            </p>
            <div className="mt-5 flex gap-4">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] text-[#5F6368] hover:text-foreground"
              >
                Instagram
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] text-[#5F6368] hover:text-foreground"
              >
                LinkedIn
              </a>
            </div>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-[12px] font-semibold uppercase tracking-wider text-[#5F6368]">
                {col.title}
              </p>
              <ul className="mt-3 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {"href" in link ? (
                      <a
                        href={link.href}
                        className="text-[14px] text-[#5F6368] hover:text-foreground"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        to={link.to}
                        className="text-[14px] text-[#5F6368] hover:text-foreground"
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
        <div className="mt-14 border-t border-[#E7E9E7] pt-6">
          <p className="text-[12.5px] text-[#5F6368]">
            &copy; {new Date().getFullYear()} NANTI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
