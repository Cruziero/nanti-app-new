@AGENTS.md

# NANTI for Claude Code

NANTI turns WhatsApp conversations into tracked commitments and reminders for Indonesian business users.

## Stack
- TanStack Start (React, Vite) on Vercel. Routes live in `src/routes`.
- Supabase (auth, Postgres with RLS, edge functions in `supabase/`).
- Gemini 3.5 Flash for extraction (`src/lib/*.server.ts`).
- Marketing copy lives in `src/config/site.ts` and `src/config/homepage.ts`.
- Remotion videos live in `my-video/`.

## Commands
- `npm run dev`: local dev server
- `npm run build`: production build (run before every PR)
- `npm run lint`
- `npm run verify:launch`: full quality suite and build

## Rules
- Lovable syncs `main`. Never force push or rewrite pushed history. Work on a `claude/*` branch and open a PR.
- Antislop applies **during** the work for every UI, copy and mobile task (owner decision). Load `.claude/skills/antislop` first, then the matching sub-skill.
- Indonesian is the primary audience. Marketing pages ship in Bahasa Indonesia (default) and English.
- No emoji as icons. Use `lucide-react`.
- Never claim features in `docs/product-benchmark.md` marked `NOT BUILT` or `CANNOT CLAIM` as live once the site goes public.
- Feature flags are in `src/lib/nanti-flags.ts`.
