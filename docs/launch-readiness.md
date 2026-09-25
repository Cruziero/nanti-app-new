# NANTI Launch Readiness

Updated: 2026-09-25

**Stage: Release Candidate / Pre-launch Hardening**

## Launch scope

NANTI launches as a chat-first personal work assistant with:
- Ask NANTI
- Tasks / Today
- Inbox clarification
- Waiting / follow-up
- People memory
- reminders and daily briefing
- Google Calendar context
- account registration and onboarding
- per-user language/entity/routine memory

WhatsApp is intentionally **not part of the launch scope** and remains hidden behind a feature flag.

## Code-complete launch foundations

- [x] Email/password registration supports both instant-session and confirmation-required Supabase modes.
- [x] Dedicated confirmation-email state with resend.
- [x] Google sign-in path retained.
- [x] Password minimum is 8 characters for signup and reset.
- [x] New-user identity pre-fills onboarding instead of using a development-specific name.
- [x] Customer Settings is available only after authentication/onboarding.
- [x] Customer rows are account-scoped with RLS.
- [x] Internal AI quality diagnostics require admin app metadata and are hidden from customers.
- [x] People memory is enforced by task/waiting server writes, edits, and Inbox promotion.
- [x] Person activity is deduplicated and persisted.
- [x] WhatsApp controls/reminder channel are hidden for launch.
- [x] Development-only Restore demo data control removed from customer Settings.
- [x] Customer data export is available from Settings and now covers WhatsApp/push metadata without exposing OAuth, WhatsApp, link-code, or push delivery secrets.
- [x] Customer account deletion removes the auth account and cascades NANTI-owned data.
- [x] Google Calendar OAuth uses one-time account-bound state.
- [x] Calendar sync paginates Google results and purges stale/cancelled events from NANTI schedule memory.
- [x] Google OAuth tokens are server-only; clients can read only their own synced events.
- [x] Calendar Connect / Status / Sync / Disconnect implemented.
- [x] Calendar events feed Ask NANTI schedule context.
- [x] Push configuration is checked at runtime; unavailable Push is shown as unavailable instead of failing silently.
- [x] Push subscription ownership is protected against cross-account endpoint takeover.
- [x] Customers can send an authenticated test Push from Settings after subscribing.
- [x] Reminder worker skips Push safely if VAPID keys are absent.
- [x] Supabase reminder dispatch is active every 5 minutes and recent HTTP responses are 200.
- [x] WhatsApp delivery is hard-disabled server-side for launch, not merely hidden in the UI.
- [x] Service-only tables have explicit deny-all client RLS policies in addition to revoked client grants.
- [x] 146 deterministic messy-language cases remain a blocking CI gate.
- [x] Live-model benchmark expanded to 66 behavior cases.
- [x] Production AI smoke monitoring remains enabled.
- [x] Social share image `/og-image.png` exists; OG/Twitter tags share one canonical site URL.
- [x] `/api/health` reports integration readiness (append `?key=<CRON_SECRET>` for per-integration booleans).

## Owner / infrastructure requirements before public launch

These cannot be safely completed or verified through the currently authorized connectors.

### AI provider (Google Gemini)

- [x] OpenAI removed entirely; Google Gemini is the only provider (Phase 65).
- [ ] Set `GEMINI_API_KEY` in the production deployment (free key from https://aistudio.google.com/apikey). **Without it, every AI feature is disabled.**
- [ ] Set `GEMINI_MODEL=gemini-3.5-flash` (optional; defaults to `gemini-3.5-flash`).
- [ ] Remove the obsolete `OPENAI_API_KEY` variable from Vercel and local `.env`.
- [ ] Confirm one Ask NANTI create + answer flow works in production after deploy.
- [ ] Add `GEMINI_API_KEY` as a GitHub Actions secret. The 2026-09-25 scheduled workflow completed but explicitly skipped the live-model benchmark because this secret is absent.

### Supabase Auth

- [ ] Enable **Leaked Password Protection** in Supabase Auth. The Supabase security advisor currently reports it disabled.
- [ ] Verify production SMTP / custom email provider for signup confirmation and password recovery. Do not rely on Supabase's default development email service for a public launch.
- [ ] Verify the production Site URL and allowed redirect URLs include the final NANTI domain and welcome / password-recovery flows.
- [ ] Decide whether email confirmation is required. The product code works in either mode.
- [ ] Assign `app_metadata.role = admin` to the owner account if in-product AI Quality diagnostics should be visible. No account is currently marked admin. Use `raw_app_meta_data` when updating `auth.users`, not `raw_user_meta_data`.

### Google

- [ ] Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` exist in the production deployment.
- [ ] Add the final production `/api/auth/google` URL to the Google OAuth client redirect URIs.
- [ ] Confirm the OAuth consent screen is production-ready and requests only Calendar read-only scope.

### Push

- [ ] Verify `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` are configured in production.
- [ ] Test Push permission/subscription on at least iOS Safari/PWA, Android Chrome, and desktop Chrome using the new **Send test notification** action.
- [x] Reminder scheduler is active in Supabase every 5 minutes and is successfully reaching the production endpoint.
- [x] Scheduler authorization is working against the production reminder endpoint.

## Pre-launch validation

- [ ] Create a fresh customer account from a private/incognito browser.
- [ ] Complete email confirmation if enabled, then onboarding.
- [ ] Confirm the new customer sees only their own empty workspace.
- [ ] Download the account export and verify it contains only that customer's NANTI data.
- [ ] Delete a disposable test account and verify its NANTI data is removed.
- [ ] Create a typo-heavy task with a named person and confirm the Person appears in memory.
- [ ] Edit the task to another person and confirm relationship history updates.
- [ ] Promote an Inbox clarification and confirm `person_id` persists.
- [ ] Connect Google Calendar, sync, ask “What do I have tomorrow?”, then disconnect.
- [ ] Enable Push (when configured) and receive a real test reminder.
- [ ] Run Ask NANTI core flows: create, answer, edit, reschedule, complete, reminder, Waiting follow-up, clarify.
- [ ] Verify mobile layout and keyboard/composer behavior.
- [ ] Confirm `https://<domain>/og-image.png` returns 200 and social previews render.
- [ ] Call `https://<domain>/api/health` with `Authorization: Bearer <CRON_SECRET>` and confirm required `checks` are `true`.
- [ ] Review production runtime errors after the test session.

## Go / no-go

Public launch is **NO-GO** until the owner/infrastructure Auth items are verified, especially production email delivery and leaked-password protection.

### Verified production state

- Reminder scheduler: active every 5 minutes with recent HTTP 200 responses.
- Existing accounts: all current accounts are email-confirmed.
- Calendar connections: no customer connection has been exercised yet.
- Push subscriptions: no customer browser has been subscribed yet, so real-device delivery remains unverified.
- Database schema: the nine missing launch tables are now present with RLS; blog has 5 published rows; reminder dispatcher is still active.
- AI production smoke runs: still 0 stored runs as of 2026-09-25 08:55 WIB; this monitor needs its first successful execution.
- GitHub live-model eval: scheduled workflow currently skips because `GEMINI_API_KEY` is not configured as an Actions secret.
- Supabase security advisor: leaked-password protection remains disabled. `pg_net` is also installed in `public`; treat that as post-launch infrastructure hygiene unless your Supabase configuration allows relocating it safely.

Once those configuration items and the fresh-account end-to-end checks pass, the current launch scope can move to GO without WhatsApp.
