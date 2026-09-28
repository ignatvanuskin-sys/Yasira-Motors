"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

/**
 * Свечение под курсором (приём Aceternity «card hover effect»).
 *
 * Два отличия от оригинала, и оба про цену:
 *
 * 1. Один слушатель `pointermove` на всю группу, а не по одному на карточку.
 *    Иначе на четырёх карточках висело бы четыре обработчика, и каждый
 *    считал бы одно и то же (правило client-event-listeners).
 * 2. Прямоугольник карточки измеряется один раз — при входе на неё, а не на
 *    каждое движение мыши. Чтение getBoundingClientRect в обработчике
 *    заставляет браузер пересчитывать макет; правило js-batch-dom-css прямо
 *    про это.
 *
 * Координаты пишутся в CSS-переменные --gx/--gy. React при этом не
 * перерисовывается ни разу: меняется только значение переменной, а градиент
 * рисует CSS (см. [data-glow] в globals.css).
 *
 * На тач-устройствах и при prefers-reduced-motion обработчик не ставится
 * вовсе: там нет курсора, а эффект всё равно не должен играть.
 */
export function GlowGroup({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const fine = window.matchMedia?.("(hover: hover) and (pointer: fine)");
    const calm = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!fine?.matches || calm?.matches) return;

    let frame = 0;
    let lastEvent: PointerEvent | null = null;
    let current: HTMLElement | null = null;
    let rect: DOMRect | null = null;

    const paint = () => {
      frame = 0;
      const event = lastEvent;
      lastEvent = null;
      if (!event || !current || !rect) return;
      current.style.setProperty("--gx", `${event.clientX - rect.left}px`);
      current.style.setProperty("--gy", `${event.clientY - rect.top}px`);
    };

    const onMove = (event: PointerEvent) => {
      const target = event.target as Element | null;
      const card = target?.closest<HTMLElement>("[data-glow]") ?? null;

      if (card !== current) {
        current = card;
        // Меряем ровно один раз на карточку: дальше движения мыши
        // переиспользуют сохранённый прямоугольник.
        rect = card ? card.getBoundingClientRect() : null;
      }

      lastEvent = event;
      if (!frame) frame = requestAnimationFrame(paint);
    };

    // Смещение страницы делает сохранённый прямоугольник неверным —
    // сбрасываем, чтобы следующее движение пересчитало его.
    const invalidate = () => {
      rect = null;
      current = null;
    };

    root.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", invalidate, { passive: true });
    window.addEventListener("resize", invalidate, { passive: true });

    return () => {
      root.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", invalidate);
      window.removeEventListener("resize", invalidate);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={rootRef} className={className}>
      {children}
    </div>
  );
}
