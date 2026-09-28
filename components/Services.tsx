import { Phone } from "lucide-react";
import { CallButton, WhatsAppButton } from "@/components/Actions";
import { Reveal } from "@/components/Reveal";
import { Section, SectionHead } from "@/components/Section";
import { serviceGroups } from "@/lib/content";
import { phone } from "@/lib/site";

export function Services() {
  return (
    <Section id="services" bordered>
      <SectionHead
        eyebrow="Услуги"
        title="Что делаем"
        lead="Направления, которые компания заявила в 2ГИС. Прайс-лист не публикуется: стоимость зависит от автомобиля и объёма работ."
      />

      <ul className="mt-10 grid gap-3.5 sm:grid-cols-2 lg:mt-12 xl:grid-cols-4">
        {serviceGroups.map((group, i) => {
          const Icon = group.icon;
          return (
            <Reveal as="li" key={group.id} delay={Math.min(i * 45, 260)} className="h-full">
              <article className="group card-surface flex h-full flex-col p-5 transition-colors duration-300 hover:border-brand-500/55 hover:bg-night-800">
                <span className="flex h-10 w-10 items-center justify-center rounded-ctl border border-line bg-night-800 transition-colors duration-300 group-hover:border-brand-500/40 group-hover:bg-brand-600/12">
                  <Icon className="h-[19px] w-[19px] text-brand-400" strokeWidth={2} aria-hidden="true" />
                </span>

                <h3 className="mt-4 text-[16.5px] leading-snug text-fog-100">{group.title}</h3>
                <p className="mt-2.5 text-[14.5px] leading-relaxed text-fog-400">{group.text}</p>

                <ul className="mt-3.5 flex flex-wrap gap-1.5">
                  {group.items.map((item) => (
                    <li
                      key={item}
                      className="rounded-chip border border-line bg-night-800 px-2 py-1 text-[12.5px] text-fog-300"
                    >
                      {item}
                    </li>
                  ))}
                </ul>

                {/* Цена не выдумана: уточняется звонком, без формы записи */}
                <a
                  href={`tel:${phone.tel}`}
                  className="mt-auto inline-flex min-h-[44px] items-center gap-1.5 pt-4 text-[13.5px] font-semibold text-brand-400 transition-colors hover:text-brand-500"
                >
                  <Phone className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden="true" />
                  Уточнить стоимость
                </a>
              </article>
            </Reveal>
          );
        })}
      </ul>

      <div className="mt-4 grid gap-4 rounded-card border border-line bg-night-900 p-5 md:grid-cols-[1.3fr_1fr] md:items-center md:p-6">
        <p className="text-[15.5px] leading-relaxed text-fog-300">
          Не знаете, какая услуга нужна? Позвоните — подскажем, с чего начать.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <CallButton label={`Позвонить ${phone.display}`} />
          <WhatsAppButton />
        </div>
      </div>

      <p className="mt-4 text-[13px] text-fog-500">
        На территории также работают автомойка, детейлинг и кафе для клиентов — по отзывам
        клиентов в{" "}
        <a
          href="https://2gis.kz/aktau/firm/70000001029237438"
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
