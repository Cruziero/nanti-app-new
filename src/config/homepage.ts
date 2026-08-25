export interface HeroSection {
  badge: string;
  badgeEmoji: string;
  headline: string;
  headlineHighlight: string;
  subheadline: string;
  description: string;
  ctaPrimary: string;
  ctaPrimaryEmoji: string;
  ctaPrimaryLink: string;
  ctaSecondary: string;
  ctaSecondaryEmoji: string;
  ctaSecondaryLink: string;
  floatingEmojis: Array<{ emoji: string; top: string; left: string; right: string; delay: string; size: string }>;
  chatName: string;
  chatEmoji: string;
  chatTime: string;
  chatMessage: string;
  forwardedLabel: string;
  extractedItems: Array<{ label: string; value: string }>;
  trackLabel: string;
  dismissLabel: string;
}

export interface InsightSection {
  emoji: string;
  headline: string;
  subheadline: string;
  quoteLabel: string;
  quotes: Array<{ text: string; emoji: string }>;
  conclusion: string;
  conclusionHighlight: string;
}

export interface CoreLoopSection {
  emoji: string;
  headline: string;
  subheadline: string;
  subheadlineEmoji: string;
  steps: Array<{ num: string; emoji: string; label: string; desc: string }>;
}

export interface TestimonialSection {
  emoji: string;
  quote: string;
  authorInitial: string;
  authorName: string;
  authorTitle: string;
  authorEmoji: string;
}

export interface IntegrationsSection {
  label: string;
  labelEmoji: string;
  subheadline: string;
  items: Array<{ name: string; emoji: string; color: string }>;
}

export interface FinalCtaSection {
  emoji: string;
  headline: string;
  subheadline: string;
  subheadlineEmoji: string;
  cta: string;
  ctaEmoji: string;
  ctaLink: string;
  finePrint: string;
  finePrintEmoji: string;
  floatingEmojis: Array<{ emoji: string; top: string; left: string; right: string; delay: string; size: string }>;
}

export interface HomepageConfig {
  meta: {
    title: string;
    description: string;
    ogTitle: string;
    ogDescription: string;
  };
  hero: HeroSection;
  insight: InsightSection;
  coreLoop: CoreLoopSection;
  testimonial: TestimonialSection;
  integrations: IntegrationsSection;
  finalCta: FinalCtaSection;
  effects: {
    heroParallax: boolean;
    heroFloatingEmojis: boolean;
    heroShadows: boolean;
    coreLoopHover: boolean;
    ctaParallax: boolean;
    ctaFloatingEmojis: boolean;
    scrollReveal: boolean;
  };
}

