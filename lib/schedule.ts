/**
 * Логика графика работы — чистые функции, вынесены из компонента,
 * чтобы их можно было покрыть тестами (tests/schedule.test.ts).
 *
 * Все вычисления идут во времени Актау, независимо от часового пояса
 * посетителя и сервера сборки.
 */

import { schedule, type DayHours } from "@/lib/site";

/**
 * В базе IANA зона Актау называется Asia/Aqtau; набор поддерживаемых зон
 * зависит от сборки ICU в браузере, поэтому перебираем кандидатов.
 */
export const TZ_CANDIDATES = ["Asia/Aqtau", "Asia/Aqtobe", "Asia/Almaty", "Etc/GMT-5"] as const;

/** Актау — UTC+5. */
export const UTC_OFFSET_MINUTES = 5 * 60;

const WEEKDAY_ORDER = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/** "09:00" → 540 */
export function toMinutes(hhmm: string): number {
  const [hours, minutes] = hhmm.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return Number.NaN;
  return hours * 60 + minutes;
}

/** Первая поддерживаемая зона из списка кандидатов (или undefined). */
export function resolveZone(candidates: readonly string[] = TZ_CANDIDATES): string | undefined {
  for (const zone of candidates) {
    try {
      new Intl.DateTimeFormat("en-GB", { timeZone: zone }).format(new Date());
      return zone;
    } catch {
      /* зона не поддерживается — пробуем следующую */
    }
  }
  return undefined;
}

export type ZonedTime = { weekday: number; minutes: number };

/**
 * День недели (0 = воскресенье) и минуты от начала суток во времени Актау.
 * Если ни одна IANA-зона не поддерживается, считаем через фиксированное
 * смещение UTC+5 — результат не зависит от часового пояса машины.
 */
export function aktauTime(now: Date = new Date(), zone: string | undefined = resolveZone()): ZonedTime {
  if (zone) {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: zone,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(now);

    const map: Record<string, string> = {};
    for (const part of parts) map[part.type] = part.value;

    const weekday = Math.max(WEEKDAY_ORDER.indexOf((map.weekday ?? "Sun") as (typeof WEEKDAY_ORDER)[number]), 0);
    const hour = Number(map.hour ?? "0") % 24;
    const minute = Number(map.minute ?? "0");
    return { weekday, minutes: hour * 60 + minute };
  }

  const shifted = new Date(now.getTime() + (UTC_OFFSET_MINUTES + now.getTimezoneOffset()) * 60_000);
  return { weekday: shifted.getDay(), minutes: shifted.getHours() * 60 + shifted.getMinutes() };
}

export type OpenState = {
  open: boolean;
  /** Готовый текст для интерфейса. */
  text: string;
  /** Индекс дня в переданном расписании (0 = понедельник). */
  dayIndex: number;
};

/**
 * Текущее состояние по графику.
 * Конец смены считается закрытием: в 19:00 сервис уже закрыт.
 */
export function getOpenState(
  now: Date = new Date(),
  days: readonly DayHours[] = schedule,
  zone: string | undefined = resolveZone(),
): OpenState {
  const { weekday, minutes } = aktauTime(now, zone);
  const dayIndex = weekday === 0 ? 6 : weekday - 1;
  const today = days[dayIndex] ?? days[0];

  const open = toMinutes(today.open);
  const close = toMinutes(today.close);

  if (minutes >= open && minutes < close) {
    return { open: true, text: `Сейчас открыто · до ${today.close}`, dayIndex };
  }
  if (minutes < open) {
    return { open: false, text: `Сейчас закрыто · сегодня с ${today.open}`, dayIndex };
  }

  const tomorrow = days[(dayIndex + 1) % days.length] ?? days[0];
  return { open: false, text: `Сейчас закрыто · завтра с ${tomorrow.open}`, dayIndex };
}
