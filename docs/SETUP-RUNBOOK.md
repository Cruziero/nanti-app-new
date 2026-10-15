# NANTI public-launch runbook

Updated: 2026-10-14

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

Implemented, but **hidden from the initial public launch**. The code is
complete; the only thing missing is one redirect URI in the Google Cloud
console.

`src/lib/nanti-calendar.functions.ts:54` and `src/routes/api/auth/google.tsx:63`
both build the redirect URI from the request origin, so on production the value
is:

```
https://nanti.site/api/auth/google
```

Verified 2026-10-15 by requesting Google's authorize endpoint with the deployed
`GOOGLE_CLIENT_ID` and that exact `redirect_uri`: Google returned
`redirect_uri_mismatch`. It returned the same error for the previous
`https://nanti-app-new.vercel.app/api/auth/google`, so neither URI has ever been
registered. Add the first one under
https://console.cloud.google.com/apis/credentials → OAuth 2.0 Client IDs →
Authorized redirect URIs.

Keep the Supabase callback as well. It is already registered and is what Google
*sign-in* uses, so removing it would break login:

```
https://qyfywekaorkwpzrvbrth.supabase.co/auth/v1/callback
```

Only then turn on `CALENDAR_LAUNCH_ENABLED` at
`src/routes/app.settings.tsx:86`, and only after a real Google account has
completed connect, OAuth callback, sync, an Ask NANTI schedule question, and
disconnect.

### Browser Push

Implemented, and **live**: `PUSH_LAUNCH_ENABLED` at
`src/routes/app.settings.tsx:85` is `true`, so "Push Notifications" is a
selectable reminder channel in Settings. `GET /api/push/config` returns
`configured: true` with the public key, all three VAPID keys are set in Vercel
for the production target, and `sendPushNotification` in
`src/routes/api/cron/check-reminders.tsx:434` is not gated by the flag.

The one open item is real-device validation: subscribing from a phone and
confirming a notification arrives cannot be done from the build environment.

### WhatsApp (official Cloud API number)

The webhook, parser and senders are implemented. What is missing is the Meta
console setup and eight environment variables. Meta-side first, Vercel-side
second.

#### What the code expects

Endpoint, from `src/routes/api/webhooks/whatsapp.tsx`:

```
https://nanti.site/api/webhooks/whatsapp
```

| Variable | Where it comes from |
|---|---|
| `WHATSAPP_VERIFY_TOKEN` | You invent this string. The GET handshake only accepts when `hub.verify_token` equals it. |
| `WHATSAPP_APP_SECRET` | Meta dashboard → Settings → Basic → App Secret. The POST handler checks `x-hub-signature-256` against it and returns 401 without a valid signature, 503 if the variable is missing entirely. |
| `WHATSAPP_PHONE_NUMBER_ID` | Meta dashboard → WhatsApp → API Setup. |
| `WHATSAPP_ACCESS_TOKEN` | System User token (see below), not the 24-hour temporary one. |
| `WHATSAPP_GRAPH_VERSION` | Read at `webhooks/whatsapp.tsx:1411` and `cron/check-reminders.tsx:486`, both defaulting to `v26.0`. These are the only two outbound call sites. |
| `WHATSAPP_REMINDER_TEMPLATE_NAME` | **No code default**, only `.env.example` shows `nanti_reminder`. If it is unset, reminders inside the 23.5-hour service window still send as plain text, but anything outside it is skipped silently (`check-reminders.tsx:540`) and only in-app/push fire. Set it explicitly. |
| `WHATSAPP_REMINDER_TEMPLATE_LANGUAGE` | Defaults to `id` in code. |
| `VITE_NANTI_WHATSAPP_NUMBER` | Your new number, digits only, `628…`. Displayed in Settings. |

#### Note on `src/lib/nanti-whatsapp.ts`

That module is imported by nothing. Its `sendWhatsAppMessage` and
`sendWhatsAppTemplate` are dead code and it pins its own base URL to
`v18.0`. The two call sites that actually send are the webhook reply at
`webhooks/whatsapp.tsx:1415` and the reminder at
`cron/check-reminders.tsx:546`. Do not use `nanti-whatsapp.ts` as the
reference for what a configured setup does.

#### Meta console, in order

1. **Free the number.** A phone number can be on only one WhatsApp surface.
   If the new number is already on WhatsApp Personal or WhatsApp Business,
   delete that account first (WhatsApp → Settings → Account → Delete account),
   or Meta will refuse to attach it.
2. **developers.facebook.com → Create app → type Business.**
3. **Add the WhatsApp product** to the app. Meta issues a test number and a
   temporary token that expires in 24 hours. Do not put the temporary token in
   Vercel.
