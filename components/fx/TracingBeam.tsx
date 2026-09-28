import type { ReactNode } from "react";

/**
 * Линия, которая «прорисовывается» по мере прокрутки (приём Aceternity
 * Tracing Beam).
 *
 * В оригинале прогресс считается в JS и переносится трансформом. Здесь то же
 * самое делает CSS через `animation-timeline: view()`: браузер сам связывает
 * анимацию с положением элемента во вьюпорте, и на главном потоке не
 * выполняется ни строчки нашего кода.
 *
 * Растёт не высота, а `clip-path` — это свойство отрисовки, макет не
 * пересчитывается. Ведомый край ярче: градиент гасит верх линии, поэтому
 * светящееся окончание возникает само, без отдельной точки.
 *
 * Браузер без поддержки `animation-timeline` (Firefox < 144, Safari < 26)
 * видит только саму дорожку — ровную линию. Это не поломка: линия задумана
 * как разделитель шагов, а подсветка — украшение.
 */
export function TracingBeam({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <span aria-hidden="true" className="tracing-track" />
      {children}
    </div>
  );
}
