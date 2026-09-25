// DRAFT: requires legal review before publication. Not finalized legal advice.
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
        <p className="mt-5 text-[14px] text-muted-foreground">Last updated: 25 September 2026</p>

        <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-muted-foreground">
          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">1. What NANTI Is</h2>
            <p>
              NANTI is a memory tool for WhatsApp. You paste or forward a conversation, and NANTI
              extracts the people, commitments, deadlines and follow-ups that matter, then reminds
              you about them. This policy explains what we collect and what we do with it.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">2. What We Collect</h2>
            <p>We collect three categories of information.</p>
            <ul className="mt-3 list-inside list-disc space-y-1">
              <li>
                <strong>Account details.</strong> Your email address. If you sign in with Google,
                your Google account name and profile image.
              </li>
              <li>
                <strong>Content you submit.</strong> Conversations you paste, screenshots you upload,
                and anything else you type into NANTI.
              </li>
              <li>
                <strong>What NANTI creates from that.</strong> Extracted people, commitments,
                reminders, invoices, calendar entries, notes, and your preferences.
              </li>
              <li>
                <strong>Technical details.</strong> Your browser push subscription (an endpoint and
                two keys, so we can send you reminders), and an internal log of product events used
                to keep the service working.
              </li>
            </ul>
            <p className="mt-3">
              NANTI contains no advertising trackers and no third-party analytics. We do not buy or
              sell personal information.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">
              3. What We Send to Google
            </h2>
            <p>
              To read your conversations, the text you submit is sent to Google Gemini for
              processing. Google processes that text under its own terms. We do not use your content
              to train AI models, and we do not combine it with anyone else&apos;s data.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">4. WhatsApp</h2>
            <p>
              NANTI does not connect to your WhatsApp account. It cannot read your chat history,
              access your contacts, or monitor your messages. It only ever sees the specific text
              you choose to paste or forward.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">
              5. Service Providers
            </h2>
            <p>We rely on these companies to run NANTI. Each handles data under its own terms.</p>
            <ul className="mt-3 list-inside list-disc space-y-1">
              <li>
                <strong>Supabase</strong>: database, sign-in and account storage
              </li>
              <li>
                <strong>Vercel</strong>: application hosting
              </li>
              <li>
                <strong>Google Gemini</strong>: AI processing of the text you submit
              </li>
              <li>
                <strong>Google Calendar API</strong>: calendar sync, only if you switch it on
              </li>
            </ul>
            <p className="mt-3">
              Because these providers operate globally, your data may be processed in countries
              other than your own.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">
              6. Cookies and Local Storage
            </h2>
            <p>
              NANTI uses local storage in your browser to keep you signed in and to remember your
              preferences. It does not set advertising cookies and does not track you across other
              websites.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">7. How Long We Keep It</h2>
            <p>
              We keep your data for as long as your account is active. You can export everything we
              hold at any time, in JSON, from Settings.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">8. Your Rights</h2>
            <p>Depending on where you live, you may ask us to:</p>
            <ul className="mt-3 list-inside list-disc space-y-1">
              <li>Give you a copy of the personal data we hold</li>
              <li>Correct anything that is wrong</li>
              <li>Delete your personal data</li>
              <li>Stop processing it, or provide it in a portable format</li>
            </ul>
            <p className="mt-3">
              Export and deletion are both available in Settings. For anything else, email us using
              the address at the end of this page and we will respond.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">
              9. Deleting Your Account
            </h2>
            <p>
              Settings contains a permanent account deletion control, protected by a typed
              confirmation. It removes your login so the account can no longer be opened, and you
              are signed out immediately. If you also want the records stored under your account
              removed, email us and we will remove them.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">10. Security</h2>
            <p>
              Traffic between your browser and NANTI is encrypted in transit, and our hosting
              provider encrypts stored data at rest. No method of transmitting or storing
              information over the internet is completely secure, so we cannot promise absolute
              protection.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">11. Children</h2>
            <p>
              NANTI is not aimed at children under 13, and we do not knowingly collect data from
              them. If you believe a child has given us data, contact us and we will delete it.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">12. Changes</h2>
            <p>
              When this policy changes in a material way, we will update it here and note the new
              date at the top. Continuing to use NANTI after a change means you accept the revised
              policy.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">13. Contact</h2>
            <p>
              For privacy questions or requests, email{" "}
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
