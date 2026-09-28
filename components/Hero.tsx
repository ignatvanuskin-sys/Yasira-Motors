import { Award, Clock, MapPin } from "lucide-react";
import { CallButton, WhatsAppButton } from "@/components/Actions";
import { OpenStatus } from "@/components/OpenStatus";
import { heroPhoto } from "@/lib/content";
import { address, phone, rating, scheduleSummary } from "@/lib/site";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-[86px] pb-14 md:pt-[118px] md:pb-20">
      {/* Фон: мягкое свечение, без ярких градиентов */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[560px] opacity-[0.5]"
        style={{
          background:
            "radial-gradient(560px 320px at 12% 0%, rgba(224,31,38,0.16), transparent 70%), radial-gradient(720px 380px at 88% 8%, rgba(255,255,255,0.045), transparent 72%)",
        }}
      />

      <div className="shell relative">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-6">
            <p className="eyebrow">
              <span className="h-px w-6 bg-brand-500" aria-hidden="true" />
              Актау · 25-й микрорайон, 52/2
            </p>

            <h1 className="mt-5 text-fog-100">
              <span className="block text-[clamp(2.15rem,7.2vw,3.55rem)] leading-[0.98] tracking-[-0.03em]">
                YASIRA MOTORS
              </span>
              <span className="mt-3.5 block max-w-[30ch] text-[clamp(1.08rem,3.4vw,1.5rem)] leading-snug font-bold text-fog-200">
                Автосервис в Актау — обслуживание и ремонт автомобилей
              </span>
            </h1>

            <p className="mt-5 max-w-[56ch] text-[16.5px] leading-relaxed text-fog-400">
              Компьютерная диагностика, ТО и замена масла, ремонт двигателя, АКПП и МКПП,
              ходовой части и электрики, развал-схождение на стенде. Масла и автохимия — в
              своём магазине на месте.
            </p>

            <div className="mt-7 flex flex-col gap-3 xl:flex-row xl:items-center">
              <CallButton size="lg" label={`Позвонить ${phone.display}`} className="xl:min-w-[248px]" />
              <WhatsAppButton size="lg" />
            </div>

            {/* Индикаторы доверия */}
            <dl className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-3">
              <div className="bg-night-900 px-4 py-4">
                <dt className="text-[12.5px] leading-none text-fog-500">Рейтинг в 2ГИС</dt>
                <dd className="mt-2.5 text-[16px] leading-none font-bold text-fog-100">
                  {rating.value.toString().replace(".", ",")} из 5
                </dd>
                <p className="mt-2 text-[12.5px] text-fog-500">{rating.count} оценок</p>
              </div>

              <div className="bg-night-900 px-4 py-4">
                <dt className="flex items-center gap-1.5 text-[12.5px] leading-none text-fog-500">
                  <MapPin className="h-3.5 w-3.5 text-brand-400" aria-hidden="true" />
                  Адрес
                </dt>
                <dd className="mt-2.5 text-[16px] leading-tight font-bold text-fog-100">
                  {address.microDistrict}
                </dd>
                <p className="mt-2 text-[12.5px] text-fog-500">Актау, {address.floor}</p>
              </div>

              <div className="bg-night-900 px-4 py-4">
                <dt className="flex items-center gap-1.5 text-[12.5px] leading-none text-fog-500">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  Пн–Сб
                </dt>
                <dd className="mt-2.5 text-[16px] leading-none font-bold text-fog-100">
                  09:00–19:00
                </dd>
                <p className="mt-2 text-[12.5px] text-fog-500">Вс 10:00–17:00</p>
              </div>
            </dl>

            <p className="mt-3">
              <OpenStatus />
            </p>
          </div>

          {/* Фотография: реальный цех компании */}
          <div className="pb-8 lg:col-span-6 lg:pb-0">
            <div className="relative">
              <img
                src={heroPhoto.src}
                width={heroPhoto.width}
                height={heroPhoto.height}
                alt={heroPhoto.alt}
                fetchPriority="high"
                decoding="async"
                className="aspect-[4/3] w-full rounded-card border border-line object-cover sm:aspect-[16/11]"
              />
              <div className="absolute inset-0 rounded-card ring-1 ring-inset ring-white/5" aria-hidden="true" />

              <div className="card-surface absolute -bottom-6 left-3 flex items-center gap-3 px-4 py-3 shadow-deep md:left-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-ctl bg-brand-600">
                  <Award className="h-[18px] w-[18px] text-white" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[13.5px] font-bold text-fog-100">2GIS Awards 2026</p>
                  <p className="text-[12.5px] text-fog-400">«Лучший автосервис»</p>
                </div>
              </div>
            </div>

            <p className="mt-10 text-[13px] text-fog-500 lg:mt-9">
              Фотографии — из карточки компании в 2ГИС. График работы: {scheduleSummary}.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
