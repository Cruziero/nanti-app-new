# NANTI launch readiness

This branch contains the unpublished NANTI website and workspace revamp. The app is ready for an owner review, but it must not be presented as a public launch until the gates below are complete.

## What works in this branch

- Bilingual public website in Bahasa Indonesia and English, with a mostly white editorial layout and restrained deep green accents.
- Home, How it works, Personal, Business, Pricing, Journal, Help, About, Contact, Privacy, Terms, login, signup, password recovery, and workspace routes.
- Personal offer: 10 days free, then Rp25,000/month. Trial access does not require a card and does not auto-charge.
- Conversation text and PNG/JPEG/WebP screenshot analysis. AI suggestions remain editable and require explicit review before saving.
- Saved memories retain the source quote, AI note, owner, optional date, and optional in-app reminder. A failed save is reported as a failure.
- Ask NANTI answers from server-loaded memories and shows supporting source records. Client-submitted context is not trusted.
- Account export and deletion controls, scoped server authentication, rate limits, payment order records, and a Midtrans Snap notification verification path.
- WhatsApp forwarding, Google Calendar sync, push notifications, and automatic follow-up sending are shown as unavailable until their integrations are actually configured.

## Required configuration before public registration

1. Apply `supabase/migrations/20260910000000_launch_readiness.sql` to the production Supabase project.
2. Set the Supabase variables, `GEMINI_API_KEY`, and a verified `GEMINI_MODEL` from `.env.example`. Keep service-role and AI keys server-only.
3. Set `NANTI_SITE_URL` to the final HTTPS domain. Verify email redirect URLs and password recovery URLs in Supabase.
4. Confirm the operator identity, working support/privacy contact, legal entity details, age policy, retention periods, provider regions, and incident response process. The current legal pages intentionally identify these as launch review items.
5. Decide whether to open public registration. Until then, keep the site unpublished or protect it at the hosting layer.

## Payments

The Midtrans path is disabled unless `NANTI_PAYMENTS_ENABLED=true` and `MIDTRANS_SERVER_KEY` are set. Configure the exact HTTPS notification URL `/api/billing/midtrans` in Midtrans, verify the server key and production/sandbox mode, and run a sandbox payment. Confirm that a verified settlement extends access by one calendar month and that duplicate notifications do not extend it twice. Confirm GoPay and the desired methods are enabled in the Midtrans account before advertising them.

## WhatsApp

No WhatsApp Business number, Meta app, webhook verification token, or opt-in process has been provided. The product therefore uses paste and screenshot input at launch. Add forwarding only after a dedicated number, approved message templates, consent/opt-out handling, webhook signature verification, media retention rules, and a user-to-account linking flow are tested.

## Verification run

- `npm ci --legacy-peer-deps --ignore-scripts`
- `npx tsc --noEmit`
- `npm run build`

Both checks pass on this branch. The build output is generated locally and has not been deployed or pushed to `main`.
