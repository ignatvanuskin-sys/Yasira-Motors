import { Clock, Mail, MapPin, Navigation } from "lucide-react";
import { CallButton, WhatsAppButton } from "@/components/Actions";
import { CopyPhone } from "@/components/CopyPhone";
import { MapPanel } from "@/components/MapPanel";
import { OpenStatus } from "@/components/OpenStatus";
import { Section, SectionHead } from "@/components/Section";
import { WhatsAppIcon } from "@/components/icons";
import { address, email, links, paymentMethods, phone, phones, scheduleSummary } from "@/lib/site";

/**
 * Порядок блоков намеренный: сначала быстрые действия и адрес, потом карта,
 * и только затем второстепенное (другие телефоны, соцсети, оплата).
 * Так основной CTA оказывается в начале секции и не попадает под
 * фиксированную нижнюю панель при переходе по анкору.
 */
export function Contacts() {
  const extraPhones = phones.filter((item) => item.tel !== phone.tel);

  return (
    <Section id="contacts">
      <SectionHead
        eyebrow="Контакты"
        title="Приезжайте в YASIRA MOTORS"
        lead="Автосервис и магазин масел — по одному адресу в 25-м микрорайоне Актау."
      />

      {/* min-w-0 у колонок: иначе сетка растягивается по самому широкому
          содержимому и выдавливает страницу вбок на узких экранах */}
      <div className="mt-10 grid gap-4 [&>*]:min-w-0 lg:grid-cols-[1fr_1.05fr]">
        <div className="lg:col-start-1 lg:row-start-1">
          <div className="card-surface h-full p-5 md:p-6">
            <h3 className="flex items-center gap-2.5 text-[16px] font-bold text-fog-100">
              <MapPin className="h-[18px] w-[18px] text-brand-400" strokeWidth={2.2} aria-hidden="true" />
              Адрес и связь
            </h3>
            <p className="mt-3 text-[19px] leading-snug font-bold text-fog-100">
              {address.microDistrict}
            </p>
            <p className="mt-1 text-[14.5px] text-fog-400">Актау, {address.floor}</p>

            {/* Быстрые действия — сразу под адресом, выше всего второстепенного */}
            <div className="mt-5 grid gap-3 [&>*]:min-w-0 sm:grid-cols-2">
              <CallButton size="lg" label={`Позвонить ${phone.display}`} source="contacts" />
              <WhatsAppButton size="lg" label="WhatsApp" source="contacts" />
              <a
                href={links.twogisRoute}
                target="_blank"
                rel="noopener noreferrer"
                data-track="route_click"
                data-track-provider="2gis"
                className="inline-flex h-[52px] items-center justify-center gap-2.5 rounded-ctl border border-line bg-night-800 px-6 text-[15px] font-semibold text-fog-100 transition-colors hover:border-brand-500 sm:col-span-2"
              >
                <Navigation className="h-[18px] w-[18px] text-brand-400" aria-hidden="true" />
                Построить маршрут
              </a>
              {/* С компьютера звонок не сделать — номер нужен текстом */}
              <CopyPhone className="hidden sm:col-span-2 md:inline-flex" />
            </div>

            <div className="mt-5 border-t border-line-soft pt-4">
              <h4 className="flex items-center gap-2 text-[14.5px] font-bold text-fog-100">
                <Clock className="h-[17px] w-[17px] text-fog-400" aria-hidden="true" />
                График работы
              </h4>
              {/* График берётся из конфига: набранный руками, он расходится
                  с остальной страницей и с разметкой для поисковика */}
              <p className="mt-2 text-[14.5px] font-semibold text-fog-200">{scheduleSummary}</p>
              <p className="mt-2">
                <OpenStatus />
              </p>
            </div>

            <p className="mt-4 text-[14px] text-fog-400">{address.landmark}</p>
          </div>
        </div>

        {/* На мобильном карта идёт сразу после быстрых действий */}
        <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <MapPanel />
        </div>

        <div className="lg:col-start-1 lg:row-start-2">
          <div className="card-surface h-full p-5 md:p-6">
            <h3 className="text-[15px] font-bold text-fog-100">Другие телефоны</h3>
            <ul className="mt-2 divide-y divide-night-800">
              {extraPhones.map((item) => (
                <li key={item.tel}>
                  <a
                    href={`tel:${item.tel}`}
                    data-track="call_click"
                    data-track-source="contacts"
                    className="flex min-h-[48px] items-center justify-between gap-3 text-[13.5px] text-fog-400 transition-colors hover:text-fog-200"
                  >
                    <span>{item.label}</span>
                    <span className="font-semibold whitespace-nowrap text-fog-300">
                      {item.display}
                    </span>
                  </a>
                </li>
              ))}
            </ul>

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
      </div>

      <p className="mt-6 flex items-start gap-2 text-[13px] leading-relaxed text-fog-500">
        <WhatsAppIcon className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Онлайн-записи нет: время визита согласовываем по телефону или в WhatsApp.
        </span>
      </p>
    </Section>
  );
}
