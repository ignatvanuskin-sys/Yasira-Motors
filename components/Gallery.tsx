"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { Section, SectionHead } from "@/components/Section";
import { photos, type Photo } from "@/lib/content";
import { links, rating } from "@/lib/site";

export function Gallery() {
  const [index, setIndex] = useState<number | null>(null);
  const isOpen = index !== null;

  const close = useCallback(() => setIndex(null), []);
  const move = useCallback((dir: -1 | 1) => {
    setIndex((current) => {
      if (current === null) return current;
      return (current + dir + photos.length) % photos.length;
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") move(1);
      if (e.key === "ArrowLeft") move(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, close, move]);

  const current: Photo | null = index === null ? null : photos[index];

  return (
    <Section id="gallery" bordered>
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <SectionHead
          eyebrow="Фото"
          title="Как устроен сервис"
          lead="Реальные снимки компании: ремонтный цех, стенд развал-схождения, магазин масел и работа мастеров. Стоковых изображений на сайте нет."
          className="md:max-w-2xl"
        />
        <a
          href={links.twogisGallery}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-[14.5px] font-bold text-brand-400 transition-colors hover:text-brand-500"
        >
          Ещё {rating.photos - photos.length} фото в 2ГИС →
        </a>
      </div>

      <ul className="mt-9 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:auto-rows-[122px] lg:grid-cols-6">
        {photos.map((photo, i) => (
          <li key={photo.src} className={photo.span}>
            <button
              type="button"
              onClick={() => setIndex(i)}
              className="group relative block h-full w-full overflow-hidden rounded-card border border-line bg-night-850"
              aria-label={`Открыть фото: ${photo.caption}`}
            >
              <img
                src={photo.src}
                alt={photo.alt}
                loading="lazy"
                decoding="async"
                className="aspect-[4/3] w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,0.68,0.24,1)] group-hover:scale-[1.035] sm:aspect-[16/10] lg:aspect-auto lg:h-full"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-night-950/85 via-night-950/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
              <span className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-1.5 p-3.5 text-left opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                <span className="block text-[13px] leading-snug font-semibold text-fog-100">
                  {photo.caption}
                </span>
              </span>
              <span
                aria-hidden="true"
                className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-ctl border border-white/15 bg-night-950/70 text-fog-200 opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100"
              >
                <Expand className="h-4 w-4" />
              </span>
            </button>
          </li>
        ))}
      </ul>

      {index !== null && current ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={current.caption}
          className="fixed inset-0 z-[70] flex flex-col bg-night-950/96 p-4 backdrop-blur-sm md:p-8"
          onClick={close}
        >
          <div className="flex items-center justify-between gap-4">
            <p className="text-[14px] font-semibold text-fog-300">
              {current.caption}
              <span className="ml-2 font-normal text-fog-500">
                {index + 1} / {photos.length}
              </span>
            </p>
            <button
              type="button"
              onClick={close}
              className="inline-flex h-11 w-11 items-center justify-center rounded-ctl border border-line bg-night-850 text-fog-100"
              aria-label="Закрыть просмотр"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div
            className="flex min-h-0 grow items-center justify-center py-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={current.src}
              alt={current.alt}
              className="max-h-full w-auto max-w-full rounded-card border border-line object-contain"
            />
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                move(-1);
              }}
              className="inline-flex h-11 w-11 items-center justify-center rounded-ctl border border-line bg-night-850 text-fog-100"
              aria-label="Предыдущее фото"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                move(1);
              }}
              className="inline-flex h-11 w-11 items-center justify-center rounded-ctl border border-line bg-night-850 text-fog-100"
              aria-label="Следующее фото"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : null}
    </Section>
  );
}
