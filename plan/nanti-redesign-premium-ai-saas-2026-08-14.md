# NANTI Redesign — Premium AI SaaS

Redesign only. All backend, AI server functions, routes, data models, store logic and task/commitment behaviour stay exactly as they are; UI and presentation get rebuilt on a new design system.

## 1. Design system

New tokens in `src/styles.css`, keeping the existing token names so every component keeps working:

- Background `#FFFFFF`, secondary surface `#F7F8F7`, text `#111111`, muted `#6B7280`, borders `#E7E9E7`
- Primary green `#25D366`, deep green `#128C7E` (used for text/CTA contrast), soft green `#E9F9EF` for accents
- Green used sparingly: CTAs, active nav, status accents. Overall impression stays white and calm
- Dark mode retuned to match, not removed
- Typography: one modern premium sans (loaded via `<link>` in `__root.tsx`), display sizes for marketing, medium-weight compact headings in the workspace, tight numeric hierarchy
- Motion: quiet fade/rise on scroll, no gradients, no glassmorphism

## 2. Public marketing site (new)

Currently `/` is the workspace. New split:

- `/` becomes the marketing homepage (public, SSR-friendly, own SEO head)
- The workspace moves to `/app` and its children (`/app/inbox`, `/app/waiting`, `/app/projects`, `/app/people`, `/app/ask`, `/app/settings`); old paths redirect so nothing breaks
- Marketing pages: `/product`, `/how-it-works`, `/for-business`, `/for-personal`, `/pricing`
- Marketing nav: NANTI · Product · How it works · For Business · For Personal · Pricing, with Log in and "Get started →". Hamburger on mobile

Homepage sections, in order: hero (eyebrow "AI WORK MEMORY FOR WHATSAPP", the two-line headline, both CTAs) → browser-framed product preview built from the real workspace UI (greeting, large "Ask NANTI anything…" input, day-at-a-glance stats, "NANTI noticed something" card with Follow up / Mark complete / Dismiss) → "You don't create tasks. You just talk." animated three-step flow (WhatsApp line → commitment detected → tracked) → the four capability sections (01 Remember, 02 Prioritize, 03 Follow up, 04 Act) → the "What am I forgetting?" AI-memory section with the three realistic findings and "Review all →" → use cases (business / professional / personal) → privacy and trust → final CTA "Stop remembering everything." → footer.

## 3. Workspace redesign

Same features, new shell and hierarchy.

- Sidebar: NANTI wordmark, Today / Inbox / Waiting / Projects / People, divider, Ask NANTI, divider, Settings, user profile pinned at the bottom. Compact, icon + label. Mobile gets a top bar plus slide-over menu and a large AI input rather than an app-style bottom bar
- Workspace home becomes AI-first: greeting, "What do you need to get done?", large AI input wired to the existing `askAssistant` function, suggested prompt chips, then day-at-a-glance, NANTI briefing, priority items, waiting. Existing end-of-day sweep and suggestion logic preserved
- Today: Priority / Overdue / Due today / Upcoming / Waiting / NANTI suggestion, compact rows with subtle borders instead of large cards
- Inbox: "Things NANTI found." with All / Commitments / Tasks / Follow-ups / Deadlines tabs; each row shows detection, person, project, due date, original quote, Track / Ignore
- Waiting: "Who are you waiting for?" — person-led rows with wait duration, Follow up / Mark received / Snooze, plus an AI warning style for unusually long waits
- Projects: elegant rows with open / waiting / overdue counts, click into the existing project workspace
- People: relationship memory — org, last conversation, open commitments, waiting-from, your commitments, recent activity
- Ask NANTI: full-height conversational workspace with header "Ask NANTI" / "Your work memory." and the seven suggested questions; same server function underneath
- Language: marketing site in English as specified; workspace keeps its current Indonesian labels unless you want it switched

## 4. Date bug

Reported values like "Terlambat 20680 hari" mean a date is resolving near the Unix epoch — the exact source is not yet confirmed, so step one is to inspect the stored state in the browser and reproduce it before changing formulas. Known contributing issues found in the code and to be fixed regardless:

- Demo dates are generated as relative offsets at first load and then frozen in localStorage, so they drift wrong on later days
- `toDate` builds dates by appending `"T00:00:00"` to the string, which silently yields an invalid date for any other format and falls back to 0 days
- The current date is computed from the browser's local clock, not Asia/Jakarta

Fix: a single date utility that parses defensively (returns "no due date" instead of a bogus number on unparseable input), computes "today" in Asia/Jakarta, and derives Today / Tomorrow / Yesterday / Due today / Overdue by X / Waiting X days from the real current date. Persisted state is migrated on load so existing data is repaired rather than discarded, and demo dates are recomputed relative to the actual current day.

## 5. Hydration fix

The server currently renders date-derived counts that differ from the client's stored state, causing a hydration error on load. Date-dependent and localStorage-dependent output will render only after hydration.

## Technical notes

- No database, schema, auth, or AI-logic changes; no new tables
- `nanti-ai.server.ts`, `nanti-ai.functions.ts`, `nanti-store.tsx` keep their APIs; only the store gains a date-migration step
- Route moves are additive with redirects, so existing links keep resolving
- Each route gets its own head() metadata
