# NANTI launch audit — 12 October 2026

Audited main at adcf299. Decision: technical core passes local release checks; unrestricted launch remains unverified.

## Confirmed today
- Public homepage, health, welcome, reset-password, Terms and Privacy routes return HTTP 200.
- Live browser renders homepage and login. The free-trial CTA navigated to login in this browser; a fresh signup/onboarding journey is still required.
- Supabase project nanti-app is ACTIVE_HEALTHY.
- Four accounts exist and all four have confirmed email addresses. This is not a user-growth metric.
- No public table lacks RLS. Policy correctness was not exhaustively retested today.
- Reminder cron is active every five minutes; last four cron SQL invocations succeeded. This does not establish downstream HTTP success or actual notification delivery.
- npm run verify:launch passed: semantic checks, 146 quality fixtures, live-eval fixture configuration, 16 AI transport tests, seven export tests and production build. The 66-case live-model benchmark was not run.
- Security advisor reports pg_net in public and built-in leaked-password protection disabled. Existing launch documentation records pg_net as non-relocatable and built-in protection as plan-limited; no schema or billing changes were made.

## Launch problems and completion criteria
1. Marketing promises disabled integrations. Homepage promises direct WhatsApp forwarding, WhatsApp reminder delivery, Calendar and widgets. Pricing also includes WhatsApp integration. Replace with Ask NANTI, pasted conversations, screenshots, tasks, Waiting and in-app reminders. Label future integrations clearly.
2. Homepage claims information is never shared with third parties. Replace with accurate processor disclosure consistent with Privacy Policy; distinguish sale from necessary processing.
3. Connected Resend account returns no domains. Confirm the owned sending domain and DNS control, add/verify domain, configure Supabase SMTP only after verification, then test fresh signup, resend and full password recovery from real inboxes. Do not switch to an unverified sender.
4. Gemini Paid Tier remains unverified. Confirm billing and quotas for the project behind the production key; only then set GEMINI_PAID_TIER=true and rerun live smoke/E2E. A flag is not billing proof.
5. Full fresh-account journey and real-phone keyboard/layout/export/deletion acceptance remain unverified.
6. Legal operator identity, monitored support/privacy mailboxes and legal/PSE checklist completion need operator evidence. This audit does not independently assess legal obligations.

## Access and repository blockers
- Actual Vercel project: nanti-aja, prj_NNKLHMOFUMkrZnKIlCV5zfodKd8Y; owning team team_IYktkS4bZ4LNFDQuORQrHaKW, scope wunder2.
- Project listing works, but explicit project/deployment reads return 403 for wunder2. Connected credentials do not authorize that scope. Vercel CLI is not installed locally; no independent CLI credentials were established. Deployment/env/runtime-log changes are blocked.
- AGENTS.md requires reading antislop.md and skills/antislop-copywriting/SKILL.md before copy work. Both are absent in this checkout and a workspace search found no replacements. User chose applying the rules during edits. Copy changes are pending those missing instructions.

## Fastest completion order
1. Restore Vercel access for wunder2 / nanti-aja and the missing repository copy guidance.
2. Correct public claims while configuring verified transactional email.
3. Verify Gemini paid billing, set production readiness flag, deploy exact reviewed commit.
4. Run production smoke/E2E, then a fresh-account real-device acceptance pass.
5. Record operator/legal sign-off and begin public promotion.

No production environment, billing, database schema or public copy was changed by this audit.
