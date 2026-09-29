import { Phone } from "lucide-react";
import { Beams } from "@/components/fx/backdrops";
import { CallButton, WhatsAppButton } from "@/components/Actions";
import { OpenStatus } from "@/components/OpenStatus";
import { Reveal } from "@/components/Reveal";
import { address, phone } from "@/lib/site";

/**
 * Финальный призыв — последняя возможность позвонить, поэтому номер здесь
 * показан крупно и целиком кликабелен, а рядом стоит живой статус работы:
 * человек видит, что звонить сейчас уместно.
 */
export function FinalCta() {
  return (
    <section id="cta" className="border-t border-line-soft py-16 md:py-20">
      <div className="shell">
        <Reveal>
          <div className="grain relative overflow-hidden rounded-card border border-line bg-night-850 px-6 py-10 md:px-12 md:py-14">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(620px 220px at 6% 0%, rgba(224,31,38,0.20), transparent 68%), linear-gradient(180deg, rgba(255,255,255,0.02), transparent 40%)",
              }}
            />

            {/* Лучи идут вдоль всего блока и уводят взгляд к кнопкам */}
            <Beams lines={12} className="opacity-70" />

            <div className="relative grid gap-8 lg:grid-cols-[1.35fr_1fr] lg:items-center lg:gap-12">
              <div>
                <h2 className="display text-[clamp(1.5rem,4vw,2.4rem)] text-fog-100">
                  Нужен ремонт или обслуживание автомобиля?
                </h2>
                <p className="mt-4 max-w-[54ch] text-[16px] leading-relaxed text-fog-400">
                  Позвоните или напишите в WhatsApp — расскажите, что происходит с машиной.
                  Подскажем, с чего начать, и согласуем время визита.
                </p>

                <a
                  href={`tel:${phone.tel}`}
                  className="mt-6 inline-flex items-center gap-3 text-fog-100 transition-colors hover:text-brand-400"
                  data-cta="call"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-ctl bg-brand-500">
                    <Phone className="h-[19px] w-[19px] text-white" strokeWidth={2.4} aria-hidden="true" />
                  </span>
                  <span className="display text-[clamp(1.4rem,3.6vw,2.1rem)]">{phone.display}</span>
                </a>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <CallButton size="lg" label="Позвонить" source="final" />
                  <WhatsAppButton size="lg" label="Написать в WhatsApp" source="final" />
                </div>

                <p className="mt-5">
                  <OpenStatus />
                </p>
              </div>

              <dl className="grid gap-4 border-line-soft sm:grid-cols-2 lg:border-l lg:pl-10">
                <div>
                  <dt className="label text-fog-500">Адрес</dt>
                  <dd className="mt-2 text-[15px] font-semibold text-fog-100">
                    {address.microDistrict}
                    <span className="mt-1 block text-[13.5px] font-normal text-fog-400">
                      Актау, {address.floor}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="label text-fog-500">График</dt>
                  <dd className="mt-2 text-[15px] font-semibold text-fog-100">
                    Пн–Сб 09:00–19:00
                    <span className="mt-1 block text-[13.5px] font-normal text-fog-400">
                      Вс 10:00–17:00
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
