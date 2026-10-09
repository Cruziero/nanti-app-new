# Gmail and email tasks

NANTI Settings now includes Gmail for a personal email workspace and named business email workspaces. Each workspace has separate inbox connections and email tasks. The first version is owner-only; it does not grant team members access to the owner's mailbox.

Users can search emails, open a message as text, create a task manually, or explicitly send the selected message to Google Gemini for task suggestions. They review the title, notes, priority and deadline before saving. An AI date suggestion appears in the notes; the deadline remains unset until the user confirms a local date and time. Tasks retain a link to the source email and can be completed or reopened.

Email tasks appear in Settings > Gmail. They do not yet appear in the existing Today, Ask NANTI, daily briefing or reminder scheduler. This separation is intentional: those areas currently load account-wide context and have no enforced business workspace boundary. Automatically copying business emails into that context would mix the modes. Automatic background inbox scanning, attachments, sending email and team sharing are not included in this version.

## Deployment setup

1. Apply `supabase/migrations/20261006025028_gmail_email_workspaces.sql` to the actual database used by this deployment. Confirm the deployment's `SUPABASE_URL`; the repository's historical `supabase/config.toml` project ID should not be assumed to identify the current production database.
2. Enable the Gmail API in the Google Cloud project. Create a dedicated OAuth web client for Gmail and configure its consent screen. Request only `https://www.googleapis.com/auth/gmail.readonly`. Keep this client separate from the existing Calendar client.
3. Register the exact callback URL: `https://<deployment-host>/api/auth/gmail`. Use a stable preview hostname for testing. Add test users while the OAuth application is in testing. Authorizing Gmail in ChatGPT does not authorize the NANTI application.
4. Set server-only environment variables:

   | Variable | Value |
   | --- | --- |
   | `GMAIL_CLIENT_ID` | Dedicated Google OAuth web client ID |
   | `GMAIL_CLIENT_SECRET` | Its client secret |
   | `GMAIL_REDIRECT_URI` | Exact registered callback URL |
   | `GMAIL_TOKEN_ENCRYPTION_KEY` | 32 random bytes encoded as base64 |
   | `SUPABASE_URL` | Deployment database URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | Server-only database key |

   Generate the encryption key with `openssl rand -base64 32` and place it directly in the secret manager. Keep it stable across deployments. Rotating it without re-encrypting stored credentials requires users to reconnect.
5. Enable AI email analysis only when the Gemini project has paid-tier data treatment and the deployment sets `GEMINI_PAID_TIER=true`. Manual task creation and email reading work without AI analysis. Update the privacy notice to cover Gmail data, task provenance, selected-email processing by Gemini, retention and disconnection before live customer use.
6. Complete Google's restricted-scope verification and any required security assessment before a public rollout. See [Gmail scopes](https://developers.google.com/workspace/gmail/api/auth/scopes) and [Google OAuth web server guidance](https://developers.google.com/identity/protocols/oauth2/web-server).
7. Deploy a preview and complete the real-account acceptance steps below before merging or enabling this for customers.

## Credential and data handling

- The server checks the signed-in user and workspace on every connection, read, suggestion, task and disconnect operation. Composite foreign keys prevent attaching a connection or task to someone else's workspace.
- OAuth uses a random, expiring, single-use database state plus an HttpOnly SameSite cookie. A callback must match the browser state and the configured callback origin. Only the Gmail read scope is requested.
- Refresh tokens use AES-256-GCM with an owner/workspace/mailbox binding. Access tokens remain in request memory. Credential and state tables deny browser roles; status and account export return explicit metadata columns only.
- Gmail messages are fetched on demand. Raw email bodies are not persisted by this feature. HTML is displayed as escaped text and attachments are excluded. Users explicitly consent before sending an email to the AI provider; extraction uses no personal or other workspace memories.
- Disconnect deletes stored credentials and pending authorization states for that workspace. Saved tasks remain. It does not revoke the entire Google application grant; users can remove that grant in Google Account > Third-party connections. Reconnecting the same mailbox retains deduplication for repeated task saves.
- Account export includes email workspaces, saved tasks and connection metadata, excluding credentials and OAuth states. Account deletion cascades through the new tables.

