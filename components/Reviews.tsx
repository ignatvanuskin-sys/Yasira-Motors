"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Stars } from "@/components/Stars";
import { TwoGisMark } from "@/components/icons";
import { Section, SectionHead } from "@/components/Section";
import { reviews } from "@/lib/content";
import { links, rating } from "@/lib/site";

export function Reviews() {
  const railRef = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const sync = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 8);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      el.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [sync]);

  const nudge = (dir: -1 | 1) => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(el.clientWidth * 0.78, 280), behavior: "smooth" });
  };

  const arrowClass =
    "inline-flex h-10 w-10 items-center justify-center rounded-ctl border border-line bg-night-850 text-fog-200 transition-colors hover:border-brand-500 hover:text-fog-100 disabled:pointer-events-none disabled:opacity-35";

  return (
    <Section id="reviews" tone="alt">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <SectionHead
          eyebrow="Отзывы"
          title="Что говорят клиенты"
          lead="Отзывы клиентов из карточки компании в 2ГИС — с авторами и датами."
          className="md:max-w-2xl"
        />

        <div className="flex shrink-0 items-end gap-5">
          <div className="rounded-card border border-line bg-night-900 px-5 py-4">
            <div className="flex items-baseline gap-2">
              <span className="text-[34px] leading-none font-extrabold tracking-[-0.03em] text-fog-100">
                {rating.value.toString().replace(".", ",")}
              </span>
              <span className="text-[15px] font-bold text-fog-400">из 5</span>
            </div>
            <Stars value={5} className="mt-2 h-[15px] w-[15px]" />
            <p className="mt-2 text-[13px] text-fog-400">
              {rating.count} оценок в {rating.source}
            </p>
          </div>

          <div className="hidden gap-2 sm:flex">
            <button type="button" onClick={() => nudge(-1)} disabled={atStart} className={arrowClass} aria-label="Предыдущие отзывы">
              <ChevronLeft className="h-[18px] w-[18px]" />
            </button>
            <button type="button" onClick={() => nudge(1)} disabled={atEnd} className={arrowClass} aria-label="Следующие отзывы">
              <ChevronRight className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </div>

      {/* Лента прокручивается: tabIndex нужен, чтобы её можно было
          прокрутить с клавиатуры. role не переопределяем — иначе <li>
          перестают считаться элементами списка. */}
      <ul
        ref={railRef}
        tabIndex={0}
        aria-label="Отзывы клиентов из 2ГИС — прокручивается по горизонтали"
        className="no-scrollbar -mx-5 mt-9 flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-5 pb-2 md:-mx-8 md:px-8"
      >
        {reviews.map((review) => (
          <li
            key={`${review.author}-${review.dateISO}`}
            className="w-[292px] shrink-0 snap-start sm:w-[352px]"
          >
            <article className="card-surface flex h-full flex-col p-5">
              <div className="flex items-center justify-between gap-3">
                <Stars value={review.rating} className="h-[15px] w-[15px]" />
                <span className="inline-flex items-center gap-1.5 text-fog-500" title="Источник — 2ГИС">
                  <TwoGisMark className="h-[15px] w-[15px]" />
                  <span className="text-[12px] font-semibold">2ГИС</span>
                </span>
              </div>

              <p lang={review.lang} className="mt-4 grow text-[14.5px] leading-relaxed text-fog-200">
                «{review.text}»
              </p>

              <footer className="mt-5 border-t border-line-soft pt-3.5">
                <p className="text-[14.5px] font-bold text-fog-100">{review.author}</p>
                <p className="mt-0.5 text-[12.5px] text-fog-500">{review.date}</p>
                {review.verified ? (
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-chip bg-emerald-500/10 px-2 py-1 text-[11.5px] font-semibold text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                    {review.verified}
                  </p>
                ) : null}
              </footer>
            </article>
          </li>
        ))}
      </ul>

      {/* Подсказка только на телефоне: на desktop рядом есть стрелки */}
      <p className="mt-2 text-[13px] text-fog-500 sm:hidden">
        Листайте карточки вбок, чтобы прочитать другие отзывы →
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
        <a
          href={links.twogisReviews}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-[14.5px] font-bold text-brand-400 transition-colors hover:text-brand-500"
        >
          Все отзывы — в карточке 2ГИС
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>
    </Section>
  );
}
