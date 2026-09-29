/**
 * Аналитика — за флагом окружения.
 *
 * Идентификаторы приходят из NEXT_PUBLIC_YM_ID и NEXT_PUBLIC_GA_ID. Если они
 * не заданы, счётчики не подключаются вообще: ни скрипта, ни запросов, ни
 * лишнего веса. Обёртка безопасна — она молча ничего не делает, если счётчик
 * не загрузился, поэтому аналитика никогда не ломает страницу.
 */
const YM_ID = process.env.NEXT_PUBLIC_YM_ID ?? "";
const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";

export const analyticsIds = { ym: YM_ID, ga: GA_ID };
export const hasAnalytics = Boolean(YM_ID || GA_ID);

export type TrackEvent =
  | "call_click"
  | "whatsapp_click"
  | "symptom_select"
  | "service_card_click"
  | "route_click"
  | "map_open"
  | "copy_phone"
  | "gallery_open"
  | "review_link_click";

export type TrackParams = {
  /** Откуда пришёл клик: hero, sticky, contacts, services, сmap и так далее. */
  source?: string;
  /** Тема обращения: услуга или симптом. */
  topic?: string;
  /** Карта, куда ушёл маршрут. */
  provider?: string;
};

export function track(name: TrackEvent, params: TrackParams = {}) {
  if (typeof window === "undefined" || !hasAnalytics) return;

  const w = window as unknown as {
    ym?: (id: string, action: string, name: string, params?: unknown) => void;
    gtag?: (...args: unknown[]) => void;
  };

  try {
    if (YM_ID) w.ym?.(YM_ID, "reachGoal", name, params);
    if (GA_ID) w.gtag?.("event", name, params);
  } catch {
    // Сбой счётчика не должен ломать интерфейс
  }
}
