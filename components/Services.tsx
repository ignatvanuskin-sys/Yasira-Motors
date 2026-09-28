import { Phone } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { Section, SectionHead } from "@/components/Section";
import { SymptomChips } from "@/components/SymptomChips";
import { serviceGroups } from "@/lib/content";
import { links, phone } from "@/lib/site";

/**
 * Услуги — нумерованный список, а не стена карточек: восемь направлений
 * читаются как оглавление, каждая строка целиком ведёт на звонок.
 * Формы записи нет: цена уточняется по телефону, потому что прайс-лист
 * компания не публикует.
 */
export function Services() {
  return (
    <Section id="services" bordered tone="alt">
      <SectionHead
        index="01"
        eyebrow="Услуги"
        title="Что делаем"
        lead="Направления, которые компания заявила в 2ГИС. Прайс-лист не публикуется: стоимость зависит от автомобиля и объёма работ."
      />

      <ul className="mt-10 border-y border-line">
        {serviceGroups.map((group, i) => (
          <li key={group.id} className="border-b border-line last:border-b-0">
            <Reveal delay={Math.min(i * 40, 200)}>
              <a
                href={`tel:${phone.tel}`}
                className="group flex items-center gap-4 py-6 transition-colors hover:bg-night-800 md:gap-8 md:py-7"
              >
                <span className="label w-7 shrink-0 text-fog-500 transition-colors group-hover:text-brand-400">
                  {String(i + 1).padStart(2, "0")}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="display block text-[clamp(1.05rem,3.6vw,1.55rem)] text-fog-100">
                    {group.title}
                  </span>
                  <span className="mt-2 block max-w-[52ch] text-[14px] leading-relaxed text-fog-400">
                    {group.text}
                  </span>
                  <span className="mt-3 hidden flex-wrap gap-1.5 md:flex">
                    {group.items.map((item) => (
                      <span
                        key={item}
                        className="label rounded-chip border border-line px-2.5 py-1.5 text-fog-500"
                      >
                        {item}
                      </span>
                    ))}
                  </span>
                </span>

                <span className="hidden shrink-0 text-[13.5px] font-semibold text-fog-500 transition-colors group-hover:text-brand-400 lg:block">
                  Уточнить стоимость
                </span>

                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-ctl border border-line transition-colors group-hover:border-brand-500 group-hover:bg-brand-500">
                  <Phone
                    className="h-4 w-4 text-fog-300 transition-colors group-hover:text-white"
                    strokeWidth={2.2}
                    aria-hidden="true"
                  />
                </span>
              </a>
            </Reveal>
          </li>
        ))}
      </ul>

      {/* Самый короткий путь к обращению: выбор симптома вместо выбора услуги */}
      <SymptomChips />

      <p className="mt-4 text-[13px] text-fog-500">
        На территории также работают автомойка, детейлинг и кафе для клиентов — по отзывам
        клиентов в{" "}
        <a
          href={links.twogis}
          target="_blank"
          rel="noopener noreferrer"
          className="text-fog-400 underline decoration-night-700 underline-offset-2 hover:text-fog-200"
        >
          2ГИС
        </a>
        .
      </p>
    </Section>
  );
}
