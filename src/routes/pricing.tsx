import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { MarketingLayout, Reveal } from "@/components/nanti/marketing";
import { loadConfig } from "@/config/site";
import { canonical } from "@/lib/site";
import { useLang, type Bilingual } from "@/lib/i18n";

type PlanText = { period: string; desc: string; features: string[]; cta: string };

const PRICING_COPY: Bilingual<{
  label: string;
  headline?: string;
  subtitle?: string;
  includes: string;
  noCard: string;
}> = {
  id: {
    label: "Harga",
    headline: "Harga sederhana untuk semua jenis pekerjaan.",
    subtitle: "Mulai gratis. Upgrade saat Anda butuh lebih.",
    includes: "Semua paket termasuk impor percakapan, ringkasan harian, dan integrasi WhatsApp.",
    noCard: "Tanpa kartu kredit. Bisa berhenti kapan saja.",
  },
  en: {
    label: "Pricing",
    includes: "All plans include conversation import, daily briefings, and WhatsApp integration.",
    noCard: "No credit card required. Cancel anytime.",
  },
};

/* Indonesian text per plan name. Prices and names come from the site config; anything not listed here falls back to the config text. */
const PLANS_ID: Record<string, PlanText> = {
  Free: {
    period: "selamanya",
    desc: "Untuk mencoba NANTI dengan percakapan yang paling penting.",
    features: [
      "Hingga 50 item terlacak",
      "Impor percakapan dengan AI",
      "Ringkasan harian",
      "1 workspace",
    ],
    cta: "Buat akun gratis",
  },
  Pro: {
    period: "/bulan",
    desc: "Untuk profesional yang hidup di WhatsApp.",
    features: [
      "Item terlacak tanpa batas",
      "Impor percakapan dengan AI",
      "Ringkasan harian & rekap akhir hari",
      "Asisten Tanya NANTI",
      "Ingatan orang & proyek",
      "Pemrosesan AI prioritas",
    ],
    cta: "Buat akun gratis",
  },
  Business: {
    period: "",
    desc: "Untuk tim yang bekerja lewat WhatsApp.",
    features: [
      "Semua fitur Pro",
      "Workspace bersama",
      "Kolaborasi tim",
      "Akses API",
      "Pelatihan AI khusus",
      "Dukungan khusus",
    ],
    cta: "Hubungi kami",
  },
};

export const Route = createFileRoute("/pricing")({
  head: () => ({
    links: [canonical("/pricing")],
    meta: [
      { title: "Harga · NANTI" },
      { name: "description", content: "Harga sederhana untuk NANTI, ingatan Anda untuk WhatsApp." },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  return (
    <MarketingLayout>
      <PricingContent />
    </MarketingLayout>
  );
}

function PricingContent() {
  const { lang } = useLang();
  const t = PRICING_COPY[lang];
  const config = loadConfig();
  const headline = t.headline ?? config.pricing.headline;
  const subtitle = t.subtitle ?? config.pricing.subtitle;
  const plans = config.pricing.plans.map((plan) => {
    const id = lang === "id" ? PLANS_ID[plan.name] : undefined;
    return id ? { ...plan, ...id, price: plan.price === "Custom" ? "Kustom" : plan.price } : plan;
  });

  return (
    <>
      <section className="bg-white pt-24 pb-16 sm:pt-32 sm:pb-20">
        <div className="mx-auto max-w-[800px] px-5 text-center sm:px-8">
          <Reveal>
            <p className="mb-3 text-[13px] font-semibold text-[#067a3f]">{t.label}</p>
            <h1 className="mt-3 text-[28px] font-bold tracking-tight text-[#111111] sm:text-[36px]">
              {headline}
            </h1>
            <p className="mt-3 text-[15px] text-[#5F6368]">{subtitle}</p>
          </Reveal>
        </div>
      </section>

      <section className="bg-[#F7F8F6] py-16 sm:py-20">
        <div className="mx-auto max-w-[1000px] px-5 sm:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan, i) => (
              <Reveal key={plan.name} delay={i * 100}>
                <div
                  className={`relative flex h-full flex-col rounded-2xl border p-6 transition-all ${
                    plan.highlight
                      ? "border-[#107E71] bg-white shadow-md"
                      : "border-[#E7E9E7] bg-white"
                  }`}
                >
                  <h3 className="text-[18px] font-semibold text-[#111111]">{plan.name}</h3>
                  <p className="mt-1.5 text-[13px] text-[#5F6368]">{plan.desc}</p>
                  <div className="mt-5 flex items-baseline gap-1">
                    <span className="text-[32px] font-bold tracking-tight text-[#111111]">
                      {plan.price}
                    </span>
                    <span className="text-[14px] text-[#5F6368]">{plan.period}</span>
                  </div>
                  <ul className="mt-6 flex-1 space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-[13px]">
                        <Check className="mt-0.5 size-4 shrink-0 text-[#067a3f]" />
                        <span className="text-[#5F6368]">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/welcome"
                    className={`mt-7 inline-flex items-center justify-center rounded-xl px-5 py-3 text-[14px] font-semibold transition-all ${
                      plan.highlight
                        ? "bg-[#107E71] text-white hover:bg-[#0b5e54]"
                        : "border border-[#E7E9E7] text-[#111111] hover:bg-[#F7F8F6]"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-[500px] px-5 text-center sm:px-8">
          <Reveal>
            <p className="text-[14px] text-[#5F6368]">{t.includes}</p>
            <p className="mt-2 text-[12px] text-[#5F6368]">{t.noCard}</p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
