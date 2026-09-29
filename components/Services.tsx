import { ArrowRight } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons";
import { Reveal } from "@/components/Reveal";
import { Section, SectionHead } from "@/components/Section";
import { RubricMarquee } from "@/components/fx/RubricMarquee";
import { serviceGroups } from "@/lib/content";
import { phone, whatsappLink, whatsappServiceText } from "@/lib/site";

/**
 * Услуги — список направлений, а не стена карточек: восемь строк читаются
 * как оглавление. Номеров у строк нет: «01–08» подразумевала порядок, которого
 * у списка нет, а подпись «Уточнить стоимость» повторялась восемь раз и
 * ничего не уточняла.
 *
 * У строки два действия, и выбрать можно осознанно: сама строка ведёт на
 * звонок, рядом кнопка WhatsApp с уже подставленным названием услуги.
 *
 * Две ссылки стоят рядом, а не одна внутри другой: вложенные ссылки ломают
 * и разметку, и озвучку скринридером.
 *
 * Формы записи нет: время визита согласуют по телефону или в WhatsApp.
 */
export function Services() {
  return (
    <Section id="services" bordered tone="alt">
      <SectionHead
        eyebrow="Услуги"
        title="Что делаем"
        lead="Диагностика, обслуживание и ремонт легковых автомобилей. Точную стоимость называем после диагностики — до начала работ."
      />

      <ul className="mt-10 border-y border-line">
        {serviceGroups.map((group, i) => (
          <li key={group.id} className="border-b border-line last:border-b-0">
            <Reveal delay={Math.min(i * 40, 200)}>
              {/*
                Вся строка — одна ссылка в WhatsApp. На телефоне попасть по
                строке заметно проще, чем по кнопке рядом с текстом, а вложенные
                ссылки ломают и разметку, и озвучку скринридером. Звонок остался
                в первом экране, в контактах и в нижней панели.
              */}
              <a
                href={whatsappLink(phone.whatsapp, whatsappServiceText(group.title))}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Написать в WhatsApp про «${group.title}»`}
                data-track="service_card_click"
                data-track-source="services"
                data-track-topic={group.title}
                className="group flex min-h-[48px] items-center gap-4 py-6 md:gap-8 md:py-7"
              >
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
                  <span className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-fog-500 transition-colors group-hover:text-brand-400">
                    Написать в WhatsApp
                    <ArrowRight
                      className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </span>
                </span>

                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-ctl border border-line transition-colors group-hover:border-brand-500 group-hover:bg-brand-500">
                  <WhatsAppIcon className="h-4 w-4 text-fog-300 transition-colors group-hover:text-white" />
                </span>
              </a>
            </Reveal>
          </li>
        ))}
      </ul>

      {/* Полный перечень рубрик, заявленных компанией в 2ГИС: выше показаны
          направления, здесь — весь список целиком */}
      <RubricMarquee />

      <p className="mt-6 text-[13px] text-fog-500">
        На территории также работают автомойка, детейлинг и кафе для клиентов.
      </p>
    </Section>
  );
}
