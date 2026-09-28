import { MapPin, Star } from "lucide-react";
import { CallButton, WhatsAppButton } from "@/components/Actions";
import { heroPhoto } from "@/lib/content";
import { address, links, phone, rating } from "@/lib/site";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-[86px] pb-14 md:pt-[118px] md:pb-20">
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
            <h1 className="text-fog-100">
              <span className="block text-[clamp(2.15rem,7.2vw,3.55rem)] leading-[0.98] tracking-[-0.03em]">
                YASIRA MOTORS
              </span>
              <span className="mt-3.5 block max-w-[30ch] text-[clamp(1.08rem,3.4vw,1.5rem)] leading-snug font-bold text-fog-200">
                Ремонт и обслуживание автомобилей в Актау
              </span>
            </h1>

            <p className="mt-5 max-w-[52ch] text-[16.5px] leading-relaxed text-fog-400">
              Диагностика, техническое обслуживание и ремонт. Сначала находим причину
              неисправности — затем согласовываем работы и стоимость.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center xl:flex-row">
              <CallButton size="lg" label={`Позвонить ${phone.display}`} className="xl:min-w-[248px]" />
              <WhatsAppButton size="lg" />
            </div>

            {/* Адрес и один сигнал доверия — больше в первый экран не кладём */}
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-7">
              <a
                href={links.twogisRoute}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[15px] font-semibold text-fog-200 transition-colors hover:text-fog-100"
              >
                <MapPin className="h-[17px] w-[17px] shrink-0 text-brand-400" aria-hidden="true" />
                {address.microDistrict}, Актау
              </a>

              <a
                href={links.twogisReviews}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[15px] text-fog-400 transition-colors hover:text-fog-200"
              >
                <Star className="h-[16px] w-[16px] shrink-0 fill-gold-400 text-gold-400" aria-hidden="true" />
                <span>
                  <span className="font-bold text-fog-100">
                    {rating.value.toString().replace(".", ",")}
                  </span>{" "}
                  в {rating.source} · {rating.count} оценок
                </span>
              </a>
            </div>
          </div>

          {/* Реальная фотография цеха — главное визуальное доказательство */}
          <div className="lg:col-span-6">
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
              <div
                className="absolute inset-0 rounded-card ring-1 ring-inset ring-white/5"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
