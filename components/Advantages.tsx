import { Info } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { Section, SectionHead } from "@/components/Section";
import { advantages, facts } from "@/lib/content";
import { address, group, links, paymentMethods } from "@/lib/site";

export function Advantages() {
  return (
    <Section id="why" bordered>
      <SectionHead
        eyebrow="Почему YASIRA MOTORS"
        title="Сервис, в который возвращаются"
        lead="Никаких обещаний «высокого качества» без подтверждения. Ниже — только то, что можно проверить в 2ГИС и на официальном сайте группы компаний."
      />

      {/* Полоса фактов */}
      <dl className="mt-10 grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        {facts.map((fact) => (
          <div key={fact.label} className="bg-night-900 px-5 py-5">
            <dt className="text-[clamp(1.4rem,2.6vw,1.85rem)] leading-none font-extrabold tracking-[-0.02em] text-fog-100">
              {fact.value}
            </dt>
            <dd className="mt-2.5">
              <span className="block text-[14.5px] font-semibold text-fog-200">{fact.label}</span>
              <span className="mt-0.5 block text-[12.5px] text-fog-500">{fact.sub}</span>
            </dd>
          </div>
        ))}
      </dl>

      <ul className="mt-4 grid gap-3.5 md:grid-cols-2">
        {advantages.map((item, i) => {
          const Icon = item.icon;
          return (
            <Reveal as="li" key={item.title} delay={Math.min(i * 60, 200)} className="h-full">
              <article className="card-surface flex h-full gap-4 p-5 transition-colors duration-300 hover:border-night-700 hover:bg-night-800 md:p-6">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-ctl border border-line bg-night-800">
                  <Icon className="h-5 w-5 text-brand-400" strokeWidth={2} aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-[17px] leading-snug text-fog-100">{item.title}</h3>
                  <p className="mt-2.5 text-[14.5px] leading-relaxed text-fog-400">{item.text}</p>
                  <p className="mt-3 text-[12px] font-semibold tracking-[0.04em] text-fog-500 uppercase">
                    {item.note}
                  </p>
                </div>
              </article>
            </Reveal>
          );
        })}
      </ul>

      {/* Локация и оплата — проверяемые детали */}
      <div className="mt-8 grid gap-3.5 md:grid-cols-3">
        <div className="card-surface p-5">
          <h3 className="text-[15px] font-bold text-fog-100">Как добраться</h3>
          <p className="mt-2.5 text-[14.5px] leading-relaxed text-fog-400">
            {address.full}. {address.landmark}. Рядом {address.parkingSpots} парковки.
          </p>
          <a
            href={links.twogisRoute}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3.5 inline-block text-[14.5px] font-bold text-brand-400 transition-colors hover:text-brand-500"
          >
            Построить маршрут →
          </a>
        </div>

        <div className="card-surface p-5">
          <h3 className="text-[15px] font-bold text-fog-100">Оплата</h3>
          <ul className="mt-2.5 flex flex-wrap gap-2">
            {paymentMethods.map((method) => (
              <li
                key={method}
                className="rounded-chip border border-line bg-night-800 px-2.5 py-1.5 text-[13.5px] text-fog-300"
              >
                {method}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[13px] text-fog-500">Способы оплаты указаны в 2ГИС.</p>
        </div>

        <div className="card-surface p-5">
          <h3 className="text-[15px] font-bold text-fog-100">Группа компаний Yasira</h3>
          <p className="mt-2.5 text-[14.5px] leading-relaxed text-fog-400">
            {group.yearsOnMarket} лет на рынке Казахстана, офисы и склады: {group.offices.join(", ")}.
            Доставка продукции более чем в {group.cities} городов страны.
          </p>
          <a
            href={links.groupSite}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3.5 inline-block text-[14.5px] font-bold text-brand-400 transition-colors hover:text-brand-500"
          >
            yasira.kz →
          </a>
        </div>
      </div>

      <p className="mt-6 flex items-start gap-2 text-[13px] leading-relaxed text-fog-500">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>
          Мы не публикуем гарантийные сроки, число сотрудников и имена мастеров: компания не
          заявляла эти данные публично. Уточнить можно по телефону.
        </span>
      </p>
    </Section>
  );
}
