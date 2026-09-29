import { ChevronDown } from "lucide-react";
import { Section, SectionHead } from "@/components/Section";
import { faq } from "@/lib/content";

/**
 * FAQ на нативных <details>/<summary>: аккордеон открывает сам браузер, поэтому
 * блок работает без JavaScript, доступен с клавиатуры и не тянет ни строки
 * скрипта. Разметка FAQPage строится из этих же данных — расхождение между
 * структурой и текстом на странице поисковики считают нарушением.
 */
export function Faq() {
  return (
    <Section id="faq">
      <SectionHead
        eyebrow="Вопросы"
        title="Частые вопросы"
        lead="Коротко о записи, стоимости, оплате и адресе."
      />

      <div className="mt-8 divide-y divide-line border-y border-line">
        {faq.map((item) => (
          <details key={item.question} className="group py-4">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-[16.5px] font-semibold text-fog-100 [&::-webkit-details-marker]:hidden">
              {item.question}
              <ChevronDown
                className="mt-0.5 h-5 w-5 shrink-0 text-fog-500 transition-transform group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <p className="mt-3 max-w-[70ch] text-[15.5px] leading-relaxed text-fog-300">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </Section>
  );
}
