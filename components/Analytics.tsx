"use client";

import { useEffect } from "react";
import { analyticsIds, hasAnalytics, track, type TrackEvent } from "@/lib/analytics";

/**
 * Загрузка счётчиков и разбор событий.
 *
 * Скрипты подключаются только при заданных идентификаторах и только после
 * загрузки страницы: первая отрисовка их не ждёт. События ловит один
 * делегированный обработчик на документе — он поднимается от цели клика до
 * ближайшего элемента с data-track. Разметка события живёт рядом с самим
 * элементом, а не в селекторе внутри скрипта, поэтому вёрстку можно менять
 * без страха, что аналитика отвалится молча.
 */
export function Analytics() {
  useEffect(() => {
    if (!hasAnalytics) return;

    const load = () => {
      if (analyticsIds.ym) {
        const script = document.createElement("script");
        script.async = true;
        script.src = "https://mc.yandex.ru/metrika/tag.js";
        script.onload = () => {
          const w = window as unknown as { ym?: (...args: unknown[]) => void };
          w.ym?.(analyticsIds.ym, "init", {
            clickmap: true,
            trackLinks: true,
            accurateTrackBounce: true,
          });
        };
        document.head.appendChild(script);
      }

      if (analyticsIds.ga) {
        const w = window as unknown as { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };
        w.dataLayer = w.dataLayer || [];
        w.gtag = (...args: unknown[]) => {
          w.dataLayer?.push(args);
        };
        w.gtag("js", new Date());
        w.gtag("config", analyticsIds.ga);

        const script = document.createElement("script");
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${analyticsIds.ga}`;
        document.head.appendChild(script);
      }
    };

    const idle = window as unknown as {
      requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => void;
    };
    if (idle.requestIdleCallback) {
      idle.requestIdleCallback(load, { timeout: 4000 });
    } else {
      window.addEventListener("load", load, { once: true });
    }
  }, []);

  useEffect(() => {
    if (!hasAnalytics) return;

    /** Что за событие: сначала явная разметка, потом понятные маркеры ссылок. */
    const resolve = (owner: HTMLElement): TrackEvent | null => {
      const explicit = owner.dataset.track;
      if (explicit) return explicit as TrackEvent;

      if (owner.dataset.cta === "call") return "call_click";
      if (owner.dataset.cta === "whatsapp") return "whatsapp_click";

      const href = owner.getAttribute("href") ?? "";
      if (href.startsWith("tel:")) return "call_click";
      if (href.includes("wa.me")) return "whatsapp_click";
      return null;
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const owner = target?.closest<HTMLElement>(
        "[data-track], [data-cta], a[href^='tel:'], a[href*='wa.me']",
      );
      if (!owner) return;

      const name = resolve(owner);
      if (!name) return;

      track(name, {
        source: owner.dataset.trackSource,
        topic: owner.dataset.trackTopic,
        provider: owner.dataset.trackProvider,
      });
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
