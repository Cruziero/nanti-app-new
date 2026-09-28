import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Check, ArrowRight } from "lucide-react";
import { Reveal } from "./marketing";

export function MarketingHero({
  eyebrow,
  title,
  description,
  note,
}: {
  eyebrow: string;
  title: ReactNode;
  description: string;
  note?: string;
}) {
  return (
    <section className="border-b border-[#e8ebe8] bg-white">
      <div className="mx-auto max-w-[1040px] px-5 pb-16 pt-20 sm:px-8 sm:pb-20 sm:pt-24">
        <Reveal>
          <p className="text-[12px] font-semibold text-[#0b6b5f]">{eyebrow}</p>
          <h1 className="mt-4 max-w-[780px] text-[40px] font-semibold leading-[1.08] tracking-[-0.035em] text-[#171c24] sm:text-[56px]">
            {title}
          </h1>
          <p className="mt-6 max-w-[680px] text-[17px] leading-7 text-[#555a5e]">
            {description}
          </p>
          {note ? (
            <p className="mt-4 max-w-[640px] text-[13px] leading-5 text-[#6b7075]">
              {note}
            </p>
          ) : null}
        </Reveal>
      </div>
    </section>
  );
}

export function ProductConversation({
  label,
  userText,
  assistantText,
  saved,
  footer,
}: {
  label: string;
  userText: string;
  assistantText: string;
  saved?: string;
  footer?: string;
}) {
  return (
    <Reveal>
      <div className="overflow-hidden rounded-2xl border border-[#dfe4df] bg-white shadow-[0_14px_40px_rgba(25,44,38,0.06)]">
        <div className="flex items-center justify-between border-b border-[#edf0ed] px-5 py-4">
          <div>
            <p className="text-[13px] font-semibold text-[#171c24]">Ask NANTI</p>
            <p className="mt-0.5 text-[11px] text-[#686d71]">{label}</p>
          </div>
          <span className="rounded-full bg-[#eef8f4] px-2.5 py-1 text-[10px] font-semibold text-[#0b6b5f]">
            Real product flow
          </span>
        </div>

        <div className="space-y-5 p-5 sm:p-7">
          <div className="flex justify-end">
            <div className="max-w-[84%] rounded-2xl rounded-br-md bg-[#107e71] px-4 py-3 text-[14px] leading-6 text-white">
              {userText}
            </div>
          </div>

          <div className="max-w-[88%]">
            <p className="whitespace-pre-line text-[15px] leading-7 text-[#202428]">
              {assistantText}
            </p>
            {saved ? (
              <div className="mt-2 flex items-center gap-1.5 text-[12px] font-medium text-[#0b6b5f]">
                <Check className="size-3.5" />
                {saved}
              </div>
            ) : null}
          </div>
        </div>

        {footer ? (
          <div className="border-t border-[#edf0ed] bg-[#fafbfa] px-5 py-3 text-[11px] leading-5 text-[#686d71]">
            {footer}
          </div>
        ) : null}
      </div>
    </Reveal>
  );
}

export function ProofRows({
  eyebrow,
  title,
  items,
}: {
  eyebrow: string;
  title: string;
  items: Array<{ title: string; description: string }>;
}) {
  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-[1040px] px-5 sm:px-8">
        <Reveal>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0b6b5f]">
            {eyebrow}
          </p>
          <h2 className="mt-3 max-w-[700px] text-[28px] font-semibold tracking-[-0.025em] text-[#171c24] sm:text-[34px]">
            {title}
          </h2>
        </Reveal>

        <div className="mt-10 divide-y divide-[#e8ebe8] border-y border-[#e8ebe8]">
          {items.map((item, index) => (
            <Reveal key={item.title} delay={index * 60}>
              <div className="grid gap-2 py-5 sm:grid-cols-[220px_1fr] sm:gap-8 sm:py-6">
                <h3 className="text-[14px] font-semibold text-[#171c24]">{item.title}</h3>
                <p className="max-w-[650px] text-[14px] leading-6 text-[#5c6165]">
                  {item.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HonestBoundary({
  title = "What NANTI does, and what it does not pretend to do.",
  items,
}: {
  title?: string;
  items: Array<{ label: string; description: string }>;
}) {
  return (
    <section className="border-y border-[#e1e7e2] bg-[#f5f8f6] py-16 sm:py-20">
      <div className="mx-auto max-w-[1040px] px-5 sm:px-8">
        <Reveal>
          <h2 className="max-w-[720px] text-[26px] font-semibold tracking-[-0.025em] text-[#171c24] sm:text-[32px]">
            {title}
          </h2>
        </Reveal>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {items.map((item, index) => (
            <Reveal key={item.label} delay={index * 70}>
              <div className="border-l-2 border-[#107e71] pl-4">
                <p className="text-[13px] font-semibold text-[#171c24]">{item.label}</p>
                <p className="mt-1 text-[13px] leading-6 text-[#5f6568]">{item.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SimpleCta({
  title,
  description,
  button = "Try NANTI",
}: {
  title: string;
  description: string;
  button?: string;
}) {
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-[720px] px-5 text-center sm:px-8">
        <Reveal>
          <h2 className="text-[30px] font-semibold tracking-[-0.03em] text-[#171c24] sm:text-[38px]">
            {title}
          </h2>
          <p className="mx-auto mt-4 max-w-[560px] text-[15px] leading-7 text-[#5c6165]">
            {description}
          </p>
          <Link
            to="/welcome"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#107e71] px-6 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-[#0b6b5f]"
          >
            {button}
            <ArrowRight className="size-4" />
          </Link>
          <p className="mt-3 text-[11px] text-[#686d71]">No credit card required.</p>
        </Reveal>
      </div>
    </section>
  );
}
