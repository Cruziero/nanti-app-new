# NANTI Launch Readiness

Updated: 2026-09-25

**Stage: Release Candidate / External Launch Setup**

## Initial public launch scope

NANTI launches as a chat-first personal work assistant with:

- Ask NANTI
- Tasks / Today
- Inbox clarification
- Waiting / follow-up
- People and work-context memory
- in-app reminders and daily briefing
- account registration and onboarding
- per-user language, entity-alias and routine memory
- authenticated data export and account deletion

The following integrations are intentionally **not part of the initial public launch scope** until each has real-device / real-account validation:

- WhatsApp
- Google Calendar
- browser Push notifications

Their implementation remains in the codebase behind launch flags.

## Code-complete foundations

- [x] Email/password signup supports both confirmation-required and instant-session Supabase modes.
- [x] Dedicated check-email and password-reset flows.
- [x] Google sign-in implementation retained.
- [x] New passwords require at least 12 characters.
- [x] Signup and password reset check new passwords against HIBP Pwned Passwords with k-anonymity.
- [x] Signup requires explicit Terms acceptance and Privacy acknowledgement.
- [x] Customer Settings is authentication-protected.
- [x] Customer-owned rows are account-scoped with RLS.
- [x] Service-only tables revoke normal client access.
- [x] Internal AI quality diagnostics require admin app metadata.
- [x] Owner admin role is configured in production.
- [x] People memory and person activity persist through task / Waiting / Inbox flows.
- [x] Customer data export is authenticated and excludes OAuth, delivery and link-code secrets.
- [x] Account deletion removes the auth user and cascades NANTI-owned data.
- [x] Reminder dispatch is active from Supabase every 5 minutes.
- [x] WhatsApp delivery is hard-disabled for the initial launch.
- [x] Calendar and Push customer surfaces are hidden for the initial launch.
- [x] 146 deterministic messy-language cases are a blocking CI gate.
- [x] 66-case live-model benchmark exists as supplemental scheduled QA.
- [x] Production AI smoke monitoring is scheduled from Supabase.
- [x] Gemini transport has bounded retries for 408/429/5xx/timeouts.
- [x] Gemini 3.5 Flash has a stable 3.5 Flash-Lite fallback for retryable provider failures.
- [x] Assistant target IDs are normalized server-side so answer/create/clarify/teach modes cannot mutate an item accidentally.
- [x] Production schema drift was repaired and recorded as reproducible migrations.
- [x] Social share image and canonical social metadata exist.
- [x] /api/health exposes detailed readiness only with `Authorization: Bearer <CRON_SECRET>`.
- [x] Terms and Privacy production drafts were rewritten for the Indonesian launch context.
- [x] Indonesian legal/PDP/PSE operator checklist exists at `docs/LEGAL-LAUNCH-CHECKLIST.md`.

## Verified production state

Verified on production on 2026-09-25:

- [x] Current production deployment passed GitHub CI and Vercel deployment gates.
- [x] Reminder scheduler authorization works and the reminder endpoint returns HTTP 200.
- [x] Existing production accounts are email-confirmed.
- [x] Production AI smoke suite on commit `6add3e7`: **4 / 4 passed, score 100%, 0 critical failures**.
- [x] Disposable production E2E on commit `6add3e7`: **9 / 9 passed**.
- [x] Disposable E2E verified:
  - normal password sign-in,
  - cross-account task RLS isolation,
  - task create/edit/reschedule/complete/delete,
  - Waiting isolation,
  - Inbox isolation,
  - real Gemini typo-heavy extraction,
  - account deletion and cascade cleanup.
- [x] Live typo case `Saya beosok harus oulang dr puncak jam 10 pagi` was successfully interpreted in production.
- [x] Nine previously missing launch tables are present with RLS.
- [x] Five published blog rows are seeded.
- [x] `pg_net` security-advisor warning was investigated: this Supabase installation marks the extension non-relocatable, so it should not be moved with `ALTER EXTENSION`.

## Remaining external launch blockers

These are the only items still preventing an unrestricted public launch.

### 1. Production email / account recovery — BLOCKER

- [ ] Configure a real transactional email provider for Supabase Auth.
- [ ] Verify a new-user confirmation email reaches a real inbox if confirmation is enabled.
- [ ] Verify password-reset email delivery end to end.
- [ ] Confirm `support@nanti.app` and `privacy@nanti.app` receive mail.

A Resend integration is available and can be used once connected.

### 2. Gemini billing / privacy capacity — BLOCKER

Production currently has a working primary + fallback model path, but public customer conversation data should not rely on Gemini Free Tier.

- [ ] Link the Gemini API project to active billing / Paid Tier.
- [ ] Confirm AI Studio shows the project on the intended paid usage tier and has non-zero request quotas.
- [ ] Set `GEMINI_PAID_TIER=true` in production only after billing / paid-tier data handling is verified.
- [ ] Rerun the production AI smoke and disposable E2E after that environment change.

Useful checks:
- https://ai.google.dev/gemini-api/docs/billing
- https://ai.google.dev/gemini-api/docs/rate-limits

### 3. Supabase built-in leaked-password protection — HARDENING

Supabase's advisor still reports its built-in leaked-password protection disabled on the current plan.

- [x] NANTI mitigates this in the product by checking new passwords against the HIBP corpus and requiring 12+ characters.
- [ ] When the Supabase plan permits it, also enable Supabase Auth Leaked Password Protection for defense in depth.

This no longer blocks internal beta, but should be enabled before a larger public rollout when available.

### 4. Final manual browser/device acceptance — BLOCKER FOR BROAD PROMOTION

Automated production E2E is green, but the following UI behavior still requires a real browser/device:

- [ ] Complete one fresh-account signup in an incognito browser using the final email configuration.
- [ ] Complete onboarding and confirm the workspace is visually empty for the new account.
- [ ] Verify Ask NANTI composer/keyboard behavior on a real phone.
- [ ] Verify responsive Today / Inbox / Waiting / Settings pages on mobile.
- [ ] Download an export from that disposable account, then delete it through the UI.
- [ ] Review production errors after that session.

Calendar and Push do **not** block the initial launch because their public surfaces remain hidden.

### 5. Legal / Indonesian operator setup — BLOCKER

- [ ] Identify the legal operator/entity and registered contact details used for NANTI.
- [ ] Have Indonesian counsel review the Terms, Privacy Policy, signup consent wording and consumer-liability language.
- [ ] Confirm PSE Lingkup Privat registration obligations and complete registration through OSS when applicable.
- [ ] Document PDP processing inventory, retention, subprocessors and cross-border safeguards.
- [ ] Confirm incident-response ownership and data-subject-request handling.
- [ ] Remove the source-level legal-review markers only after counsel approves the documents.

See `docs/LEGAL-LAUNCH-CHECKLIST.md`.

## Non-blocking post-launch / later activation

- [ ] Add `GEMINI_API_KEY` to GitHub Actions if the nightly 66-case external live-model benchmark should run there. Production smoke monitoring already runs independently.
- [ ] Validate Google Calendar with a real OAuth account before enabling `CALENDAR_LAUNCH_ENABLED`.
- [ ] Validate Push on supported real devices before enabling `PUSH_LAUNCH_ENABLED`.
- [ ] Finish WhatsApp Cloud API operational verification before enabling `WHATSAPP_LAUNCH_ENABLED`.

## Release decision

**Technical core: GO for controlled/internal beta.**

**Unrestricted public promotion: NO-GO until production email, paid Gemini privacy/capacity, one real-device customer journey, and legal/PSE operator items are completed.**

No additional major product feature should be added before those launch blockers are closed.
