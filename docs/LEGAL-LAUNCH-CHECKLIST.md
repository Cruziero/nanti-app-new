# NANTI legal & privacy launch operations

Updated: 2026-09-25

This is an operational checklist, not a substitute for Indonesian legal advice.

## Before public commercial launch

- [ ] **Identify the operator.** Confirm the legal person / business operating NANTI, registered address, NIB/KBLI where applicable, and the contact details that should appear in customer-facing legal notices.
- [ ] **PSE Lingkup Privat registration.** Confirm NANTI's registration obligation and, if applicable, complete Tanda Daftar PSE Lingkup Privat through OSS before broad public operation.
  - Official portal: https://pse.komdigi.go.id/
  - Current Komdigi enforcement (2026) confirms active monitoring of unregistered private PSEs.
- [ ] **Indonesian counsel sign-off.** Have counsel review:
  - `src/routes/legal.terms.tsx`
  - `src/routes/legal.privacy.tsx`
  - signup consent wording
  - age eligibility
  - liability / consumer-protection wording
  - operator identity and contact details
- [ ] **Privacy mailbox.** Ensure `privacy@nanti.app` receives mail and has an owner + response process.
- [ ] **Support mailbox.** Ensure `support@nanti.app` receives mail and has an owner + response process.
- [ ] **PDP processing inventory.** Keep a simple record of:
  - categories of personal data processed,
  - purpose / lawful basis,
  - source of data,
  - processors/sub-processors,
  - retention,
  - security controls,
  - cross-border destinations.
- [ ] **Cross-border transfer record.** Document how the requirements of UU PDP Article 56 are satisfied for processors outside Indonesia. Current production processors may include Google, Supabase, and Vercel.
- [ ] **Processor terms / DPAs.** Save current data-processing terms for production vendors and record material changes.
- [ ] **Gemini production tier.** Use a billing-enabled / paid-tier Gemini API project for public customer content and set `GEMINI_PAID_TIER=true` only after that is verified.
- [ ] **SMTP and account communications.** Configure a production SMTP provider and verify signup confirmation + password recovery delivery.
- [ ] **Incident response owner.** Define who receives security reports, who can disable integrations/keys, and who handles legally required personal-data breach notification.
- [ ] **Data-subject request procedure.** Define how NANTI handles access, copy/export, correction, deletion, consent withdrawal, restriction, and objections. The product already provides authenticated export and account deletion.
- [ ] **Retention review.** Confirm that production retention and provider backups/logs match the Privacy Policy.
- [ ] **Third-party conversation notice.** Keep the product warning that users may only upload conversations/data they are entitled to share and process.

## Already implemented in product

- [x] Authenticated account data export.
- [x] Authenticated account deletion.
- [x] Per-user row-level security for customer-owned production data.
- [x] Service-only tables denied to normal clients.
- [x] AI result disclaimer in Terms.
- [x] Privacy Policy describes AI processors, optional Calendar, push technical data, cross-border processing, retention, and user rights.
- [x] Signup explicitly requires acceptance of Terms and acknowledgement of Privacy Policy.
- [x] New passwords are checked against the HIBP Pwned Passwords corpus using k-anonymity.
- [x] Unverified WhatsApp, Calendar, and Push launch surfaces are hidden from the initial public scope.
- [x] Production AI privacy readiness is exposed by `/api/health` via `aiPrivacyReady`.

## Do not mark complete automatically

The items above that depend on legal advice, business registration, vendor billing, email ownership, or government registration must be verified by the operator. Do not remove the legal-review source comments until counsel has approved the final documents.
