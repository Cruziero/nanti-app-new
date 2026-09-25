# NANTI launch runbook

Six steps, in order. Everything else in code is done. Work top to bottom.

---

## Step 1: Turn the AI on (Vercel)

Without this NANTI runs but cannot extract or answer anything.

1. Get a free key: https://aistudio.google.com/apikey → **Create API key** → copy it.
2. Open Vercel env vars: https://vercel.com/dashboard → project **nanti-app-new** → **Settings** → **Environment Variables**.
3. Add these (Production, Preview and Development):

| Name | Value |
|---|---|
| `GEMINI_API_KEY` | *(paste the key from item 1 above)* |
| `GEMINI_MODEL` | `gemini-3.5-flash` |

4. Find any existing `OPENAI_API_KEY` → **Delete**.
5. **Deployments** tab → top deployment → **⋯** → **Redeploy**.

Verify: open https://nanti-app-new.vercel.app/api/health → `"ok": true`.

After Step 4, verify the detailed integration checks with an Authorization header:

```bash
curl https://nanti-app-new.vercel.app/api/health \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

The detailed response should show the configured integrations as `true`.

---

## Step 2: Supabase

Open https://supabase.com/dashboard → project **qyfywekaorkwpzrvbrth**.

### 2.1 Database schema — completed on production

The live Supabase project was audited on 2026-09-25. Nine tables were genuinely missing because historical migrations had drifted from the deployed schema.

This is now fixed in production. The missing tables were created with RLS and the two missing foreign-key indexes were added. The blog was seeded with 5 published articles.

For future environments, the corrective migration is:

`supabase/migrations/20260925021000_surgical_launch_backfill.sql`

**Do not paste or run** `supabase/manual/20260925_backfill_missing_tables.sql` on the current production project. It contains old definitions for tables that have since evolved and is retained only as historical audit material.

Verified production objects now include:

- `reminders`
- `invoices`
- `ai_clarifications`
- `blog_articles`
- `audit_log`
- `user_preferences`
- `reminder_preferences`
- `notification_devices`
- `whatsapp_connections`
- private `dispatch_nanti_reminders` function

The reminder dispatcher is active every 5 minutes and recent requests return HTTP 200.

### 2.2 Auth URLs

https://supabase.com/dashboard/project/qyfywekaorkwpzrvbrth/auth/url-configuration

- **Site URL**: `https://nanti-app-new.vercel.app`
- **Redirect URLs**, add both:
  - `https://nanti-app-new.vercel.app/welcome`
  - `https://nanti-app-new.vercel.app/auth/reset-password`

### 2.3 Security toggles

https://supabase.com/dashboard/project/qyfywekaorkwpzrvbrth/auth/providers/email

- **Confirm email**: decide ON (recommended, real sign-up) or OFF (if you want instant signup for testing). Both work with the current code.
- **Leaked password protection**: ON. https://supabase.com/dashboard/project/qyfywekaorkwpzrvbrth/auth/settings, then scroll to *Password Protection*.
- **SMTP**: https://supabase.com/dashboard/project/qyfywekaorkwpzrvbrth/auth/smtp. Switch from Inbucket to a real provider (Resend, Brevo, or a Gmail app password) so signup and reset mails actually deliver.

### 2.4 Make yourself admin

**SQL Editor** → run (replace the email with yours):

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email = 'YOUR_EMAIL@example.com';
```

Then log out and log back in.

---

## Step 3: Google (sign-in + Calendar)

Skip if you only want email/password login. NANTI works without it.

One OAuth client covers both **Sign in with Google** and **Google Calendar**. It needs two redirect URIs.

1. https://console.cloud.google.com/apis/credentials
   - Pick or create a project → **OAuth consent screen** → External → app name + your email → **Save and Continue**.
   - Scopes screen: **Add or remove scopes** → add `.../auth/userinfo.email`, `.../auth/userinfo.profile`, `https://www.googleapis.com/auth/calendar.readonly` → Update → Continue → Save.
2. **Credentials** → **Create credentials** → **OAuth client ID** → **Web application** → name it `NANTI`.
   - **Authorized redirect URIs** → **Add URI**, paste both:
     ```
     https://qyfywekaorkwpzrvbrth.supabase.co/auth/v1/callback
     https://nanti-app-new.vercel.app/api/auth/google
     ```
   - **Create** → copy **Client ID** and **Client Secret**.
3. Supabase → https://supabase.com/dashboard/project/qyfywekaorkwpzrvbrth/auth/providers → **Google** → ON → paste Client ID + Client Secret → Save.
4. Vercel → Settings → Environment Variables:
   - `GOOGLE_CLIENT_ID` = *(Client ID)*
   - `GOOGLE_CLIENT_SECRET` = *(Client Secret)*
5. Redeploy (Step 1.5).

> While the consent screen is in **Testing** mode only your own Google account can use it. Publish the app to Google Cloud when you open signups to others.

---

## Step 4: Remaining Vercel env vars

Vercel → **Settings** → **Environment Variables**. Add:

| Name | Value |
|---|---|
| `VITE_SITE_URL` | `https://nanti-app-new.vercel.app` |
| `CRON_SECRET` | *(generate one below, paste it)* |
| `VAPID_PUBLIC_KEY` | *(generate below)* |
| `VITE_VAPID_PUBLIC_KEY` | *(same value as above)* |
| `VAPID_PRIVATE_KEY` | *(generate below)* |

Generate the two secrets locally. Run this in the project folder:

```powershell
cmd /c "npx web-push generate-vapid-keys"
```

Copy **Public Key** into both `VAPID_PUBLIC_KEY` and `VITE_VAPID_PUBLIC_KEY`, **Private Key** into `VAPID_PRIVATE_KEY`.

Generate `CRON_SECRET` (any long random string), for example:

```powershell
-join ((48..57)+(97..122) | Get-Random -Count 48 | ForEach-Object {[char]$_})
```

Finally, redeploy: **Deployments** → top deployment → **⋯** → **Redeploy**.

---

## Step 5: GitHub Actions secret

https://github.com/Cruziero/nanti-app-new/settings/secrets/actions

- **New repository secret**
  - Name: `GEMINI_API_KEY`
  - Value: *(same key as Step 1)*

This powers the nightly live-eval workflow. Without it the workflow skips safely.

---

## Step 6: Legal review

`src/routes/legal.terms.tsx` and `src/routes/legal.privacy.tsx` both open with a `// DRAFT` comment saying they require legal review before publication.

- Get them reviewed by a lawyer before you promote the app publicly.
- Confirm the retention wording matches what you actually do (data kept while the account is active).
- Delete the `// DRAFT` comment on line 1 of each file once approved.

---

## Final check

Locally, the repo's own gate (all tests plus build):

```powershell
cmd /c "npm run verify:launch"
```

Then after Step 4 and a redeploy:

```bash
curl https://nanti-app-new.vercel.app/api/health
curl https://nanti-app-new.vercel.app/api/health \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

The authenticated request returns `checks`:

```json
{ "supabase": true, "ai": true, "aiModel": "gemini-3.5-flash", "googleCalendar": true, "push": true, "cron": true }
```

`ai` false → Step 1 not done or not redeployed. `googleCalendar` false → you skipped Step 3 (fine, email login still works). `push` false → Step 4 keys missing.

Then sign up with a test account and add one commitment to confirm extraction works end to end.