export const defaultHomepage: HomepageConfig = {
  meta: {
    title: "NANTI — You talk. NANTI remembers.",
    description:
      "NANTI turns everyday WhatsApp conversations into commitments, reminders and follow-ups — so you can stop carrying everything in your head.",
    ogTitle: "NANTI — You talk. NANTI remembers.",
    ogDescription:
      "NANTI turns everyday WhatsApp conversations into commitments, reminders and follow-ups — so you can stop carrying everything in your head.",
  },
  hero: {
    badge: "AI Memory for WhatsApp",
    badgeEmoji: "🧠",
    headline: "You talk.",
    headlineHighlight: "NANTI",
    subheadline: "remembers.",
    description: "Your AI memory for the conversations that matter. 🤝",
    descriptionLong:
      "WhatsApp is where work and life happen. NANTI understands what you promised, who you're waiting for, and what needs to happen next.",
    ctaPrimary: "Try NANTI for free 🚀",
    ctaPrimaryEmoji: "🚀",
    ctaPrimaryLink: "/auth/signup",
    ctaSecondary: "See how it works 👇",
    ctaSecondaryEmoji: "👇",
    ctaSecondaryLink: "/how-it-works",
    floatingEmojis: [
      { emoji: "💬", top: "top-20", left: "left-[15%]", right: "", delay: "", size: "text-[28px]" },
      { emoji: "📱", top: "top-32", left: "", right: "right-[10%]", delay: "1s", size: "text-[24px]" },
      { emoji: "🧠", top: "bottom-20", left: "left-[8%]", right: "", delay: "2s", size: "text-[20px]" },
      { emoji: "✨", top: "top-40", left: "left-[45%]", right: "", delay: "0.5s", size: "text-[22px]" },
    ],
    chatName: "Pak Tom 🏭",
    chatEmoji: "🏭",
    chatTime: "14:32",
    chatMessage: "nanti saya kirim invoice tgl 28 agustus ya pak Tom",
    forwardedLabel: "↩ Forwarded to NANTI",
    extractedItems: [
      { label: "WHO", value: "Pak Tom 👤" },
      { label: "WHAT", value: "Send invoice 📄" },
      { label: "WHEN", value: "28 August 📅" },
    ],
    trackLabel: "✅ Track",
    dismissLabel: "Dismiss",
  },
  insight: {
    emoji: "💭",
    headline: "Most of your commitments never become tasks.",
    subheadline: "They live inside conversations. NANTI remembers them. 🧠",
    quoteLabel: "",
    quotes: [
      { text: '"Besok saya kirim revisinya ya Pak."', emoji: "📋" },
      { text: '"Nanti saya follow up suppliernya."', emoji: "🔄" },
      { text: '"Saya kirim invoice tanggal 28."', emoji: "💰" },
    ],
    conclusion: "You said it. NANTI remembers it. ✨",
    conclusionHighlight: "NANTI remembers it.",
  },
  coreLoop: {
    emoji: "⚡",
    headline: "From conversation to action.",
    subheadline: "You don't create tasks. You just talk.",
    subheadlineEmoji: "🗣️",
    steps: [
      { num: "01", emoji: "💬", label: "TALK", desc: "Your conversations already contain what needs to get done." },
      { num: "02", emoji: "🧠", label: "UNDERSTAND", desc: "NANTI finds the commitments hidden inside them." },
      { num: "03", emoji: "💾", label: "REMEMBER", desc: "NANTI keeps track of what you promised and who you're waiting for." },
      { num: "04", emoji: "🔔", label: "FOLLOW UP", desc: "When the time comes, NANTI brings it back to you." },
    ],
  },
  testimonial: {
    emoji: "⭐",
    quote: "NANTI helped me stop losing promises in WhatsApp.",
    authorInitial: "T",
    authorName: "Tom",
    authorTitle: "Owner, PT Maju Jaya",
    authorEmoji: "",
  },
  integrations: {
    label: "Integrations",
    labelEmoji: "🔗",
    subheadline: "Works with the tools you already use.",
    items: [
      { name: "WhatsApp", emoji: "💬", color: "#25D366" },
      { name: "Google Calendar", emoji: "📅", color: "#4285F4" },
      { name: "Phone Widget", emoji: "📱", color: "#111111" },
    ],
  },
  finalCta: {
    emoji: "🧠",
    headline: "Stop remembering everything.",
    subheadline: "Let NANTI remember what matters.",
    subheadlineEmoji: "💚",
    cta: "Try NANTI for free 🚀",
    ctaEmoji: "🚀",
    ctaLink: "/auth/signup",
    finePrint: "Start in minutes ⏱️",
    finePrintEmoji: "⏱️",
    floatingEmojis: [
      { emoji: "✨", top: "top-10", left: "", right: "right-[20%]", delay: "", size: "text-[20px]" },
      { emoji: "🚀", top: "bottom-10", left: "left-[15%]", right: "", delay: "1s", size: "text-[18px]" },
    ],
  },
  effects: {
    heroParallax: true,
    heroFloatingEmojis: true,
    heroShadows: true,
    coreLoopHover: true,
    ctaParallax: true,
    ctaFloatingEmojis: true,
    scrollReveal: true,
  },
};
