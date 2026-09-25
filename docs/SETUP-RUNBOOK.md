# NANTI public-launch runbook

Updated: 2026-09-25

The product core is already deployed and technically validated. Do not add another major feature before completing the external launch setup below.

## Current production status

Already done:

- production Supabase schema repaired and recorded as migrations,
- per-user RLS and service-only access controls verified,
- reminder scheduler active every 5 minutes,
- Gemini primary model + retry policy + Flash-Lite fallback deployed,
- production AI smoke on commit `6add3e7`: **4/4 passed**,
- disposable production E2E on commit `6add3e7`: **9/9 passed**,
- owner admin role configured,
- production Site URL and Supabase redirect URLs configured,
- Google credentials and VAPID values are present in Vercel,
- WhatsApp, Calendar and browser Push are hidden from the initial public launch,
- legal/privacy production drafts and Indonesian operator checklist exist.

Still required before unrestricted public promotion:

1. production email / account recovery,
2. Gemini Paid Tier + privacy-capacity confirmation,
3. one real-device browser acceptance pass,
4. Indonesian legal / PSE operator completion.

---

## Step 1 — Production email and account recovery

This is the main authentication blocker.

Open Supabase project `qyfywekaorkwpzrvbrth`:

- Auth → SMTP / Email provider.
- Configure a real transactional provider such as Resend.
- Do not rely on the default development mail service for public users.

Verify all of these with a disposable account:

- signup confirmation arrives if confirmation is enabled,
- resend confirmation works,
- forgot-password email arrives,
- reset-password link opens the production NANTI reset page,
- the new password can be used to sign in.

Also verify that these mailboxes receive real mail:

- `support@nanti.app`
- `privacy@nanti.app`

NANTI already requires 12+ character new passwords and checks them against HIBP Pwned Passwords using k-anonymity.

Supabase's built-in Leaked Password Protection is still recommended as defense in depth when the plan permits it.

---

## Step 2 — Gemini Paid Tier and privacy capacity

The production app currently uses:

| Variable | Value |
|---|---|
| `GEMINI_MODEL` | `gemini-3.5-flash` |
| `GEMINI_FALLBACK_MODEL` | `gemini-3.5-flash-lite` |
| `GEMINI_THINKING_LEVEL` | `low` |
| `GEMINI_API_KEY` | production key |
| `GEMINI_PAID_TIER` | set to `true` only after paid-tier verification |

Before public customer conversations are processed:

1. Open Google AI Studio billing / rate limits.
2. Link the Gemini project to an active billing account / Paid Tier.
3. Confirm the project has non-zero production request quotas.
4. Confirm the API key belongs to that paid project.
5. In Vercel project **nanti-aja**, set:
   - `GEMINI_PAID_TIER=true`
6. Redeploy production.
7. Rerun:
   - production AI smoke,
   - disposable launch E2E.

Official references:

- https://ai.google.dev/gemini-api/docs/billing
- https://ai.google.dev/gemini-api/docs/rate-limits
- https://ai.google.dev/gemini-api/docs/models

The fallback model improves reliability but does not replace Paid Tier capacity or paid-service data handling.

---

## Step 3 — Initial launch integrations

### In-app reminders

Required for launch and already active.

- Supabase reminder dispatcher runs every 5 minutes.
- Scheduler authorization has been verified.
- In-app reminder delivery remains the initial supported reminder channel.

### Google Calendar

Implemented, but **hidden from the initial public launch**.

Do not enable `CALENDAR_LAUNCH_ENABLED` until a real Google account has completed:

- connect,
- OAuth callback,
- sync,
- Ask NANTI schedule question,
- disconnect.

Google client configuration should include:

```
https://qyfywekaorkwpzrvbrth.supabase.co/auth/v1/callback
https://nanti-app-new.vercel.app/api/auth/google
```

### Browser Push

Implemented, but **hidden from the initial public launch**.

Do not enable `PUSH_LAUNCH_ENABLED` until real-device delivery is tested.

### WhatsApp

Implemented partially but intentionally **not part of the initial public launch**.

Keep `WHATSAPP_LAUNCH_ENABLED=false` until the WhatsApp Cloud API workflow is operationally verified.

---

## Step 4 — Final real-browser acceptance

The automated production test has already verified:

- normal password sign-in,
- task create/edit/reschedule/complete/delete,
- cross-account RLS isolation,
- Waiting and Inbox isolation,
- typo-heavy Gemini extraction,
- account deletion / cascade cleanup.

One final UI pass still needs a human browser/device:

1. Open a private/incognito browser.
2. Create a brand-new account through the final email flow.
3. Finish onboarding.
4. Confirm the workspace is visually empty.
5. Send typo-heavy messages to Ask NANTI.
6. Verify create, answer, edit, reschedule, complete, reminder, Waiting/follow-up and clarify flows.
7. Open the app on a real phone and verify composer + keyboard behavior.
8. Download account export.
9. Delete the disposable account through Settings.
10. Review production errors afterward.

Calendar and Push are not part of this acceptance pass because their customer surfaces remain hidden.

---

## Step 5 — Legal / Indonesian operator setup

Use:

`docs/LEGAL-LAUNCH-CHECKLIST.md`

Before broad public promotion:

- identify the legal operator/entity and registered contact details,
- confirm PSE Lingkup Privat obligations and complete registration through OSS when applicable,
- have Indonesian counsel approve:
  - `src/routes/legal.terms.tsx`
  - `src/routes/legal.privacy.tsx`
  - signup consent wording,
  - liability / consumer wording,
  - age eligibility,
- document PDP processing purposes, retention, subprocessors and cross-border safeguards,
- define the incident-response owner,
- define the data-subject-request process,
- confirm `support@nanti.app` and `privacy@nanti.app` are monitored.

Do not remove the source-level legal-review comments until counsel has approved the final text.

---

## Optional QA — GitHub Actions live benchmark

The 66-case external live-model benchmark is supplemental QA, not a public-launch dependency because production smoke monitoring already runs from Supabase.

If you want it active:

GitHub → repository Settings → Secrets and variables → Actions → add:

- `GEMINI_API_KEY`

Without that secret, the workflow skips safely.

---

## Health check

Public health:

```bash
curl https://nanti-app-new.vercel.app/api/health
```

Detailed health:

```bash
curl https://nanti-app-new.vercel.app/api/health \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Important fields include:

```json
{
  "supabase": true,
  "ai": true,
  "aiModel": "gemini-3.5-flash",
  "aiFallbackModel": "gemini-3.5-flash-lite",
  "aiPrivacyReady": true,
  "cron": true
}
```

For unrestricted public launch, `aiPrivacyReady` should be `true`.

---

## Release gate

**Controlled/internal beta:** GO.

**Unrestricted public promotion:** wait until all four are complete:

- production SMTP / password recovery,
- Gemini Paid Tier with `aiPrivacyReady=true`,
- one real-device customer journey,
- legal/PSE/operator sign-off.
