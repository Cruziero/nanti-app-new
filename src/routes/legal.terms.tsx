// DRAFT — requires legal review before publication. Not finalized legal advice.
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
        <p className="mt-5 text-[14px] text-muted-foreground">Last updated: August 2026</p>

        <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-muted-foreground">
          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using NANTI (&quot;the Service&quot;), you agree to be bound by these
              Terms of Service. If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">
              2. Description of Service
            </h2>
            <p>
              NANTI is an AI-powered workspace that helps you track commitments, deadlines, and
              follow-ups extracted from WhatsApp conversations you choose to forward or paste. NANTI
              does not automatically read your WhatsApp — it only processes content you explicitly
              share.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">3. Your Data</h2>
            <p>
              You retain ownership of all data you share with NANTI. We process your conversations
              solely to provide the Service. We do not sell your data to third parties. You may
              delete your data at any time through the Settings page.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">
              4. Third-Party Services
            </h2>
            <p>
              NANTI uses third-party processors to deliver the Service, including Supabase (database
              and authentication), Google (Calendar integration), and Google Gemini (AI processing).
              Your use of these integrations is subject to their respective terms of service.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">5. Acceptable Use</h2>
            <p>
              You agree not to use the Service to share content that violates applicable laws or the
              rights of others. You are responsible for ensuring you have the right to share any
              conversations you forward to NANTI.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">6. Availability</h2>
            <p>
              We strive to keep NANTI available but do not guarantee uninterrupted access. We may
              modify or discontinue features with reasonable notice.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">
              7. Limitation of Liability
            </h2>
            <p>
              NANTI is provided &quot;as is&quot; without warranties of any kind. We are not liable
              for any damages arising from your use of the Service, including missed deadlines or
              lost commitments.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">8. Changes to Terms</h2>
            <p>
              We may update these terms from time to time. Continued use of the Service after
              changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">9. Contact</h2>
            <p>
              Questions about these terms? Email us at{" "}
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
