import { company } from "@/lib/site";

/**
 * Логотип: фирменный знак (красный квадрат + три белых луча) и надпись.
 * Знак воспроизведён вектором по фирменному блоку компании с её фотографий,
 * поэтому он остаётся чётким на любом размере и не тянет лишний вес.
 * Когда появится официальный файл логотипа — достаточно заменить разметку здесь.
 */
export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="Знак YASIRA MOTORS">
      <rect width="48" height="48" rx="7" fill="#e01f26" />
      <g fill="#ffffff" stroke="#101013" strokeWidth="1.1">
        <rect x="20.7" y="24.6" width="6.6" height="16.8" rx="3.3" transform="rotate(0 24 24)" />
        <rect x="20.7" y="24.6" width="6.6" height="16.8" rx="3.3" transform="rotate(120 24 24)" />
        <rect x="20.7" y="24.6" width="6.6" height="16.8" rx="3.3" transform="rotate(240 24 24)" />
      </g>
    </svg>
  );
}

export function Logo({
  className = "",
  stacked = false,
  tone = "light",
}: {
  className?: string;
  stacked?: boolean;
  tone?: "light" | "dark";
}) {
  const motorsTone = tone === "light" ? "text-fog-200" : "text-night-900";

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className={stacked ? "h-11 w-11" : "h-9 w-9"} />
      <span className={stacked ? "flex flex-col leading-none" : "flex items-baseline gap-1.5"}>
        <span
          className={`font-wordmark font-bold text-brand-500 ${
            stacked ? "text-[21px] leading-none" : "text-[19px] leading-none"
          }`}
        >
          YASIRA
        </span>
        <span
          className={`font-bold ${motorsTone} ${
            stacked ? "mt-1 text-[12px] leading-none tracking-[0.3em]" : "text-[12px] leading-none tracking-[0.22em]"
          }`}
        >
          MOTORS
        </span>
      </span>
      <span className="sr-only">{company.name} — {company.descriptionShort}</span>
    </span>
  );
}
