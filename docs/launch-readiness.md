# NANTI Launch Readiness

Updated: 2026-09-24

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
- [x] Google Calendar OAuth uses one-time account-bound state.
- [x] Google OAuth tokens are server-only; clients can read only their own synced events.
- [x] Calendar Connect / Status / Sync / Disconnect implemented.
- [x] Calendar events feed Ask NANTI schedule context.
- [x] Push configuration is checked at runtime; unavailable Push is shown as unavailable instead of failing silently.
- [x] Reminder worker skips Push safely if VAPID keys are absent.
- [x] 96 deterministic messy-language cases remain a blocking CI gate.
- [x] Live-model benchmark expanded to 54 behavior cases.
- [x] Production AI smoke monitoring remains enabled.

## Owner / infrastructure requirements before public launch

These cannot be safely completed or verified through the currently authorized connectors.

### Supabase Auth

- [ ] Enable **Leaked Password Protection** in Supabase Auth. The Supabase security advisor currently reports it disabled.
- [ ] Verify production SMTP / custom email provider for signup confirmation and password recovery. Do not rely on Supabase's default development email service for a public launch.
- [ ] Verify the production Site URL and allowed redirect URLs include the final NANTI domain and welcome / password-recovery flows.
- [ ] Decide whether email confirmation is required. The product code works in either mode.
- [ ] Assign `app_metadata.role = admin` to the owner account if in-product AI Quality diagnostics should be visible. No account is currently marked admin.

### Google

- [ ] Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` exist in the production deployment.
- [ ] Add the final production `/api/auth/google` URL to the Google OAuth client redirect URIs.
- [ ] Confirm the OAuth consent screen is production-ready and requests only Calendar read-only scope.

### Push

- [ ] Verify `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` are configured in production.
- [ ] Test Push permission/subscription on at least iOS Safari/PWA, Android Chrome, and desktop Chrome.
- [ ] Confirm reminder cron authorization (`CRON_SECRET`) is configured.

## Pre-launch validation

- [ ] Create a fresh customer account from a private/incognito browser.
- [ ] Complete email confirmation if enabled, then onboarding.
- [ ] Confirm the new customer sees only their own empty workspace.
- [ ] Create a typo-heavy task with a named person and confirm the Person appears in memory.
- [ ] Edit the task to another person and confirm relationship history updates.
- [ ] Promote an Inbox clarification and confirm `person_id` persists.
- [ ] Connect Google Calendar, sync, ask “What do I have tomorrow?”, then disconnect.
- [ ] Enable Push (when configured) and receive a real test reminder.
- [ ] Run Ask NANTI core flows: create, answer, edit, reschedule, complete, reminder, Waiting follow-up, clarify.
- [ ] Verify mobile layout and keyboard/composer behavior.
- [ ] Review production runtime errors after the test session.

## Go / no-go

Public launch is **NO-GO** until the owner/infrastructure Auth items are verified, especially production email delivery and leaked-password protection.

Once those configuration items and the fresh-account end-to-end checks pass, the current launch scope can move to GO without WhatsApp.
