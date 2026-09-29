"use client";

import { useState } from "react";
import { ExternalLink, MapPin, Navigation } from "lucide-react";
import { address, company, links } from "@/lib/site";

/**
 * Карта грузится только по нажатию.
 *
 * Раньше iframe OpenStreetMap подключался сам при подходе к блоку: это тянуло
 * чужие тайлы и скрипты при каждой прокрутке, а при плохой сети оставляло
 * вечное «Загружаем карту…». Теперь до нажатия видно фасад с адресом, а
 * маршрут строится в любой из трёх карт — ключи для этого не нужны, координаты
 * у нас есть. Если тайлы всё же не пришли, вместо бесконечного ожидания
 * появляется текстовая ссылка.
 */
const MAP_ZOOM = 0.005;
const BBOX = [
  address.lng - MAP_ZOOM,
  address.lat - MAP_ZOOM * 0.6,
  address.lng + MAP_ZOOM,
  address.lat + MAP_ZOOM * 0.6,
].join(",");

const OSM_EMBED = `https://www.openstreetmap.org/export/embed.html?bbox=${BBOX}&layer=mapnik&marker=${address.lat},${address.lng}`;

/** Маршрут из координат: ни один из сервисов не требует ключа. */
const routeLinks = [
  { provider: "2gis", label: "2ГИС", href: links.twogisRoute },
  {
    provider: "google",
    label: "Google Maps",
    href: `https://www.google.com/maps/dir/?api=1&destination=${address.lat},${address.lng}`,
  },
  {
    provider: "yandex",
    label: "Яндекс.Карты",
    href: `https://yandex.ru/maps/?rtext=~${address.lat},${address.lng}&rtt=auto`,
  },
];

export function MapPanel() {
  const [shown, setShown] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-card border border-line bg-night-850">
      <div className="relative min-h-[300px] grow md:min-h-[400px]">
        {shown && !failed ? (
          <iframe
            title={`${company.name} на карте: ${address.full}`}
            src={OSM_EMBED}
            onError={() => setFailed(true)}
            className="map-dark absolute inset-0 h-full w-full border-0"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-night-900 px-6 text-center">
            <MapPin className="h-8 w-8 text-brand-500" strokeWidth={1.8} aria-hidden="true" />
            <p className="text-[16px] font-semibold text-fog-100">{address.microDistrict}</p>
            <p className="text-[13.5px] text-fog-400">Актау, {address.floor}</p>

            {failed ? (
              <p className="mt-1 max-w-[36ch] text-[13.5px] leading-relaxed text-fog-500">
                Карту загрузить не удалось. Маршрут можно построить в{" "}
                <a
                  href={links.twogisRoute}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-track="route_click"
                  data-track-provider="2gis"
                  className="font-semibold text-brand-400 underline decoration-night-700 underline-offset-2 hover:text-brand-500"
                >
                  2ГИС
                </a>
                .
              </p>
            ) : (
              <button
                type="button"
                onClick={() => setShown(true)}
                data-track="map_open"
                className="mt-1 inline-flex h-[48px] items-center gap-2 rounded-ctl border border-line bg-night-800 px-5 text-[14.5px] font-semibold text-fog-100 transition-colors hover:border-brand-500 hover:bg-night-750"
              >
                Показать карту
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line px-4 py-3">
        <span className="text-[13px] font-semibold text-fog-500">Маршрут:</span>
        {routeLinks.map((item) => (
          <a
            key={item.provider}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            data-track="route_click"
            data-track-provider={item.provider}
            className="inline-flex min-h-[44px] items-center gap-1.5 text-[14px] font-semibold text-fog-200 transition-colors hover:text-brand-400"
          >
            {item.provider === "2gis" ? (
              <Navigation className="h-4 w-4 text-brand-400" aria-hidden="true" />
            ) : null}
            {item.label}
            <ExternalLink className="h-3.5 w-3.5 text-fog-500" aria-hidden="true" />
          </a>
        ))}
      </div>
    </div>
  );
}
