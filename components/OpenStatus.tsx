"use client";

import { useEffect, useState } from "react";
import { getOpenState, type OpenState } from "@/lib/schedule";
import { schedule, scheduleSummary } from "@/lib/site";

/**
 * Живой индикатор «Сейчас открыто / закрыто» по графику во времени Актау.
 *
 * Индикатор вспомогательный: любая ошибка (например, неподдерживаемая
 * таймзона) не должна ронять страницу, поэтому всё завёрнуто в try/catch
 * и есть нейтральная заглушка до гидратации — в ней ровно тот же текст,
 * что и в статике, чтобы не было подёргивания.
 *
 * variant="label" — моноширинная метка: используется в первом экране,
 * где вся служебная строка набрана моно-капсом.
 */
export function OpenStatus({
  className = "",
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "label";
}) {
  const [state, setState] = useState<OpenState | null>(null);

  useEffect(() => {
    const update = () => {
      try {
        setState(getOpenState(new Date(), schedule));
      } catch {
        setState(null);
      }
    };

    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const isLabel = variant === "label";
  const base = isLabel
    ? "label inline-flex items-center gap-2"
    : "inline-flex items-center gap-2 text-sm font-semibold";

  if (!state) {
    return (
      <span className={`${base} ${isLabel ? "text-fog-500" : "text-fog-400"} ${className}`}>
        <span className="h-2 w-2 shrink-0 rounded-full bg-night-700" aria-hidden="true" />
        {isLabel ? scheduleSummary : `График работы: ${scheduleSummary}`}
      </span>
    );
  }

  return (
    <span
      className={`${base} ${
        state.open ? "text-emerald-400" : isLabel ? "text-fog-500" : "text-fog-400"
      } ${className}`}
    >
      <span className="relative flex h-2 w-2 shrink-0">
        {state.open ? (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        ) : null}
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${
            state.open ? "bg-emerald-400" : "bg-fog-500"
          }`}
        />
      </span>
      {state.text}
    </span>
  );
}
