import { Phone } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { Section, SectionHead } from "@/components/Section";
import { extraOnSite, services } from "@/lib/content";
import { links, phone } from "@/lib/site";

export function Services() {
  return (
    <Section id="services" bordered>
      <SectionHead
        eyebrow="Услуги"
        title="Услуги автосервиса в Актау"
        lead="Направления, которые компания заявила в 2ГИС. Ремонт — в цеху на своём оборудовании, масла и автохимия — в магазине на территории."
      />

      <ul className="mt-10 grid gap-3.5 sm:grid-cols-2 lg:mt-12 xl:grid-cols-4">
        {services.map((service, i) => {
          const Icon = service.icon;
          return (
            <Reveal as="li" key={service.id} delay={Math.min(i * 45, 260)} className="h-full">
              <article className="group card-surface flex h-full flex-col p-5 transition-colors duration-300 hover:border-brand-500/55 hover:bg-night-800">
                <span className="flex h-10 w-10 items-center justify-center rounded-ctl border border-line bg-night-800 transition-colors duration-300 group-hover:border-brand-500/40 group-hover:bg-brand-600/12">
                  <Icon className="h-[19px] w-[19px] text-brand-400" strokeWidth={2} aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-[16.5px] leading-snug text-fog-100">{service.title}</h3>
                <p className="mt-2.5 text-[14.5px] leading-relaxed text-fog-400">{service.text}</p>
              </article>
            </Reveal>
          );
        })}
      </ul>

      <div className="mt-8 grid gap-5 rounded-card border border-line bg-night-900 p-5 md:grid-cols-[1.35fr_1fr] md:items-center md:p-6">
        <div>
          <h3 className="text-[15px] font-bold text-fog-100">На территории сервиса также работают</h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {extraOnSite.map((item) => (
              <li
                key={item}
                className="rounded-chip border border-line bg-night-850 px-2.5 py-1.5 text-[13.5px] font-medium text-fog-300"
              >
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[13px] text-fog-500">
            Перечислено по отзывам клиентов в 2ГИС. Источник:{" "}
            <a
              href={links.twogis}
              target="_blank"
              rel="noopener noreferrer"
              className="text-fog-400 underline decoration-night-700 underline-offset-2 hover:text-fog-200"
            >
              карточка компании в 2ГИС
            </a>
            .
          </p>
        </div>

        <div className="rounded-card border border-line bg-night-850 p-4">
          <h3 className="text-[15px] font-bold text-fog-100">Сколько это стоит</h3>
          <p className="mt-2 text-[14.5px] leading-relaxed text-fog-400">
            Прайс-лист компания не публикует: стоимость зависит от автомобиля и объёма работ.
            Позвоните — сориентируем по вашей задаче до начала работ.
          </p>
          <a
            href={`tel:${phone.tel}`}
            className="mt-3.5 inline-flex h-11 items-center gap-2 rounded-ctl border border-line bg-night-800 px-4 text-[14.5px] font-bold text-fog-100 transition-colors hover:border-brand-500"
          >
            <Phone className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
            {phone.display}
          </a>
        </div>
      </div>
    </Section>
  );
}
