import { Clock, Mail, MapPin, Navigation } from "lucide-react";
import { CallButton, WhatsAppButton } from "@/components/Actions";
import { MapPanel } from "@/components/MapPanel";
import { OpenStatus } from "@/components/OpenStatus";
import { Section, SectionHead } from "@/components/Section";
import { WhatsAppIcon } from "@/components/icons";
import {
  address,
  email,
  links,
  paymentMethods,
  phones,
  schedule,
  scheduleNote,
  whatsappLink,
} from "@/lib/site";

export function Contacts() {
  return (
    <Section id="contacts" bordered>
      <SectionHead
        eyebrow="Контакты"
        title="Приезжайте в YASIRA MOTORS"
        lead="Автосервис, магазин масел и автохимии — по одному адресу в 25-м микрорайоне Актау. Звоните или пишите в WhatsApp: подскажем по вашей задаче."
      />

      <div className="mt-10 grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <div className="flex flex-col gap-4">
          {/* Адрес */}
          <div className="card-surface p-5 md:p-6">
            <h3 className="flex items-center gap-2.5 text-[16px] font-bold text-fog-100">
              <MapPin className="h-[18px] w-[18px] text-brand-400" strokeWidth={2.2} aria-hidden="true" />
              Адрес
            </h3>
            <p className="mt-3 text-[17px] leading-snug font-bold text-fog-100">
              {address.microDistrict}
            </p>
            <p className="mt-1 text-[14.5px] text-fog-400">
              Актау, {address.floor} · 2-этажное здание, парковка рядом ({address.parkingSpots})
            </p>
            <p className="mt-3 text-[14px] text-fog-400">{address.landmark}</p>
            <a
              href={links.twogisRoute}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex h-11 items-center gap-2 rounded-ctl border border-line bg-night-800 px-4 text-[14.5px] font-semibold text-fog-100 transition-colors hover:border-brand-500"
            >
              <Navigation className="h-4 w-4 text-brand-400" aria-hidden="true" />
              Построить маршрут
            </a>
          </div>

          {/* Телефоны */}
          <div className="card-surface p-5 md:p-6">
            <h3 className="text-[16px] font-bold text-fog-100">Телефоны и мессенджеры</h3>
            <ul className="mt-3 divide-y divide-night-800">
              {phones.map((item) => (
                <li key={item.tel}>
                  <a
                    href={`tel:${item.tel}`}
                    className="flex min-h-[52px] items-center justify-between gap-3 py-1 transition-colors hover:text-fog-100"
                  >
                    <span className="text-[14px] text-fog-400">{item.label}</span>
                    <span className="text-[15.5px] font-bold whitespace-nowrap text-fog-100">
                      {item.display}
                    </span>
                  </a>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex flex-wrap gap-2.5">
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-ctl border border-line bg-night-800 px-4 text-[14.5px] font-semibold text-fog-100 transition-colors hover:border-brand-500"
              >
                <WhatsAppIcon className="h-4 w-4" />
                WhatsApp
              </a>
              <a
                href={links.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center rounded-ctl border border-line bg-night-800 px-4 text-[14.5px] font-semibold text-fog-100 transition-colors hover:border-brand-500"
              >
                Instagram
              </a>
              <a
                href={`mailto:${email.general}`}
                className="inline-flex h-11 items-center gap-2 rounded-ctl border border-line bg-night-800 px-4 text-[14.5px] font-semibold text-fog-100 transition-colors hover:border-brand-500"
              >
                <Mail className="h-4 w-4 text-fog-400" aria-hidden="true" />
                {email.general}
              </a>
            </div>
            <p className="mt-3 text-[13px] text-fog-500">
              Для оптовых закупок масел и автохимии: {email.sales}
            </p>
          </div>

          {/* График работы */}
          <div className="card-surface p-5 md:p-6">
            <h3 className="flex items-center gap-2.5 text-[16px] font-bold text-fog-100">
              <Clock className="h-[18px] w-[18px] text-fog-400" aria-hidden="true" />
              График работы
            </h3>
            <dl className="mt-3 divide-y divide-night-800">
              {schedule.map((day) => (
                <div key={day.label} className="flex items-center justify-between gap-3 py-2">
                  <dt className="text-[14.5px] text-fog-400">{day.label}</dt>
                  <dd className="text-[14.5px] font-semibold text-fog-200">
                    {day.open}–{day.close}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-3">
              <OpenStatus />
            </p>
            {/* Расхождение источников по времени закрытия — честнее попросить
                позвонить, чем пообещать неверный час. */}
            <p className="mt-3 border-t border-line-soft pt-3 text-[12.5px] leading-relaxed text-fog-500">
              {scheduleNote}
            </p>
          </div>
        </div>

        {/* Карта + действия */}
        <div className="flex flex-col gap-4">
          <MapPanel />

          <div className="card-surface p-5 md:p-6">
            <h3 className="text-[16px] font-bold text-fog-100">Связаться с сервисом</h3>
            <p className="mt-2 text-[14.5px] leading-relaxed text-fog-400">
              Опишите проблему по телефону или в WhatsApp — мастера подскажут, что делать
              дальше, и когда удобно приехать.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <CallButton size="lg" />
              <WhatsAppButton size="lg" label="Написать в WhatsApp" />
            </div>
            <div className="mt-4 border-t border-line-soft pt-4">
              <h4 className="text-[13px] font-bold tracking-[0.05em] text-fog-500 uppercase">
                Способы оплаты
              </h4>
              <ul className="mt-2 flex flex-wrap gap-2">
                {paymentMethods.map((method) => (
                  <li
                    key={method}
                    className="rounded-chip border border-line bg-night-800 px-2.5 py-1.5 text-[13px] text-fog-300"
                  >
                    {method}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