## Validation performed

- PASS: production build.
- PASS: targeted ESLint for Gmail server, functions, callback and UI.
- PASS: 13 Gmail backend tests (`npm run test:gmail`).
- PASS: existing semantic and assistant-quality fixtures, AI transport tests and account-export tests.
- PASS: `npm run verify:launch` after the dependency patches. Production dependency audit reports zero vulnerabilities.
- The first hosted CI run stopped at its dependency audit on vulnerabilities already present in main. The lockfile updates `seroval` from 1.6.2 to 1.6.8 and `source-map-js` from 1.2.1 to 1.2.2, which include the patches for [GHSA-jp82-f5mq-hwhp](https://github.com/advisories/GHSA-jp82-f5mq-hwhp) and [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q).
- PASS: migration executed in a temporary PostgreSQL-compatible PGlite database with Supabase role/auth scaffolding. `tests/gmail-schema.sql` verified owner RLS, cross-owner foreign-key denial, browser credential denial, duplicate prevention and separate workspace keys. No production schema changes were applied.
- PASS: 13 DOM interaction checks using the real Gmail React component with explicitly synthetic API data: personal inbox loads; selected email opens; AI requires consent; suggestions are editable; task save stays in its workspace; completion/reopening; business switch clears personal context; manual creation/discard; pagination; search empty state; read error state; disconnect; returning to Personal restores its tasks.
- The full typecheck reports 562 errors on both current main and this branch. Comparing diagnostics shows no added Gmail errors; the changed route-union length in an existing blog error reflects the newly generated callback route.
- NOT VERIFIED: real Google authorization/token refresh, actual Gmail accounts, signed-in deployment behavior, browser layout at mobile widths and full keyboard/contrast checks. Browser installation failed because the download was unavailable in this environment. DOM checks do not establish visual browser acceptance. This is a draft PR, not a live or fully accepted integration.
- Vercel build logs supplied by the owner identified an install-time security block for TanStack Start ([GHSA-qx66-fv34-fjm8](https://github.com/TanStack/router/security/advisories/GHSA-qx66-fv34-fjm8)). The npm dependencies now pin `@tanstack/react-start` 1.168.60, `@tanstack/react-router` 1.170.41 and `@tanstack/router-plugin` 1.168.42; the lockfile resolves `@tanstack/start-server-core` 1.169.39. No security bypass is enabled. Hosted deployment acceptance remains pending; the connected Vercel identity still lacks access to the `wunder2` team.

## UI decisions

The design follows the established NANTI green-and-white identity and existing theme tokens. ENERGY 1 / RHYTHM 2 / MOTION 1: the email reader is calm, the workspace controls and task list have different hierarchies, and motion is limited to existing control feedback. Settings contains the feature because connections and email context must be selected before reading. Stacked controls support narrow screens, with 44px minimum action targets. The bordered reader separates untrusted email content from editable tasks; no decorative icons or invented metrics were added.

## Real-account acceptance

1. Connect a test personal Gmail account in Personal. Confirm consent shows read access, then search, open, and save a manual task.
2. Connect a different account in Business. Confirm the personal email/task content disappears from the reader and business tasks stay in that workspace. Try requesting another workspace's connection ID and confirm rejection.
3. With paid-tier AI configured, opt in for one email, review its suggestions, confirm a deadline, and save. Repeat the save and confirm one task. Complete and reopen it.
4. Check denied consent, an expired state, replayed callbacks, revoked Google access, network errors and reconnecting. Confirm no token or email body is written to logs.
5. Disconnect an inbox, confirm its credentials are removed and saved tasks remain. Export the account and confirm email tasks are present while tokens are absent. Verify account deletion on a disposable test user.
6. Check mobile, tablet, desktop, both available themes, keyboard operation and focus. Confirm forms, empty states, errors and source-email links work on a real device.
