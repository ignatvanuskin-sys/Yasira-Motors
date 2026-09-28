"use client";

import { useEffect, useState } from "react";
import { schedule } from "@/lib/site";

/**
 * Часовой пояс Актау. В базе IANA зона называется Asia/Aqtau, но набор
 * поддерживаемых зон зависит от сборки браузера/ICU, поэтому перебираем
 * кандидатов и в крайнем случае используем фиксированный UTC+5.
 */
const TZ_CANDIDATES = ["Asia/Aqtau", "Asia/Aqtobe", "Asia/Almaty", "Etc/GMT-5"];
const FALLBACK_OFFSET_MINUTES = 5 * 60; // Актау — UTC+5

function pickTimeZone(): string | undefined {
  for (const tz of TZ_CANDIDATES) {
    try {
      new Intl.DateTimeFormat("en-GB", { timeZone: tz }).format(new Date());
      return tz;
    } catch {
      /* зона не поддерживается — пробуем следующую */
    }
  }
  return undefined;
}

type Status = { open: boolean; text: string };

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** Минуты от начала суток и день недели (0 = воскресенье) по времени Актау. */
function nowInAktau(): { weekday: number; minutes: number } {
  const tz = pickTimeZone();

  if (tz) {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(new Date());

    const map: Record<string, string> = {};
    for (const part of parts) map[part.type] = part.value;

    const order = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weekday = Math.max(order.indexOf(map.weekday ?? "Sun"), 0);
    const hour = Number(map.hour ?? "0") % 24;
    const minute = Number(map.minute ?? "0");
    return { weekday, minutes: hour * 60 + minute };
  }

  // Резервный путь: локальное время + смещение к UTC+5.
  const now = new Date();
  const shifted = new Date(now.getTime() + (FALLBACK_OFFSET_MINUTES + now.getTimezoneOffset()) * 60_000);
  return { weekday: shifted.getDay(), minutes: shifted.getHours() * 60 + shifted.getMinutes() };
}

function computeStatus(): Status {
  const { weekday, minutes } = nowInAktau();
  // schedule[] идёт с понедельника; weekday: 0 = воскресенье.
  const index = weekday === 0 ? 6 : weekday - 1;
  const today = schedule[index] ?? schedule[0];
  const open = toMinutes(today.open);
  const close = toMinutes(today.close);

  if (minutes >= open && minutes < close) {
    return { open: true, text: `Сейчас открыто · до ${today.close}` };
  }
  if (minutes < open) {
    return { open: false, text: `Сейчас закрыто · сегодня с ${today.open}` };
  }
  const tomorrow = schedule[(index + 1) % 7] ?? schedule[0];
  return { open: false, text: `Сейчас закрыто · завтра с ${tomorrow.open}` };
}

export function OpenStatus({ className = "" }: { className?: string }) {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    const update = () => {
      try {
        setStatus(computeStatus());
      } catch {
        // Индикатор времени — вспомогательный: при любой ошибке просто не показываем его.
        setStatus(null);
      }
    };
    update();
    const id = window.setInterval(update, 60_000);
    return () => window.clearInterval(id);
  }, []);

  // До гидратации — нейтральная заглушка, чтобы не было скачка разметки.
  if (!status) {
    return (
      <span className={`inline-flex items-center gap-2 text-sm text-fog-400 ${className}`}>
        <span className="h-2 w-2 rounded-full bg-night-700" aria-hidden="true" />
        График работы: Пн–Сб 09:00–19:00, Вс 10:00–17:00
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-2 text-sm font-semibold ${
        status.open ? "text-emerald-400" : "text-fog-400"
      } ${className}`}
    >
      <span className="relative flex h-2 w-2">
        {status.open ? (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        ) : null}
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${
            status.open ? "bg-emerald-400" : "bg-fog-500"
          }`}
        />
      </span>
      {status.text}
    </span>
  );
}
