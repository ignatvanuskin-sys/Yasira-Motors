"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, Navigation } from "lucide-react";
import { links, address } from "@/lib/site";

/**
 * Карта 2ГИС подгружается только когда блок попал в зону видимости:
 * так первый экран и мобильная загрузка остаются быстрыми.
 */
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
    <div className="flex flex-col overflow-hidden rounded-card border border-line bg-night-850">
      <div ref={holderRef} className="relative min-h-[300px] grow md:min-h-[420px]">
        {load ? (
          <iframe
            title={`YASIRA MOTORS на карте: ${address.full}`}
            src={links.twogisMapWidget}
            loading="lazy"
            className="absolute inset-0 h-full w-full border-0"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-night-850 text-center">
            <span className="h-2 w-2 animate-pulse rounded-full bg-brand-500" aria-hidden="true" />
            <p className="text-[14px] text-fog-500">Загружаем карту 2ГИС…</p>
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
