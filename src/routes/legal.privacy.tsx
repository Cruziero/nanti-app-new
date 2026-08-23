// DRAFT — requires legal review before publication. Not finalized legal advice.
import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/nanti/marketing";

export const Route = createFileRoute("/legal/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy · NANTI" },
      { name: "description", content: "NANTI Privacy Policy." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <MarketingLayout>
      <section className="mx-auto max-w-3xl px-5 py-20 sm:px-8 sm:py-28">
        <p className="eyebrow text-[var(--accent-emerald)]">Legal</p>
        <h1 className="display-lg mt-5 text-foreground">Privacy Policy</h1>
        <p className="mt-5 text-[14px] text-muted-foreground">Last updated: August 2026</p>

        <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-muted-foreground">
          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">1. What We Collect</h2>
            <p>
              We collect only what you choose to share: conversations you forward or paste into
              NANTI, your email address (for account creation), and basic usage data needed to
              operate the Service.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">
              2. How We Use Your Data
            </h2>
            <p>
              Your data is used solely to provide the Service — extracting commitments, setting
              reminders, and generating follow-up suggestions. We do not use your data to train AI
              models, sell to advertisers, or share with third parties for their own purposes.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">3. WhatsApp Access</h2>
            <p>
              NANTI does not automatically read your WhatsApp. We only process messages you
              explicitly forward or paste. NANTI cannot access your WhatsApp account, read your chat
              history, or monitor your conversations.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">
              4. Third-Party Processors
            </h2>
            <p>We use the following third-party services to operate NANTI:</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>
                <strong>Supabase</strong> — database hosting and authentication
              </li>
              <li>
                <strong>Google Gemini</strong> — AI processing of shared conversations
              </li>
              <li>
                <strong>Google Calendar API</strong> — calendar integration (optional)
              </li>
              <li>
                <strong>Vercel</strong> — application hosting
              </li>
            </ul>
            <p className="mt-2">
              Each processor handles data according to their own privacy policies.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">5. Data Retention</h2>
            <p>
              Your data is retained as long as your account is active. You may delete your account
              and all associated data at any time through Settings. Deleted data is removed from our
              servers within 30 days.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">6. Data Security</h2>
            <p>
              We use industry-standard encryption for data in transit and at rest. However, no
              method of transmission over the Internet is 100% secure, and we cannot guarantee
              absolute security.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">7. Your Rights</h2>
            <p>
              You have the right to access, correct, or delete your personal data. You can do most
              of this directly through the Service. For additional requests, contact us at the email
              below.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">
              8. Children&apos;s Privacy
            </h2>
            <p>
              NANTI is not intended for users under 13. We do not knowingly collect data from
              children.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">
              9. Changes to This Policy
            </h2>
            <p>
              We may update this privacy policy from time to time. We will notify you of significant
              changes through the Service or by email.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">10. Contact</h2>
            <p>
              Privacy questions? Email us at{" "}
              <a href="mailto:privacy@nanti.app" className="text-[var(--accent-emerald)] underline">
                privacy@nanti.app
              </a>
              .
            </p>
          </section>
        </div>
      </section>
    </MarketingLayout>
  );
}
