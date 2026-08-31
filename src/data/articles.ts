export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  date: string;
  readTime: string;
}

export const articles: Article[] = [
  {
    slug: "never-lose-commitment-whatsapp",
    title: "How to Never Lose a Commitment in WhatsApp Again",
    excerpt: "Every day, important promises get buried in chat threads. Here's how to extract and track them automatically.",
    category: "Product",
    date: "2026-08-28",
    readTime: "4 min",
    content: `
## The Problem

You open WhatsApp. There are 47 unread messages. Somewhere in those conversations, a client promised to send payment, your supplier confirmed delivery for Thursday, and your partner asked you to pick up groceries.

By the end of the day, you'll forget at least half of them.

## Why It Happens

WhatsApp is where work and life happen. But it's not designed to track commitments. Messages scroll away. Conversations get buried. And the promises you made — or the ones others made to you — disappear into the noise.

## The Solution

Instead of trying to remember everything, let AI do it for you:

1. **Forward the conversation** to NANTI
2. **AI extracts** the commitments, people, and deadlines
3. **Get reminded** when the time comes

No more lost promises. No more missed follow-ups.

## Try It

NANTI is free to start. Forward your first conversation and see what it catches.
    `,
  },
  {
    slug: "whatsapp-business-productivity",
    title: "5 WhatsApp Productivity Tips for Small Businesses",
    excerpt: "Your business runs on WhatsApp. These tips help you stay on top of every client promise and supplier follow-up.",
    category: "Business",
    date: "2026-08-25",
    readTime: "5 min",
    content: `
## 1. Create a Dedicated Thread for Each Client

Keep conversations organized. When you know which thread belongs to which client, tracking commitments becomes easier.

## 2. Use Voice Messages for Quick Follow-Ups

Sometimes typing takes too long. Voice messages capture context faster — and AI can extract commitments from them too.

## 3. Forward Key Conversations to Your Memory Tool

Don't rely on WhatsApp's search. Forward important conversations to a tool like NANTI that extracts and tracks the commitments automatically.

## 4. Set Reminders for Follow-Ups

Every time someone promises something, set a reminder. Better yet, let AI do it for you.

## 5. Review Your Commitments Weekly

At the end of each week, review what you promised and what's still pending. This prevents things from falling through the cracks.

## The Bottom Line

WhatsApp is powerful, but it's not a task manager. Bridge the gap with smart extraction and reminders.
    `,
  },
  {
    slug: "ai-memory-daily-life",
    title: "Using AI Memory to Remember What Matters in Daily Life",
    excerpt: "From birthdays to dinner plans, AI can help you remember the small promises that keep relationships strong.",
    category: "Personal",
    date: "2026-08-22",
    readTime: "3 min",
    content: `
## It's Not Just About Work

We make promises every day — to our partners, kids, friends, and family. "I'll pick up the kids." "Let's have dinner this weekend." "I'll call you tomorrow."

These small commitments matter. They keep relationships strong.

## The Problem

When life gets busy, these promises slip through the cracks. You forget to call. You miss the dinner plan. You show up late.

## How AI Helps

Tools like NANTI can extract commitments from your WhatsApp conversations and remind you when the time comes:

- Birthday mentions → reminder before the date
- Dinner plans → reminder on the day
- Promises to call → reminder at the right time

## Start Small

Forward one conversation to NANTI. See what it catches. You might be surprised how many commitments are hiding in your chats.
    `,
  },
  {
    slug: "getting-started-nanti",
    title: "Getting Started with NANTI: A Step-by-Step Guide",
    excerpt: "Set up your AI memory in 2 minutes. Here's how to start tracking commitments from your WhatsApp conversations.",
    category: "Tutorial",
    date: "2026-08-19",
    readTime: "4 min",
    content: `
## Step 1: Sign Up

Create your free account at nanti-aja.vercel.app. No credit card required.

## Step 2: Connect WhatsApp

Forward a conversation to NANTI. You can:
- Forward a WhatsApp chat directly
- Paste a conversation
- Upload a screenshot

## Step 3: Review Extracted Items

NANTI will extract:
- **Who** is involved
- **What** was promised
- **When** it's due

Review and confirm each item.

## Step 4: Get Reminders

When the deadline arrives, NANTI will remind you. You can also:
- Check your daily briefing
- View all tracked items
- Ask the AI assistant about your commitments

## That's It

You're now tracking commitments without any extra work. Just forward conversations and let NANTI do the rest.
    `,
  },
  {
    slug: "anonymize-whatsapp-import",
    title: "How NANTI Anonymizes Your WhatsApp Imports",
    excerpt: "Privacy matters. Here's how NANTI protects your data while extracting commitments from your conversations.",
    category: "Privacy",
    date: "2026-08-16",
    readTime: "3 min",
    content: `
## Your Data, Your Control

When you forward a conversation to NANTI, privacy is built in from the start.

## What We Extract

NANTI only extracts:
- Names (who's involved)
- Commitments (what was promised)
- Deadlines (when it's due)
- Context (why it matters)

## What We Don't Store

- Raw conversation text (deleted after extraction)
- Message metadata
- Contact information
- Chat histories

## How It Works

1. You forward a conversation
2. AI extracts commitments in real-time
3. Raw text is immediately deleted
4. Only structured commitment data remains

## You're in Control

- Delete your data anytime
- No data is sold or shared
- End-to-end encryption in transit
- AI reads patterns, not people

## Try It

See for yourself. Forward a conversation and watch how NANTI protects your privacy while helping you remember what matters.
    `,
  },
];
