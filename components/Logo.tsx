import { company } from "@/lib/site";

/**
 * Знак: красный квадрат и три белых лепестка с тёмным контуром.
 *
 * Геометрия сверена с официальным файлом логотипа компании: три скруглённых
 * луча — вниз, влево-вверх и вправо-вверх — сходятся в центре, каждый с
 * собственной обводкой. Расхождений с фирменным блоком нет, поэтому знак
 * остаётся вектором: он чёткий на любом размере и весит около 2 КБ.
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

/**
 * Логотип в двух раскладках.
 *
 * `stacked` повторяет официальный файл один в один: «YASIRA» сверху, знак
 * в середине, «MOTORS» снизу с разрядкой. Именно в таком порядке собран
 * фирменный блок компании, поэтому в подвале стоит он.
 *
 * `inline` — горизонтальная раскладка для шапки. В официальном файле её нет:
 * он отдан вертикальным, а высота шапки — 62 пикселя, три строки туда не
 * встают. Знак, начертание и цвета внутри сохранены официальные, меняется
 * только взаимное расположение.
 */
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
  const hiddenName = (
    <span className="sr-only">
      {company.name} — {company.descriptionShort}
    </span>
  );

  if (stacked) {
    return (
      <span className={`inline-flex flex-col items-center ${className}`}>
        <span className="font-wordmark text-[26px] leading-none font-bold text-brand-500">
          YASIRA
        </span>
        <LogoMark className="mt-3 h-16 w-16" />
        {/* Разрядка добавляет пробел и после последней буквы — сдвигаем
            надпись влево на ту же величину, иначе середина съезжает */}
        <span
          className={`mt-3 pl-[0.34em] text-[13px] leading-none font-bold tracking-[0.34em] ${motorsTone}`}
        >
          MOTORS
        </span>
        {hiddenName}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className="h-9 w-9" />
      <span className="flex items-baseline gap-1.5">
        <span className="font-wordmark text-[19px] leading-none font-bold text-brand-500">
          YASIRA
        </span>
        {/*
          На самых узких экранах второе слово уходит: вместе с кнопками звонка
          и меню логотип не влезал в 320px, и правый край шапки уезжал за экран,
          утягивая за собой горизонтальную прокрутку всей страницы. Название
          компании целиком остаётся в sr-only, поэтому для скринридера ничего
          не меняется.
        */}
        <span
          className={`text-[12px] leading-none font-bold tracking-[0.22em] max-[379px]:hidden ${motorsTone}`}
        >
          MOTORS
        </span>
      </span>
      {hiddenName}
    </span>
  );
}
