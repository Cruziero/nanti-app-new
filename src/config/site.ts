const STORAGE_KEY = "nanti.site.config.v1";

export interface SiteConfig {
  homepage: {
    meta: { title: string; description: string };
    hero: {
      badge: string;
      headline: string;
      highlight: string;
      subheadline: string;
      description: string;
      descriptionLong: string;
      ctaPrimary: string;
      ctaPrimaryLink: string;
      ctaSecondary: string;
      ctaSecondaryLink: string;
      chatName: string;
      chatTime: string;
      chatMessage: string;
      forwardedLabel: string;
      extractedItems: Array<{ label: string; value: string }>;
      trackLabel: string;
      dismissLabel: string;
    };
    insight: {
      headline: string;
      subheadline: string;
      quotes: Array<{ text: string }>;
      conclusion: string;
      conclusionHighlight: string;
    };
    coreLoop: {
      headline: string;
      subheadline: string;
      steps: Array<{ label: string; desc: string }>;
    };
    testimonial: {
      quote: string;
      authorInitial: string;
      authorName: string;
      authorTitle: string;
    };
    integrations: {
      label: string;
      subheadline: string;
      items: Array<{ name: string }>;
    };
    privacy: {
      label: string;
      headline: string;
      items: Array<{ title: string; desc: string }>;
    };
    finalCta: {
      headline: string;
      subheadline: string;
      cta: string;
      finePrint: string;
    };
  };
  howItWorks: {
    meta: { title: string; description: string };
    badge: string;
    headline: string;
    description: string;
    steps: Array<{ emoji: string; title: string; desc: string }>;
    context: {
      emoji: string;
      label: string;
      headline: string;
      subheadline: string;
      description: string;
      conversation: string;
      extractions: Array<{ label: string; value: string }>;
    };
    bringAnything: {
      emoji: string;
      headline: string;
      subheadline: string;
      options: Array<{ emoji: string; label: string; desc: string }>;
    };
    cta: {
      emoji: string;
      headline: string;
      subheadline: string;
      button: string;
    };
  };
  business: {
    meta: { title: string; description: string };
    headline: string;
    description: string;
    features: Array<{ title: string; desc: string }>;
    cta: string;
  };
  personal: {
    meta: { title: string; description: string };
    headline: string;
    description: string;
    features: Array<{ title: string; desc: string }>;
    cta: string;
  };
  pricing: {
    meta: { title: string; description: string };
    label: string;
    headline: string;
    subtitle: string;
    plans: Array<{
      name: string;
      price: string;
      period: string;
      desc: string;
      features: string[];
      cta: string;
      highlight: boolean;
    }>;
  };
  footer: {
    tagline: string;
    product: Array<{ label: string; href: string }>;
    resources: Array<{ label: string; href: string }>;
    legal: Array<{ label: string; href: string }>;
  };
  effects: {
    scrollReveal: boolean;
    floatingEmojis: boolean;
    parallaxShadows: boolean;
    cardHover: boolean;
  };
}