4. **Business Manager → Business Settings → Users → System Users.**
   Create a system user, assign it the WhatsApp Business Account and the phone
   number as assets, then generate a token with `whatsapp_business_messaging`,
   `whatsapp_business_management` and `business_management`. This token is the
   `WHATSAPP_ACCESS_TOKEN`.
5. **Attach your new number** to the WhatsApp Business Account. Meta sends a
   six-digit code by SMS or voice, so the number must be reachable. Landlines
   work if they can take the call.
6. **Business verification** in Business Manager. This is the slow part and it
   is what separates a real number from a test one. Expect to supply legal
   business name, address, website, a support email and possibly registration
   paperwork.
7. **Configure the webhook:** WhatsApp → Configuration → Callback URL, paste
   the endpoint above, set Verify token to the same string you will store as
   `WHATSAPP_VERIFY_TOKEN`, confirm, then subscribe to the **messages** field.
8. **Create the reminder template** in the WABA: name `nanti_reminder`,
   category Utility, language Indonesian. Proactive reminders can only be sent
   as an approved template, and `/api/cron/check-reminders` sends one as soon
   as WhatsApp reminders are switched on. A rejected or missing template is
   the most common reason reminders silently stop.

#### Making it official

Three separate things get conflated here, and only the first is a blocker.

1. **Live mode.** Meta's own troubleshooting list says: "Make sure your app is
   in Live mode; some webhooks will not be sent if your app is in Dev mode."
   Development mode only delivers events for Meta's test number and test
   users, so a real customer number will not work until the app is published.
   Left nav → Publish. Publishing needs an app icon (512 to 1024 px, under
   5 MB; `public/icon-512.png` fits), a Privacy Policy URL
   (`https://nanti.site/legal/privacy`, live) and a data deletion URL
   (`https://nanti.site/app/settings`, which has real account deletion wired
   to `tests/account-export.cjs`).
2. **App Review is not required here.** The permissions doc states: "If you
   are a direct developer and only access your own business data, you do not
   need to undergo App Review or obtain Advanced access for any permissions."
   The App Review doc repeats it: "if you are using the API for yourself as a
   Direct Developer, you do not need Advanced access or app review." App
   Review exists for Tech Providers and Solution Partners serving other
   businesses, which this deployment is not, so the "Become a Tech Provider"
   card on the dashboard can be ignored and the three WhatsApp permissions
   are already Standard Access on a Business app. Earlier notes in this repo
   claimed App Review was needed; that was wrong.
3. **Business verification** is separate from both, and is what raises the
   messaging limit tier. Business Manager → Security Centre. Expect to supply
   legal business name, address, website, a support email and possibly
   registration paperwork. Without it the account stays on the low tier,
   which is enough for launch volume but not for scale.

Sources, checked 2026-10-15:
https://developers.facebook.com/docs/whatsapp/cloud-api/guides/set-up-webhooks/
and
https://developers.facebook.com/documentation/business-messaging/whatsapp/permissions

#### Then Vercel

1. Set the variables above on project **nanti-aja**, targets
   production and preview. Three were already created on 2026-10-15:
   `WHATSAPP_VERIFY_TOKEN` (a generated string held in the operator's secret
   store; it is the exact value to paste into Meta's Verify token field),
   `WHATSAPP_REMINDER_TEMPLATE_NAME` = `nanti_reminder`, and
   `WHATSAPP_REMINDER_TEMPLATE_LANGUAGE` = `id`. Still needed from Meta:
   `WHATSAPP_APP_SECRET`, `WHATSAPP_PHONE_NUMBER_ID`,
   `WHATSAPP_ACCESS_TOKEN`, plus `VITE_NANTI_WHATSAPP_NUMBER` (your number,
   digits only).
2. Redeploy.
3. Confirm the handshake with the token from step 1:

   ```
   https://nanti.site/api/webhooks/whatsapp?hub.mode=subscribe&hub.challenge=12345&hub.verify_token=THE_TOKEN
   ```

   Verified 2026-10-15: it returns `200` with the challenge echoed back, and
   `403` for a wrong token or for a mode other than `subscribe`. A bare GET
   with no query string still returns `403 Forbidden`, which is the expected
   answer outside a Meta handshake.
4. Message the number from a normal phone. Watch the Vercel function logs for
   the signature check, then confirm the message landed in the workspace.
5. Only after that, flip `WHATSAPP_LAUNCH_ENABLED` to `true` at
   `src/routes/app.settings.tsx:87`. The flag gates the Settings surface at
   lines 149 and 1053; it does not gate the webhook, which is live as soon as
   the environment variables exist.

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
curl https://nanti.site/api/health
```

Detailed health:

```bash
curl https://nanti.site/api/health \
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
