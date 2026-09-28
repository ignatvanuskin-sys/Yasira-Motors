import { CallButton, WhatsAppButton } from "@/components/Actions";
import { Reveal } from "@/components/Reveal";
import { address, phone } from "@/lib/site";

export function FinalCta() {
  return (
    <section id="cta" className="border-t border-line-soft py-16 md:py-20">
      <div className="shell">
        <Reveal>
          <div className="relative overflow-hidden rounded-card border border-line bg-night-850 px-6 py-10 md:px-12 md:py-14">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(620px 220px at 6% 0%, rgba(224,31,38,0.20), transparent 68%), linear-gradient(180deg, rgba(255,255,255,0.02), transparent 40%)",
              }}
            />
            <div className="relative grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center lg:gap-12">
              <div>
                <h2 className="text-[clamp(1.5rem,3.6vw,2.15rem)] text-fog-100">
                  Нужен ремонт или обслуживание автомобиля?
                </h2>
                <p className="mt-4 max-w-[54ch] text-[16px] leading-relaxed text-fog-400">
                  Позвоните или напишите в WhatsApp — расскажите, что происходит с машиной.
                  Сориентируем по работам и договоримся о времени визита.
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <CallButton size="lg" label={`Позвонить ${phone.display}`} className="sm:min-w-[248px]" />
                  <WhatsAppButton size="lg" />
                </div>
              </div>

              <dl className="grid gap-4 border-line-soft sm:grid-cols-2 lg:border-l lg:pl-10">
                <div>
                  <dt className="text-[12px] font-bold tracking-[0.06em] text-fog-500 uppercase">
                    Адрес
                  </dt>
                  <dd className="mt-1.5 text-[15px] font-semibold text-fog-100">
                    {address.microDistrict}
                    <span className="block text-[13.5px] font-normal text-fog-400">
                      Актау, {address.floor}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] font-bold tracking-[0.06em] text-fog-500 uppercase">
                    График
                  </dt>
                  <dd className="mt-1.5 text-[15px] font-semibold text-fog-100">
                    Пн–Сб 09:00–19:00
                    <span className="block text-[13.5px] font-normal text-fog-400">
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
