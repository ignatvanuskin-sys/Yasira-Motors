"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, Navigation } from "lucide-react";
import { MapPin } from "lucide-react";
import { address, links, company } from "@/lib/site";

/**
 * Тёмная карта.
 *
 * Подложка — публичный OSM-эмбед в iframe, а тёмная тема получается одним
 * CSS-фильтром: инверсия светлых тайлов. Это даёт «свою» тёмную карту без
 * платного провайдера и без библиотек в бандле.
 *
 * Своя метка ставится оверлеем точно в центр: эмбед центрирует карту по
 * координате маркера, поэтому центр кадра и есть адрес сервиса. Так метка
 * получает фирменный цвет и не зависит от чужого оформления.
 *
 * iframe монтируется только при подходе к блоку — первый экран остаётся лёгким.
 */
const MAP_ZOOM = 0.005;
const BBOX = [
  address.lng - MAP_ZOOM,
  address.lat - MAP_ZOOM * 0.6,
  address.lng + MAP_ZOOM,
  address.lat + MAP_ZOOM * 0.6,
].join(",");

const OSM_EMBED = `https://www.openstreetmap.org/export/embed.html?bbox=${BBOX}&layer=mapnik&marker=${address.lat},${address.lng}`;

export function MapPanel() {
  const holderRef = useRef<HTMLDivElement>(null);
  const [load, setLoad] = useState(false);

  useEffect(() => {
    const node = holderRef.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setLoad(true);
            observer.disconnect();
          }
        }
      },
      { rootMargin: "220px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-card border border-line bg-night-850">
      <div ref={holderRef} className="relative min-h-[360px] grow md:min-h-[440px]">
        {load ? (
          <>
            <iframe
              title={`${company.name} на карте: ${address.full}`}
              src={OSM_EMBED}
              loading="lazy"
              className="map-dark absolute inset-0 h-full w-full border-0"
              referrerPolicy="no-referrer-when-downgrade"
            />
            {/* Своя метка поверх фильтра: центр кадра — это адрес сервиса */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full"
            >
              <MapPin
                className="h-9 w-9 fill-brand-500 text-night-950 drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]"
                strokeWidth={1.6}
              />
            </span>
            {/* Карточка адреса: не перехватывает мышь, карта остаётся перетаскиваемой */}
            <div className="pointer-events-none absolute top-4 left-4 rounded-card border border-line bg-night-950/92 px-4 py-3 backdrop-blur-md">
              <p className="label text-brand-400">{company.name}</p>
              <p className="mt-1.5 text-[14px] leading-snug text-fog-100">{address.microDistrict}</p>
              <p className="mt-1 text-[13px] text-fog-400">Актау, {address.floor}</p>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-night-850 text-center">
            <span className="h-2 w-2 animate-pulse rounded-full bg-brand-500" aria-hidden="true" />
            <p className="text-[14px] text-fog-500">Загружаем карту…</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line px-4 py-3.5">
        <a
          href={links.twogisRoute}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-[14px] font-bold text-brand-400 transition-colors hover:text-brand-500"
        >
          <Navigation className="h-4 w-4" aria-hidden="true" />
          Построить маршрут
        </a>
        <a
          href={links.twogis}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-[14px] font-semibold text-fog-300 transition-colors hover:text-fog-100"
        >
          Открыть карточку в 2ГИС
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
