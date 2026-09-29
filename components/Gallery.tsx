"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { Section, SectionHead } from "@/components/Section";
import { photos, type Photo } from "@/lib/content";
import { links, rating } from "@/lib/site";

/**
 * На телефоне десять фотографий подряд — это ~2 600px прокрутки до отзывов.
 * Показываем первые пять и кнопку «Показать все фото»; на планшете
 * и десктопе мозаика раскрыта полностью.
 */
const MOBILE_PHOTO_LIMIT = 5;

export function Gallery() {
  const [index, setIndex] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  const isOpen = index !== null;

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  /** Превью, по которому кликнули — туда вернём фокус после закрытия. */
  const triggerRef = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    setIndex(null);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  const move = useCallback((dir: -1 | 1) => {
    setIndex((current) => {
      if (current === null) return current;
      return (current + dir + photos.length) % photos.length;
    });
  }, []);

  const open = (i: number, trigger: HTMLElement) => {
    triggerRef.current = trigger;
    setIndex(i);
  };

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key === "ArrowRight") move(1);
      if (e.key === "ArrowLeft") move(-1);

      // Ловушка фокуса: диалог модальный, Tab не должен уходить на страницу
      if (e.key === "Tab") {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const focusable = Array.from(
          dialog.querySelectorAll<HTMLElement>(
            'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
          ),
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, close, move]);

  const current: Photo | null = index === null ? null : photos[index];

  return (
    <Section id="gallery">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <SectionHead
          eyebrow="Фото"
          title="Реальный сервис YASIRA MOTORS"
          lead="Цех, оборудование и работа мастеров YASIRA MOTORS."
          className="md:max-w-2xl"
        />
        <a
          href={links.twogisGallery}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-[14.5px] font-bold text-brand-400 transition-colors hover:text-brand-500"
        >
          Смотреть больше фото в 2ГИС →
        </a>
      </div>

      <ul className="mt-9 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:auto-rows-[122px] lg:grid-cols-6">
        {photos.map((photo, i) => (
          <li
            key={photo.src}
            className={`${photo.span} ${
              i >= MOBILE_PHOTO_LIMIT && !showAll ? "hidden sm:block" : ""
            }`}
          >
            <button
              type="button"
              onClick={(event) => open(i, event.currentTarget)}
              className="group relative block h-full w-full overflow-hidden rounded-card border border-line bg-night-850"
              aria-label={`Открыть фото: ${photo.caption}`}
            >
              <img
                src={photo.src}
                alt={photo.alt}
                width={photo.w}
                height={photo.h}
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

      {!showAll ? (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mt-3 inline-flex h-12 w-full items-center justify-center rounded-ctl border border-line bg-night-850 text-[15px] font-semibold text-fog-100 transition-colors hover:border-brand-500 sm:hidden"
        >
          Показать все {photos.length} фото
        </button>
      ) : null}

      {/*
        h-dvh, а не только inset-0: на iOS Safari fixed-элемент считается от
        layout-вьюпорта, и нижние кнопки уезжали под панель браузера.
        pb-safe оставляет место под домашний индикатор iPhone.
      */}
      {index !== null && current ? (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={current.caption}
          /* Без backdrop-blur: полноэкранное размытие — самая дорогая
             операция отрисовки на слабом телефоне. Фон и так почти
             непрозрачный, разница не видна, а кадры дешевле. */
          className="overscroll-lock fixed inset-0 z-[70] flex h-dvh flex-col bg-night-950/97 p-4 pb-safe md:pb-8"
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
              ref={closeRef}
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