export const defaultConfig: SiteConfig = {
  homepage: {
    meta: {
      title: "NANTI — You talk. NANTI remembers.",
      description:
        "NANTI turns everyday WhatsApp conversations into commitments, reminders and follow-ups — so you can stop carrying everything in your head.",
    },
    hero: {
      badge: "AI Memory for WhatsApp",
      headline: "You talk.",
      highlight: "NANTI",
      subheadline: "remembers.",
      description: "Forward a WhatsApp message. NANTI extracts the commitment, tracks the deadline, and reminds you when it's time.",
      descriptionLong:
        "WhatsApp is where work and life happen. NANTI understands what you promised, who you're waiting for, and what needs to happen next.",
      ctaPrimary: "Try NANTI for free",
      ctaPrimaryLink: "/auth/signup",
      ctaSecondary: "See how it works",
      ctaSecondaryLink: "/how-it-works",
      chatName: "Pak Tom",
      chatTime: "14:32",
      chatMessage: "nanti saya kirim invoice tgl 28 agustus ya pak Tom",
      forwardedLabel: "Forwarded to NANTI",
      extractedItems: [
        { label: "WHO", value: "Pak Tom" },
        { label: "WHAT", value: "Send invoice" },
        { label: "WHEN", value: "28 August" },
      ],
      trackLabel: "Track",
      dismissLabel: "Dismiss",
    },
    insight: {
      headline: "Most of your commitments never become tasks.",
      subheadline: "They live inside conversations. NANTI remembers them.",
      quotes: [
        { text: '"Besok saya kirim revisinya ya Pak."' },
        { text: '"Nanti saya follow up suppliernya."' },
        { text: '"Saya kirim invoice tanggal 28."' },
      ],
      conclusion: "You said it. NANTI remembers it.",
      conclusionHighlight: "NANTI remembers it.",
    },
    coreLoop: {
      headline: "From conversation to action.",
      subheadline: "You don't create tasks. You just talk.",
      steps: [
        { label: "TALK", desc: "Your conversations already contain what needs to get done." },
        { label: "UNDERSTAND", desc: "NANTI finds the commitments hidden inside them." },
        { label: "REMEMBER", desc: "NANTI keeps track of what you promised and who you're waiting for." },
        { label: "FOLLOW UP", desc: "When the time comes, NANTI brings it back to you." },
      ],
    },
    testimonial: {
      quote: "NANTI helped me stop losing promises in WhatsApp.",
      authorInitial: "T",
      authorName: "Tom",
      authorTitle: "Owner, PT Maju Jaya",
    },
    integrations: {
      label: "Integrations",
      subheadline: "Works with the tools you already use.",
      items: [
        { name: "WhatsApp" },
        { name: "Google Calendar" },
        { name: "Phone Widget" },
      ],
    },
    privacy: {
      label: "Privacy & Security",
      headline: "Your conversations are safe with us.",
      items: [
        { title: "End-to-end encrypted", desc: "Your messages are encrypted in transit and at rest. We never store raw conversation data." },
        { title: "You control your data", desc: "Delete your data anytime. We never sell or share your information with third parties." },
        { title: "AI reads patterns, not people", desc: "NANTI extracts commitments and deadlines. It never reads your messages for advertising or profiling." },
      ],
    },
    finalCta: {
      headline: "Stop remembering everything.",
      subheadline: "Let NANTI remember what matters.",
      cta: "Try NANTI for free",
      finePrint: "No credit card required. Free forever.",
    },
  },
  howItWorks: {
    meta: {
      title: "How it works · NANTI",
      description:
        "Forward the message, or paste the conversation. NANTI reads it, and remembers what needs remembering.",
    },
    badge: "How it works",
    headline: "You don't create tasks. You just talk.",
    description:
      "Forward the message, or paste the conversation. NANTI reads it, and remembers what needs remembering.",
    steps: [
      { title: "Bring a conversation", desc: "Forward, paste or upload a screenshot." },
      { title: "NANTI understands it", desc: "It finds the people, commitments, dates and context." },
      { title: "NANTI reminds you", desc: "When something matters, NANTI brings it back." },
    ],
    context: {
      label: "Context",
      headline: "It's not just a reminder.",
      subheadline: "NANTI understands why.",
      description: "That's the difference between a reminder and memory.",
      conversation: "Pak Tom, nanti saya kirim invoice tanggal 28 ya.",
      extractions: [
        { label: "WHO", value: "Pak Tom" },
        { label: "WHAT", value: "Invoice" },
        { label: "WHEN", value: "28 August" },
        { label: "WHY", value: "You promised to send it." },
      ],
    },
    bringAnything: {
      headline: "Just bring it to NANTI.",
      subheadline: "Forward a conversation. Paste a message. Upload a screenshot.",
      options: [
        { label: "WHATSAPP", desc: "Forward the conversation." },
        { label: "SCREENSHOT", desc: "Upload what you captured." },
        { label: "TEXT", desc: "Paste anything you want NANTI to remember." },
      ],
    },
    cta: {
      headline: "Ready to try it?",
      subheadline: "Paste your first conversation. See what NANTI catches.",
      button: "Get started",
    },
  },
  business: {
    meta: {
      title: "For Business · NANTI",
      description: "Your business runs through WhatsApp. NANTI keeps the commitments moving.",
    },
    headline: "Your business runs through WhatsApp.",
    description:
      "NANTI keeps every promise moving — the quotation you owe a client, the sample a supplier promised, the approval you're still waiting on.",
    features: [
      {
        title: "Sales & client management",
        desc: "Every promise made to a client, tracked automatically. Know what's overdue, what's waiting, and what needs you today.",
      },
      {
        title: "Operations & projects",
        desc: "Production schedules, supplier follow-ups, team commitments — all visible in one place, pulled straight from the conversations where they actually happened.",
      },
    ],
    cta: "Get started",
  },
  personal: {
    meta: {
      title: "For Personal · NANTI",
      name: "description",
      description: "From work to family, remember what matters.",
    },
    headline: "Work isn't the only place you make promises.",
    description:
      "NANTI isn't just for work. The birthday you almost forgot, the thing you promised your kid, the appointment your mom mentioned once — if it's in a conversation, NANTI remembers it.",
    features: [
      {
        title: "Family commitments",
        desc: "Promises to your partner, your kids, your parents. NANTI catches them all.",
      },
      {
        title: "Personal follow-ups",
        desc: "That restaurant recommendation, that book someone mentioned, that appointment you need to book.",
      },
    ],
    cta: "Get started",
  },
  pricing: {
    meta: {
      title: "Pricing · NANTI",
      description: "Simple pricing for NANTI — your AI memory for WhatsApp.",
    },
    label: "Pricing",
    headline: "Simple pricing for every kind of work.",
    subtitle: "Start free. Upgrade when NANTI becomes indispensable.",
    plans: [
      {
        name: "Free",
        price: "Rp 0",
        period: "forever",
        desc: "For trying NANTI with the conversations that matter most.",
        features: ["Up to 50 tracked items", "AI conversation import", "Daily briefing", "1 workspace"],
        cta: "Get started",
        highlight: false,
      },
      {
        name: "Pro",
        price: "Rp 149K",
        period: "/month",
        desc: "For professionals who live in WhatsApp.",
        features: [
          "Unlimited tracked items",
          "AI conversation import",
          "Daily briefing & end-of-day sweep",
          "Ask NANTI AI assistant",
          "People & project memory",
          "Priority AI processing",
        ],
        cta: "Get started",
        highlight: true,
      },
      {
        name: "Business",
        price: "Custom",
        period: "",
        desc: "For teams that run on WhatsApp.",
        features: [
          "Everything in Pro",
          "Shared workspaces",
          "Team collaboration",
          "API access",
          "Custom AI training",
          "Dedicated support",
        ],
        cta: "Contact us",
        highlight: false,
      },
    ],
  },
  footer: {
    tagline: "AI memory for the conversations that matter.",
    product: [
      { label: "How it works", href: "/how-it-works" },
      { label: "Pricing", href: "/pricing" },
      { label: "For Business", href: "/business" },
      { label: "For Personal", href: "/personal" },
    ],
    resources: [
      { label: "Help Center", href: "/help" },
      { label: "Blog", href: "/blog" },
      { label: "Careers", href: "/careers" },
      { label: "Affiliates", href: "/affiliates" },
    ],
    legal: [
      { label: "Privacy Policy", href: "/legal/privacy" },
      { label: "Terms of Service", href: "/legal/terms" },
      { label: "Contact", href: "mailto:support@nanti.app" },
    ],
  },
  effects: {
    scrollReveal: true,
    floatingEmojis: true,
    parallaxShadows: true,
    cardHover: true,
  },
};

export function loadConfig(): SiteConfig {
  if (typeof window === "undefined") return defaultConfig;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultConfig;
    const saved = JSON.parse(raw) as Partial<SiteConfig>;
    return deepMerge(defaultConfig, saved);
  } catch {
    return defaultConfig;
  }
}

export function saveConfig(config: SiteConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function resetConfig(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

function deepMerge<T>(base: T, override: Partial<T>): T {
  const result = { ...base };
  for (const key of Object.keys(override) as Array<keyof T>) {
    const baseVal = base[key];
    const overVal = override[key];
    if (
      overVal &&
      typeof overVal === "object" &&
      !Array.isArray(overVal) &&
      baseVal &&
      typeof baseVal === "object" &&
      !Array.isArray(baseVal)
    ) {
      (result as Record<string, unknown>)[key] = deepMerge(
        baseVal as Record<string, unknown>,
        overVal as Record<string, unknown>,
      );
    } else if (overVal !== undefined) {
      (result as Record<string, unknown>)[key] = overVal;
    }
  }
  return result;
}
