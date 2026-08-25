import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Save,
  RotateCcw,
  Eye,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Check,
  Globe,
  Layout,
  MessageSquare,
  Briefcase,
  Heart,
  CreditCard,
  PanelBottom,
  Sparkles,
} from "lucide-react";
import { loadConfig, saveConfig, resetConfig, type SiteConfig } from "@/config/site";

const ADMIN_USER = "151";
const ADMIN_PASS = "151";
const AUTH_KEY = "nanti.admin.auth";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (sessionStorage.getItem(AUTH_KEY) === "true") setAuthenticated(true);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      setAuthenticated(true);
      sessionStorage.setItem(AUTH_KEY, "true");
      setError("");
    } else {
      setError("Username atau password salah.");
    }
  };

  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F8F6] px-5">
        <div className="w-full max-w-[360px]">
          <div className="rounded-2xl border border-[#E7E9E7] bg-white p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-xl bg-[#25D366]/10">
                <span className="text-[14px] font-bold text-[#25D366]">N</span>
              </div>
              <h1 className="text-[18px] font-bold text-[#111111]">Admin Panel</h1>
              <p className="mt-1 text-[13px] text-[#5F6368]">Masuk untuk mengedit konten website</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="mb-1 block text-[12px] font-medium text-[#5F6368]">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-[#E7E9E7] bg-[#F7F8F6] px-4 py-2.5 text-[14px] text-[#111111] outline-none transition-colors focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/10"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-medium text-[#5F6368]">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-[#E7E9E7] bg-[#F7F8F6] px-4 py-2.5 text-[14px] text-[#111111] outline-none transition-colors focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/10"
                />
              </div>
              {error && <p className="text-[12px] text-red-500">{error}</p>}
              <button
                type="submit"
                className="w-full rounded-xl bg-[#25D366] px-4 py-2.5 text-[14px] font-semibold text-white transition-all hover:bg-[#1fb85c]"
              >
                Masuk
              </button>
            </form>
          </div>
          <p className="mt-4 text-center text-[12px] text-[#5F6368]">
            <Link to="/" className="text-[#25D366] hover:underline">← Kembali ke beranda</Link>
          </p>
        </div>
      </div>
    );
  }

  return <EditorDashboard />;
}

/* ─── EDITOR DASHBOARD ─── */

type PageKey = "homepage" | "howItWorks" | "business" | "personal" | "pricing" | "footer" | "effects";

const PAGE_TABS: Array<{ key: PageKey; label: string; icon: React.ReactNode }> = [
  { key: "homepage", label: "Homepage", icon: <Globe className="size-4" /> },
  { key: "howItWorks", label: "How it Works", icon: <Layout className="size-4" /> },
  { key: "business", label: "Business", icon: <Briefcase className="size-4" /> },
  { key: "personal", label: "Personal", icon: <Heart className="size-4" /> },
  { key: "pricing", label: "Pricing", icon: <CreditCard className="size-4" /> },
  { key: "footer", label: "Footer", icon: <PanelBottom className="size-4" /> },
  { key: "effects", label: "Effects", icon: <Sparkles className="size-4" /> },
];

