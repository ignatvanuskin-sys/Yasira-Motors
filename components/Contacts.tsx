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
  phone,
  phones,
  schedule,
  scheduleNote,
  whatsappLink,
} from "@/lib/site";

export function Contacts() {
  const extraPhones = phones.filter((item) => item.tel !== phone.tel);

  return (
    <Section id="contacts" bordered>
      <SectionHead
        eyebrow="Контакты"
        title="Приезжайте в YASIRA MOTORS"
        lead="Автосервис и магазин масел — по одному адресу в 25-м микрорайоне Актау."
      />

      <div className="mt-10 grid gap-4 lg:grid-cols-[1fr_1.05fr]">
        <div className="flex flex-col gap-4">
          {/* Главный контактный блок: адрес, график, три действия */}
          <div className="card-surface p-5 md:p-6">
            <h3 className="flex items-center gap-2.5 text-[16px] font-bold text-fog-100">
              <MapPin className="h-[18px] w-[18px] text-brand-400" strokeWidth={2.2} aria-hidden="true" />
              Адрес
            </h3>
            <p className="mt-3 text-[19px] leading-snug font-bold text-fog-100">
              {address.microDistrict}
            </p>
            <p className="mt-1 text-[14.5px] text-fog-400">Актау, {address.floor}</p>
            <p className="mt-3 text-[14px] text-fog-400">{address.landmark}</p>

            <div className="mt-5 border-t border-line-soft pt-4">
              <h4 className="flex items-center gap-2 text-[14.5px] font-bold text-fog-100">
                <Clock className="h-[17px] w-[17px] text-fog-400" aria-hidden="true" />
                График работы
              </h4>
              <dl className="mt-2 divide-y divide-night-800">
                <div className="flex items-center justify-between gap-3 py-1.5">
                  <dt className="text-[14.5px] text-fog-400">Пн–Сб</dt>
                  <dd className="text-[14.5px] font-semibold text-fog-200">09:00–19:00</dd>
                </div>
                <div className="flex items-center justify-between gap-3 py-1.5">
                  <dt className="text-[14.5px] text-fog-400">Воскресенье</dt>
                  <dd className="text-[14.5px] font-semibold text-fog-200">10:00–17:00</dd>
                </div>
              </dl>
              <p className="mt-2">
                <OpenStatus />
              </p>
              <p className="mt-2 text-[12.5px] leading-relaxed text-fog-500">{scheduleNote}</p>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {/* Номер прямо в кнопке: так он виден и не дублируется ссылкой мелким шрифтом */}
              <CallButton size="lg" label={`Позвонить ${phone.display}`} />
              <WhatsAppButton size="lg" label="WhatsApp" />
              <a
                href={links.twogisRoute}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-[52px] items-center justify-center gap-2.5 rounded-ctl border border-line bg-night-800 px-6 text-[15px] font-semibold text-fog-100 transition-colors hover:border-brand-500 sm:col-span-2"
              >
                <Navigation className="h-[18px] w-[18px] text-brand-400" aria-hidden="true" />
                Построить маршрут
              </a>
            </div>

          </div>

          {/* Дополнительные номера — намеренно мелким текстом */}
          <div className="card-surface p-5 md:p-6">
            <h3 className="text-[15px] font-bold text-fog-100">Другие телефоны</h3>
            <ul className="mt-2.5 divide-y divide-night-800">
              {extraPhones.map((item) => (
                <li key={item.tel}>
                  <a
                    href={`tel:${item.tel}`}
                    className="flex min-h-[44px] items-center justify-between gap-3 text-[13.5px] text-fog-400 transition-colors hover:text-fog-200"
                  >
                    <span>{item.label}</span>
                    <span className="font-semibold whitespace-nowrap text-fog-300">
                      {item.display}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[12px] text-fog-500">
              Подписи — по данным карточки 2ГИС.
            </p>

            <div className="mt-4 flex flex-wrap gap-2.5">
              <a
                href={links.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center rounded-ctl border border-line bg-night-800 px-4 text-[14px] font-semibold text-fog-200 transition-colors hover:border-brand-500"
              >
                Instagram
              </a>
              <a
                href={`mailto:${email.general}`}
                className="inline-flex h-11 items-center gap-2 rounded-ctl border border-line bg-night-800 px-4 text-[14px] font-semibold text-fog-200 transition-colors hover:border-brand-500"
              >
                <Mail className="h-4 w-4 text-fog-400" aria-hidden="true" />
                {email.general}
              </a>
            </div>

            <div className="mt-4 border-t border-line-soft pt-4">
              <h4 className="text-[12px] font-bold tracking-[0.05em] text-fog-500 uppercase">
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

        <MapPanel />
      </div>

      <p className="mt-6 flex items-start gap-2 text-[13px] leading-relaxed text-fog-500">
        <WhatsAppIcon className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Быстрее всего — позвонить или написать в WhatsApp. Онлайн-записи нет: время визита
          согласовываем по телефону.
        </span>
      </p>
    </Section>
  );
}
