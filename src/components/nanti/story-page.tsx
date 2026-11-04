import { Reveal } from "@/components/nanti/marketing";
import {
  HonestBoundary,
  MarketingHero,
  ProductConversation,
  ProofRows,
  SimpleCta,
} from "@/components/nanti/marketing-proof";
import { useCopy, type Bilingual } from "@/lib/i18n";

type Item = { title: string; description: string };
type Boundary = { label: string; description: string };

export type StoryCopy = {
  hero: { eyebrow: string; titleA: string; titleB: string; description: string; note: string };
  moment: {
    eyebrow: string;
    title: string;
    body: string;
    chat: { label: string; userText: string; assistantText: string; saved: string; footer: string };
  };
  proof: { eyebrow: string; title: string; items: Item[] };
  boundary: { title?: string; items: Boundary[] };
  cta: { title: string; description: string };
};

/** Shared layout for How it works, Business and Personal. Copy lives in each route. */
export function StoryPage({ copy }: { copy: Bilingual<StoryCopy> }) {
  const t = useCopy(copy);
  return (
    <>
      <MarketingHero
        eyebrow={t.hero.eyebrow}
        title={
          <>
            {t.hero.titleA}
            <br />
            <span className="text-[#0b6b5f]">{t.hero.titleB}</span>
          </>
        }
        description={t.hero.description}
        note={t.hero.note}
      />

      <section className="bg-[#f7f9f7] py-16 sm:py-20">
        <div className="mx-auto grid max-w-[1040px] gap-10 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <Reveal>
            <div>
              <p className="text-[13px] font-semibold text-[#0b6b5f]">{t.moment.eyebrow}</p>
              <h2 className="mt-3 text-[28px] font-semibold tracking-[-0.025em] text-[#171c24] sm:text-[34px]">
                {t.moment.title}
              </h2>
              <p className="mt-4 text-[15px] leading-7 text-[#5c6165]">{t.moment.body}</p>
            </div>
          </Reveal>
          <ProductConversation {...t.moment.chat} />
        </div>
      </section>

      <ProofRows eyebrow={t.proof.eyebrow} title={t.proof.title} items={t.proof.items} />
      <HonestBoundary title={t.boundary.title} items={t.boundary.items} />
      <SimpleCta title={t.cta.title} description={t.cta.description} />
    </>
  );
}