function EditorDashboard() {
  const [config, setConfig] = useState<SiteConfig>(loadConfig);
  const [activeTab, setActiveTab] = useState<PageKey>("homepage");
  const [saved, setSaved] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = useCallback((key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const update = (path: string, value: unknown) => {
    setConfig((prev) => {
      const next = JSON.parse(JSON.stringify(prev)) as SiteConfig;
      const keys = path.split(".");
      let obj: Record<string, unknown> = next;
      for (let i = 0; i < keys.length - 1; i++) {
        obj = obj[keys[i]] as Record<string, unknown>;
      }
      obj[keys[keys.length - 1]] = value;
      return next;
    });
    setSaved(false);
  };

  const handleSave = () => {
    saveConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    if (confirm("Reset semua konten ke default?")) {
      resetConfig();
      setConfig(loadConfig());
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8F6]">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-[#E7E9E7] bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-[#5F6368] hover:text-[#111111]">
              <ArrowLeft className="size-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-[#25D366]">
                <span className="text-[11px] font-bold text-white">N</span>
              </div>
              <span className="text-[15px] font-bold text-[#111111]">Admin Editor</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E7E9E7] px-3 py-1.5 text-[12px] font-medium text-[#5F6368] hover:bg-[#F7F8F6]"
            >
              <Eye className="size-3.5" /> Preview
            </a>
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E7E9E7] px-3 py-1.5 text-[12px] font-medium text-[#5F6368] hover:bg-[#F7F8F6]"
            >
              <RotateCcw className="size-3.5" /> Reset
            </button>
            <button
              onClick={handleSave}
              className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-[12px] font-semibold text-white transition-all ${
                saved ? "bg-green-500" : "bg-[#25D366] hover:bg-[#1fb85c]"
              }`}
            >
              {saved ? <Check className="size-3.5" /> : <Save className="size-3.5" />}
              {saved ? "Tersimpan!" : "Simpan"}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-5 py-6">
        <div className="flex gap-6">
          {/* Sidebar tabs */}
          <nav className="w-[200px] shrink-0">
            <div className="sticky top-20 space-y-1">
              {PAGE_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all ${
                    activeTab === tab.key
                      ? "bg-[#25D366]/10 text-[#25D366]"
                      : "text-[#5F6368] hover:bg-[#F7F8F6] hover:text-[#111111]"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </nav>

          {/* Editor content */}
          <main className="min-w-0 flex-1">
            {activeTab === "homepage" && <HomepageEditor config={config} update={update} expanded={expandedSections} toggle={toggleSection} />}
            {activeTab === "howItWorks" && <HowItWorksEditor config={config} update={update} expanded={expandedSections} toggle={toggleSection} />}
            {activeTab === "business" && <BusinessEditor config={config} update={update} />}
            {activeTab === "personal" && <PersonalEditor config={config} update={update} />}
            {activeTab === "pricing" && <PricingEditor config={config} update={update} expanded={expandedSections} toggle={toggleSection} />}
            {activeTab === "footer" && <FooterEditor config={config} update={update} expanded={expandedSections} toggle={toggleSection} />}
            {activeTab === "effects" && <EffectsEditor config={config} update={update} />}
          </main>
        </div>
      </div>
    </div>
  );
}

/* ─── FIELD COMPONENTS ─── */

function Field({
  label,
  value,
  onChange,
  type = "text",
  multiline = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  multiline?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#5F6368]">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full rounded-xl border border-[#E7E9E7] bg-white px-4 py-2.5 text-[13px] text-[#111111] outline-none transition-colors focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/10 resize-y"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-[#E7E9E7] bg-white px-4 py-2.5 text-[13px] text-[#111111] outline-none transition-colors focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/10"
        />
      )}
    </div>
  );
}

function Section({
  title,
  emoji,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  emoji?: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#E7E9E7] bg-white overflow-hidden">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-5 py-4 text-left hover:bg-[#F7F8F6] transition-colors"
      >
        {expanded ? <ChevronDown className="size-4 text-[#5F6368]" /> : <ChevronRight className="size-4 text-[#5F6368]" />}
        {emoji && <span className="text-[16px]">{emoji}</span>}
        <span className="text-[14px] font-semibold text-[#111111]">{title}</span>
      </button>
      {expanded && <div className="border-t border-[#E7E9E7] px-5 py-5 space-y-4">{children}</div>}
    </div>
  );
}

function ArrayEditor<T extends Record<string, string>>({
  items,
  onChange,
  fields,
  addLabel,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  fields: Array<{ key: keyof T & string; label: string; type?: string; placeholder?: string }>;
  addLabel: string;
}) {
  const updateItem = (index: number, key: string, value: string) => {
    const next = items.map((item, i) => (i === index ? { ...item, [key]: value } : item));
    onChange(next);
  };
  const addItem = () => {
    const empty = Object.fromEntries(fields.map((f) => [f.key, ""])) as T;
    onChange([...items, empty]);
  };
  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="rounded-xl border border-[#E7E9E7] bg-[#F7F8F6] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#5F6368]">#{i + 1}</span>
            <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600">
              <Trash2 className="size-3.5" />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map((f) => (
              <Field
                key={f.key}
                label={f.label}
                value={item[f.key] || ""}
                onChange={(v) => updateItem(i, f.key, v)}
                type={f.type}
                placeholder={f.placeholder}
              />
            ))}
          </div>
        </div>
      ))}
      <button
        onClick={addItem}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#25D366]/30 bg-[#25D366]/5 py-2.5 text-[12px] font-medium text-[#25D366] hover:bg-[#25D366]/10 transition-colors"
      >
        <Plus className="size-3.5" /> {addLabel}
      </button>
    </div>
  );
}

/* ─── PAGE EDITORS ─── */

function HomepageEditor({
  config,
  update,
  expanded,
  toggle,
}: {
  config: SiteConfig;
  update: (path: string, value: unknown) => void;
  expanded: Record<string, boolean>;
  toggle: (key: string) => void;
}) {
  const h = config.homepage;
  return (
    <div className="space-y-4">
      <Section title="Meta SEO" emoji="🔍" expanded={!!expanded["h-meta"]} onToggle={() => toggle("h-meta")}>
        <Field label="Title" value={h.meta.title} onChange={(v) => update("homepage.meta.title", v)} />
        <Field label="Description" value={h.meta.description} onChange={(v) => update("homepage.meta.description", v)} multiline />
      </Section>

      <Section title="Hero" emoji="🏠" expanded={!!expanded["h-hero"]} onToggle={() => toggle("h-hero")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Badge Text" value={h.hero.badge} onChange={(v) => update("homepage.hero.badge", v)} />
          <Field label="Badge Emoji" value={h.hero.badgeEmoji} onChange={(v) => update("homepage.hero.badgeEmoji", v)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Headline" value={h.hero.headline} onChange={(v) => update("homepage.hero.headline", v)} />
          <Field label="Highlight" value={h.hero.highlight} onChange={(v) => update("homepage.hero.highlight", v)} />
          <Field label="Subheadline" value={h.hero.subheadline} onChange={(v) => update("homepage.hero.subheadline", v)} />
        </div>
        <Field label="Description" value={h.hero.description} onChange={(v) => update("homepage.hero.description", v)} />
        <Field label="Description Long" value={h.hero.descriptionLong} onChange={(v) => update("homepage.hero.descriptionLong", v)} multiline />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="CTA Primary" value={h.hero.ctaPrimary} onChange={(v) => update("homepage.hero.ctaPrimary", v)} />
          <Field label="CTA Secondary" value={h.hero.ctaSecondary} onChange={(v) => update("homepage.hero.ctaSecondary", v)} />
        </div>

        <div className="mt-4 border-t border-[#E7E9E7] pt-4">
          <p className="mb-3 text-[12px] font-semibold text-[#5F6368]">💬 Chat Demo</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Chat Name" value={h.hero.chatName} onChange={(v) => update("homepage.hero.chatName", v)} />
            <Field label="Chat Time" value={h.hero.chatTime} onChange={(v) => update("homepage.hero.chatTime", v)} />
          </div>
          <Field label="Chat Message" value={h.hero.chatMessage} onChange={(v) => update("homepage.hero.chatMessage", v)} multiline />
          <Field label="Forwarded Label" value={h.hero.forwardedLabel} onChange={(v) => update("homepage.hero.forwardedLabel", v)} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Track Label" value={h.hero.trackLabel} onChange={(v) => update("homepage.hero.trackLabel", v)} />
            <Field label="Dismiss Label" value={h.hero.dismissLabel} onChange={(v) => update("homepage.hero.dismissLabel", v)} />
          </div>
        </div>

        <div className="mt-4 border-t border-[#E7E9E7] pt-4">
          <p className="mb-3 text-[12px] font-semibold text-[#5F6368]">🎯 Extracted Items</p>
          <ArrayEditor
            items={h.hero.extractedItems}
            onChange={(items) => update("homepage.hero.extractedItems", items)}
            fields={[
              { key: "label", label: "Label (WHO/WHAT/WHEN)" },
              { key: "value", label: "Value" },
            ]}
            addLabel="Tambah Item"
          />
        </div>

        <div className="mt-4 border-t border-[#E7E9E7] pt-4">
          <p className="mb-3 text-[12px] font-semibold text-[#5F6368]">✨ Floating Emojis</p>
          <ArrayEditor
            items={h.hero.floatingEmojis.map((e) => ({ emoji: e }))}
            onChange={(items) => update("homepage.hero.floatingEmojis", items.map((i) => i.emoji))}
            fields={[{ key: "emoji", label: "Emoji" }]}
            addLabel="Tambah Emoji"
          />
        </div>
      </Section>

      <Section title="Insight" emoji="💭" expanded={!!expanded["h-insight"]} onToggle={() => toggle("h-insight")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Emoji" value={h.insight.emoji} onChange={(v) => update("homepage.insight.emoji", v)} />
          <Field label="Headline" value={h.insight.headline} onChange={(v) => update("homepage.insight.headline", v)} />
        </div>
        <Field label="Subheadline" value={h.insight.subheadline} onChange={(v) => update("homepage.insight.subheadline", v)} />
        <Field label="Conclusion" value={h.insight.conclusion} onChange={(v) => update("homepage.insight.conclusion", v)} />
        <Field label="Conclusion Highlight" value={h.insight.conclusionHighlight} onChange={(v) => update("homepage.insight.conclusionHighlight", v)} />
        <p className="mt-3 text-[12px] font-semibold text-[#5F6368]">Quotes</p>
        <ArrayEditor
          items={h.insight.quotes}
          onChange={(items) => update("homepage.insight.quotes", items)}
          fields={[
            { key: "text", label: "Quote Text" },
            { key: "emoji", label: "Emoji" },
          ]}
          addLabel="Tambah Quote"
        />
      </Section>

      <Section title="Core Loop" emoji="⚡" expanded={!!expanded["h-core"]} onToggle={() => toggle("h-core")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Emoji" value={h.coreLoop.emoji} onChange={(v) => update("homepage.coreLoop.emoji", v)} />
          <Field label="Headline" value={h.coreLoop.headline} onChange={(v) => update("homepage.coreLoop.headline", v)} />
        </div>
        <Field label="Subheadline" value={h.coreLoop.subheadline} onChange={(v) => update("homepage.coreLoop.subheadline", v)} />
        <ArrayEditor
          items={h.coreLoop.steps}
          onChange={(items) => update("homepage.coreLoop.steps", items)}
          fields={[
            { key: "emoji", label: "Emoji" },
            { key: "label", label: "Label" },
            { key: "desc", label: "Description" },
          ]}
          addLabel="Tambah Step"
        />
      </Section>

      <Section title="Testimonial" emoji="⭐" expanded={!!expanded["h-testimonial"]} onToggle={() => toggle("h-testimonial")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Emoji" value={h.testimonial.emoji} onChange={(v) => update("homepage.testimonial.emoji", v)} />
          <Field label="Author Initial" value={h.testimonial.authorInitial} onChange={(v) => update("homepage.testimonial.authorInitial", v)} />
        </div>
        <Field label="Quote" value={h.testimonial.quote} onChange={(v) => update("homepage.testimonial.quote", v)} multiline />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Author Name" value={h.testimonial.authorName} onChange={(v) => update("homepage.testimonial.authorName", v)} />
          <Field label="Author Title" value={h.testimonial.authorTitle} onChange={(v) => update("homepage.testimonial.authorTitle", v)} />
        </div>
      </Section>

      <Section title="Integrations" emoji="🔗" expanded={!!expanded["h-integrations"]} onToggle={() => toggle("h-integrations")}>
        <Field label="Label" value={h.integrations.label} onChange={(v) => update("homepage.integrations.label", v)} />
        <Field label="Subheadline" value={h.integrations.subheadline} onChange={(v) => update("homepage.integrations.subheadline", v)} />
        <ArrayEditor
          items={h.integrations.items}
          onChange={(items) => update("homepage.integrations.items", items)}
          fields={[
            { key: "name", label: "Name" },
            { key: "emoji", label: "Emoji" },
          ]}
          addLabel="Tambah Integration"
        />
      </Section>

      <Section title="Final CTA" emoji="🚀" expanded={!!expanded["h-cta"]} onToggle={() => toggle("h-cta")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Emoji" value={h.finalCta.emoji} onChange={(v) => update("homepage.finalCta.emoji", v)} />
          <Field label="Headline" value={h.finalCta.headline} onChange={(v) => update("homepage.finalCta.headline", v)} />
        </div>
        <Field label="Subheadline" value={h.finalCta.subheadline} onChange={(v) => update("homepage.finalCta.subheadline", v)} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="CTA Button" value={h.finalCta.cta} onChange={(v) => update("homepage.finalCta.cta", v)} />
          <Field label="Fine Print" value={h.finalCta.finePrint} onChange={(v) => update("homepage.finalCta.finePrint", v)} />
        </div>
      </Section>
    </div>
  );
}

function HowItWorksEditor({
  config,
  update,
  expanded,
  toggle,
}: {
  config: SiteConfig;
  update: (path: string, value: unknown) => void;
  expanded: Record<string, boolean>;
  toggle: (key: string) => void;
}) {
  const h = config.howItWorks;
  return (
    <div className="space-y-4">
      <Section title="Meta SEO" emoji="🔍" expanded={!!expanded["hi-meta"]} onToggle={() => toggle("hi-meta")}>
        <Field label="Title" value={h.meta.title} onChange={(v) => update("howItWorks.meta.title", v)} />
        <Field label="Description" value={h.meta.description} onChange={(v) => update("howItWorks.meta.description", v)} multiline />
      </Section>

      <Section title="Header" emoji="📋" expanded={!!expanded["hi-header"]} onToggle={() => toggle("hi-header")}>
        <Field label="Badge" value={h.badge} onChange={(v) => update("howItWorks.badge", v)} />
        <Field label="Headline" value={h.headline} onChange={(v) => update("howItWorks.headline", v)} />
        <Field label="Description" value={h.description} onChange={(v) => update("howItWorks.description", v)} multiline />
      </Section>

      <Section title="3 Steps" emoji="🎯" expanded={!!expanded["hi-steps"]} onToggle={() => toggle("hi-steps")}>
        <ArrayEditor
          items={h.steps}
          onChange={(items) => update("howItWorks.steps", items)}
          fields={[
            { key: "emoji", label: "Emoji" },
            { key: "title", label: "Title" },
            { key: "desc", label: "Description" },
          ]}
          addLabel="Tambah Step"
        />
      </Section>

      <Section title="Context Section" emoji="🧠" expanded={!!expanded["hi-context"]} onToggle={() => toggle("hi-context")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Emoji" value={h.context.emoji} onChange={(v) => update("howItWorks.context.emoji", v)} />
          <Field label="Label" value={h.context.label} onChange={(v) => update("howItWorks.context.label", v)} />
        </div>
        <Field label="Headline" value={h.context.headline} onChange={(v) => update("howItWorks.context.headline", v)} />
        <Field label="Subheadline" value={h.context.subheadline} onChange={(v) => update("howItWorks.context.subheadline", v)} />
        <Field label="Description" value={h.context.description} onChange={(v) => update("howItWorks.context.description", v)} />
        <Field label="Conversation Example" value={h.context.conversation} onChange={(v) => update("howItWorks.context.conversation", v)} multiline />
        <p className="mt-3 text-[12px] font-semibold text-[#5F6368]">Extraction Fields</p>
        <ArrayEditor
          items={h.context.extractions}
          onChange={(items) => update("howItWorks.context.extractions", items)}
          fields={[
            { key: "label", label: "Label (WHO/WHAT/WHEN/WHY)" },
            { key: "value", label: "Value" },
          ]}
          addLabel="Tambah Field"
        />
      </Section>

      <Section title="Bring Anything" emoji="📦" expanded={!!expanded["hi-bring"]} onToggle={() => toggle("hi-bring")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Emoji" value={h.bringAnything.emoji} onChange={(v) => update("howItWorks.bringAnything.emoji", v)} />
          <Field label="Headline" value={h.bringAnything.headline} onChange={(v) => update("howItWorks.bringAnything.headline", v)} />
        </div>
        <Field label="Subheadline" value={h.bringAnything.subheadline} onChange={(v) => update("howItWorks.bringAnything.subheadline", v)} />
        <ArrayEditor
          items={h.bringAnything.options}
          onChange={(items) => update("howItWorks.bringAnything.options", items)}
          fields={[
            { key: "emoji", label: "Emoji" },
            { key: "label", label: "Label" },
            { key: "desc", label: "Description" },
          ]}
          addLabel="Tambah Opsi"
        />
      </Section>

      <Section title="CTA" emoji="🚀" expanded={!!expanded["hi-cta"]} onToggle={() => toggle("hi-cta")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Emoji" value={h.cta.emoji} onChange={(v) => update("howItWorks.cta.emoji", v)} />
          <Field label="Headline" value={h.cta.headline} onChange={(v) => update("howItWorks.cta.headline", v)} />
        </div>
        <Field label="Subheadline" value={h.cta.subheadline} onChange={(v) => update("howItWorks.cta.subheadline", v)} />
        <Field label="Button Text" value={h.cta.button} onChange={(v) => update("howItWorks.cta.button", v)} />
      </Section>
    </div>
  );
}

function BusinessEditor({
  config,
  update,
}: {
  config: SiteConfig;
  update: (path: string, value: unknown) => void;
}) {
  const b = config.business;
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#E7E9E7] bg-white p-5 space-y-4">
        <p className="text-[14px] font-semibold text-[#111111]">📋 Business Page</p>
        <Field label="Title" value={b.meta.title} onChange={(v) => update("business.meta.title", v)} />
        <Field label="Description" value={b.meta.description} onChange={(v) => update("business.meta.description", v)} multiline />
        <Field label="Headline" value={b.headline} onChange={(v) => update("business.headline", v)} />
        <Field label="Description" value={b.description} onChange={(v) => update("business.description", v)} multiline />
        <Field label="CTA Button" value={b.cta} onChange={(v) => update("business.cta", v)} />
        <ArrayEditor
          items={b.features}
          onChange={(items) => update("business.features", items)}
          fields={[
            { key: "title", label: "Title" },
            { key: "desc", label: "Description" },
          ]}
          addLabel="Tambah Feature"
        />
      </div>
    </div>
  );
}

function PersonalEditor({
  config,
  update,
}: {
  config: SiteConfig;
  update: (path: string, value: unknown) => void;
}) {
  const p = config.personal;
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#E7E9E7] bg-white p-5 space-y-4">
        <p className="text-[14px] font-semibold text-[#111111]">❤️ Personal Page</p>
        <Field label="Title" value={p.meta.title} onChange={(v) => update("personal.meta.title", v)} />
        <Field label="Description" value={p.meta.description} onChange={(v) => update("personal.meta.description", v)} multiline />
        <Field label="Headline" value={p.headline} onChange={(v) => update("personal.headline", v)} />
        <Field label="Description" value={p.description} onChange={(v) => update("personal.description", v)} multiline />
        <Field label="CTA Button" value={p.cta} onChange={(v) => update("personal.cta", v)} />
        <ArrayEditor
          items={p.features}
          onChange={(items) => update("personal.features", items)}
          fields={[
            { key: "title", label: "Title" },
            { key: "desc", label: "Description" },
          ]}
          addLabel="Tambah Feature"
        />
      </div>
    </div>
  );
}

function PricingEditor({
  config,
  update,
  expanded,
  toggle,
}: {
  config: SiteConfig;
  update: (path: string, value: unknown) => void;
  expanded: Record<string, boolean>;
  toggle: (key: string) => void;
}) {
  const p = config.pricing;
  return (
    <div className="space-y-4">
      <Section title="Meta" emoji="🔍" expanded={!!expanded["p-meta"]} onToggle={() => toggle("p-meta")}>
        <Field label="Title" value={p.meta.title} onChange={(v) => update("pricing.meta.title", v)} />
        <Field label="Description" value={p.meta.description} onChange={(v) => update("pricing.meta.description", v)} multiline />
      </Section>

      <Section title="Header" emoji="💰" expanded={!!expanded["p-header"]} onToggle={() => toggle("p-header")}>
        <Field label="Label" value={p.label} onChange={(v) => update("pricing.label", v)} />
        <Field label="Headline" value={p.headline} onChange={(v) => update("pricing.headline", v)} />
        <Field label="Subtitle" value={p.subtitle} onChange={(v) => update("pricing.subtitle", v)} />
      </Section>

      {p.plans.map((plan, i) => (
        <Section key={i} title={`Plan: ${plan.name}`} emoji="💳" expanded={!!expanded[`p-plan-${i}`]} onToggle={() => toggle(`p-plan-${i}`)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" value={plan.name} onChange={(v) => update(`pricing.plans.${i}.name`, v)} />
            <Field label="Price" value={plan.price} onChange={(v) => update(`pricing.plans.${i}.price`, v)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Period" value={plan.period} onChange={(v) => update(`pricing.plans.${i}.period`, v)} />
            <Field label="CTA" value={plan.cta} onChange={(v) => update(`pricing.plans.${i}.cta`, v)} />
          </div>
          <Field label="Description" value={plan.desc} onChange={(v) => update(`pricing.plans.${i}.desc`, v)} multiline />
          <div className="flex items-center gap-3">
            <label className="text-[12px] font-medium text-[#5F6368]">Highlight:</label>
            <button
              onClick={() => update(`pricing.plans.${i}.highlight`, !plan.highlight)}
              className={`rounded-lg px-3 py-1 text-[12px] font-medium transition-colors ${
                plan.highlight ? "bg-[#25D366] text-white" : "bg-[#F7F8F6] text-[#5F6368]"
              }`}
            >
              {plan.highlight ? "✅ Highlighted" : "Not highlighted"}
            </button>
          </div>
          <ArrayEditor
            items={plan.features.map((f) => ({ feature: f }))}
            onChange={(items) => update(`pricing.plans.${i}.features`, items.map((it) => it.feature))}
            fields={[{ key: "feature", label: "Feature" }]}
            addLabel="Tambah Feature"
          />
        </Section>
      ))}
    </div>
  );
}

function FooterEditor({
  config,
  update,
  expanded,
  toggle,
}: {
  config: SiteConfig;
  update: (path: string, value: unknown) => void;
  expanded: Record<string, boolean>;
  toggle: (key: string) => void;
}) {
  const f = config.footer;
  return (
    <div className="space-y-4">
      <Section title="Tagline" emoji="💬" expanded={!!expanded["f-tagline"]} onToggle={() => toggle("f-tagline")}>
        <Field label="Tagline" value={f.tagline} onChange={(v) => update("footer.tagline", v)} />
      </Section>

      <Section title="Product Links" emoji="📦" expanded={!!expanded["f-product"]} onToggle={() => toggle("f-product")}>
        <ArrayEditor
          items={f.product}
          onChange={(items) => update("footer.product", items)}
          fields={[
            { key: "label", label: "Label" },
            { key: "href", label: "Link (URL)" },
          ]}
          addLabel="Tambah Link"
        />
      </Section>

      <Section title="Resources Links" emoji="📚" expanded={!!expanded["f-resources"]} onToggle={() => toggle("f-resources")}>
        <ArrayEditor
          items={f.resources}
          onChange={(items) => update("footer.resources", items)}
          fields={[
            { key: "label", label: "Label" },
            { key: "href", label: "Link (URL)" },
          ]}
          addLabel="Tambah Link"
        />
      </Section>

      <Section title="Legal Links" emoji="📜" expanded={!!expanded["f-legal"]} onToggle={() => toggle("f-legal")}>
        <ArrayEditor
          items={f.legal}
          onChange={(items) => update("footer.legal", items)}
          fields={[
            { key: "label", label: "Label" },
            { key: "href", label: "Link (URL)" },
          ]}
          addLabel="Tambah Link"
        />
      </Section>
    </div>
  );
}

function EffectsEditor({
  config,
  update,
}: {
  config: SiteConfig;
  update: (path: string, value: unknown) => void;
}) {
  const e = config.effects;
  const toggles: Array<{ key: keyof SiteConfig["effects"]; label: string; desc: string }> = [
    { key: "scrollReveal", label: "Scroll Reveal", desc: "Elements fade in as you scroll down" },
    { key: "floatingEmojis", label: "Floating Emojis", desc: "Decorative emojis that float around" },
    { key: "parallaxShadows", label: "Parallax Shadows", desc: "Depth shadows and blurred gradients" },
    { key: "cardHover", label: "Card Hover Effects", desc: "Green border glow on hover" },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#E7E9E7] bg-white p-5 space-y-4">
        <p className="text-[14px] font-semibold text-[#111111]">✨ Animation & Effect Toggles</p>
        <p className="text-[12px] text-[#5F6368]">Toggle effects on/off. Changes apply after saving.</p>
        {toggles.map((t) => (
          <div key={t.key} className="flex items-center justify-between rounded-xl border border-[#E7E9E7] bg-[#F7F8F6] px-4 py-3">
            <div>
              <p className="text-[13px] font-medium text-[#111111]">{t.label}</p>
              <p className="text-[11px] text-[#5F6368]">{t.desc}</p>
            </div>
            <button
              onClick={() => update(`effects.${t.key}`, !e[t.key])}
              className={`relative inline-flex size-10 shrink-0 cursor-pointer rounded-full transition-colors ${
                e[t.key] ? "bg-[#25D366]" : "bg-[#E7E9E7]"
              }`}
            >
              <span
                className={`pointer-events-none inline-block size-5 translate-y-0.5 rounded-full bg-white shadow transition-transform ${
                  e[t.key] ? "translate-x-[22px]" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
