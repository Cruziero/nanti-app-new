// DRAFT: requires legal review before publication. Not finalized legal advice.
import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/nanti/marketing";

export const Route = createFileRoute("/legal/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service · NANTI" },
      { name: "description", content: "NANTI Terms of Service." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <MarketingLayout>
      <section className="mx-auto max-w-3xl px-5 py-20 sm:px-8 sm:py-28">
        <p className="eyebrow text-[var(--accent-emerald)]">Legal</p>
        <h1 className="display-lg mt-5 text-foreground">Terms of Service</h1>
        <p className="mt-5 text-[14px] text-muted-foreground">Last updated: 25 September 2026</p>

        <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-muted-foreground">
          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">
              1. Acceptance of These Terms
            </h2>
            <p>
              These terms govern your use of NANTI. By creating an account or using the service you
              accept them. If you do not accept them, do not use NANTI.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">2. What NANTI Is</h2>
            <p>
              NANTI is a memory aid for WhatsApp. You paste or forward a conversation and NANTI
              extracts the people, commitments, deadlines and follow-ups it finds, then reminds you
              about them. It can also draft follow-up messages, keep invoices and maintain a
              calendar.
            </p>
            <p className="mt-3">
              NANTI does not connect to your WhatsApp account and never reads your messages on its
              own. It only processes what you deliberately give it.
            </p>
            <p className="mt-3">
              NANTI is a tool, not a professional service. It is not a substitute for advice from a
              lawyer, accountant, doctor or financial adviser, and it does not create any
              professional relationship.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">3. Your Account</h2>
            <p>
              You must give a real email address and keep your login credentials to yourself. You
              are responsible for everything that happens under your account. Tell us promptly if
              you think someone else has accessed it.
            </p>
            <p className="mt-3">
              You must be at least 13 years old to use NANTI. If you are using it on behalf of an
              organisation, you confirm that you have authority to accept these terms for that
              organisation.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">4. Your Content</h2>
            <p>
              You keep ownership of everything you put into NANTI. You grant us only the permission
              needed to operate the service: to store it, process it, and show it back to you.
            </p>
            <p className="mt-3">
              You confirm that you have the right to share whatever you paste or forward. Forwarding
              someone else&apos;s message is your responsibility, and you should respect their
              privacy before sharing it.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">5. Acceptable Use</h2>
            <p>You agree not to use NANTI to:</p>
            <ul className="mt-3 list-inside list-disc space-y-1">
              <li>Break any law, or infringe anyone&apos;s rights</li>
              <li>Send spam, harassment, or content that threatens others</li>
              <li>Attempt to gain access to systems or accounts that are not yours</li>
              <li>Interfere with the service, including by overloading it with automated requests</li>
              <li>Resell or republish the service without our written permission</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">
              6. About AI Output
            </h2>
            <p>
              NANTI uses AI to read conversations and suggest what it thinks you committed to. That
              output is a suggestion, not a fact. AI can misunderstand a message, invent a detail,
              or miss something important.
            </p>
            <p className="mt-3">
              You are responsible for checking anything NANTI produces before you act on it, send
              it, or rely on it. Do not use NANTI as the only record of a legal, financial or
              medical matter.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">
              7. Third-Party Services
            </h2>
            <p>
              NANTI depends on other companies: Supabase for the database and sign-in, Vercel for
              hosting, Google Gemini for AI processing, and Google Calendar if you switch that on.
              Those services run under their own terms, and their availability is outside our
              control.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">
              8. Availability and Changes
            </h2>
            <p>
              We work to keep NANTI available, but we do not promise it will always be up. We may
              add, change or remove features, and we may suspend or discontinue the service. Where
              we can, we will give reasonable notice before a change affects you.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">9. Ending Your Access</h2>
            <p>
              You can stop using NANTI and delete your account from Settings at any time. We may
              suspend or close an account if you break these terms, if the law requires it, or if
              the service is being shut down. You can export your data from Settings before you
              leave.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">
              10. Disclaimers
            </h2>
            <p>
              NANTI is provided &quot;as is&quot; and &quot;as available&quot;, without warranties of any kind,
              whether express or implied. We do not warrant that it will be uninterrupted, error
              free, or that its output will be accurate.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">
              11. Limitation of Liability
            </h2>
            <p>
              To the fullest extent the law allows, we are not liable for indirect, incidental or
              consequential losses, including lost profits, lost data, or loss of goodwill. Our
              total liability for any claim about NANTI is limited to the amount you paid us for
              the service in the twelve months before the claim, or one hundred US dollars, if you
              have paid nothing.
            </p>
            <p className="mt-3">
              Nothing in these terms limits liability that cannot be limited by law, including
              liability for fraud or for personal injury caused by negligence.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">12. Governing Law</h2>
            <p>
              [To be completed with the chosen jurisdiction and courts before publication.]
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">13. Changes to Terms</h2>
            <p>
              We may update these terms. When we make a material change, we will update this page
              and the date above. Using NANTI after a change means you accept the revised terms. If
              you do not accept them, stop using the service and delete your account.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">14. Contact</h2>
            <p>
              Questions about these terms? Email{" "}
              <a href="mailto:support@nanti.app" className="text-[var(--accent-emerald)] underline">
                support@nanti.app
              </a>
              .
            </p>
          </section>
        </div>
      </section>
    </MarketingLayout>
  );
}
