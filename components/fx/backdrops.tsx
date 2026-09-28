/**
 * Декоративные фоны в духе Aceternity UI, перенесённые на нативные SVG/CSS.
 *
 * Почему без motion/framer-motion: все три эффекта — это статичная геометрия
 * плюс CSS-анимация. Библиотека анимаций добавила бы ~35 КБ gzip в клиентский
 * бандл и удлинила бы главный поток ради эффекта, который браузер и так рисует
 * на композиторе. Аудит считает TBT, поэтому лишний вес здесь не оправдан.
 *
 * Все компоненты серверные: разметка приходит готовой, JS на клиенте — ноль.
 */

/**
 * Сетка с радиальной маской. Даёт «чертёжную» подложку, не споря с текстом:
 * линии гаснут к краям, в центре остаётся только намёк на структуру.
 */
export function GridBackdrop({ className = "" }: { className?: string }) {
  const mask = "radial-gradient(ellipse 72% 62% at 50% 42%, #000 18%, transparent 100%)";
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        backgroundImage:
          "linear-gradient(to right, var(--color-line-strong) 1px, transparent 1px)," +
          "linear-gradient(to bottom, var(--color-line-strong) 1px, transparent 1px)",
        backgroundSize: "68px 68px",
        opacity: 0.16,
        maskImage: mask,
        WebkitMaskImage: mask,
      }}
    />
  );
}

/**
 * Прожектор: широкое пятно света, падающее сверху.
 *
 * В оригинале Aceternity это SVG с feGaussianBlur stdDeviation 151 на
 * холсте 3787×2842. Такой размыв браузер считает при каждой отрисовке
 * слоя, а результат неотличим от радиального градиента, который рисуется
 * сразу и без растеризации фильтра. Поэтому здесь градиент.
 *
 * Геометрия задаётся рамкой самого элемента: пятно всегда прижато к его
 * верхней границе, поэтому положение прожектора — это просто классы
 * позиционирования на вызывающей стороне, а не подбор viewBox.
 */
export function Spotlight({
  className = "",
  opacity = 0.6,
}: {
  className?: string;
  opacity?: number;
}) {
  return (
    <div
      aria-hidden="true"
      className={`spotlight pointer-events-none absolute ${className}`}
      style={{
        opacity,
        backgroundImage:
          "radial-gradient(62% 68% at 46% 0%, rgb(224 31 38 / 0.38), rgb(224 31 38 / 0.12) 45%, transparent 72%)",
      }}
    />
  );
}

/**
 * Пучок лучей. Приём из Aceternity Background Beams: набор кривых, по которым
 * бежит короткий штрих.
 *
 * Реализация без библиотеки: у каждого пути `pathLength="1"`, поэтому
 * `stroke-dasharray` и `stroke-dashoffset` считаются в долях длины пути —
 * не нужно измерять геометрию в JS. Анимируется только dashoffset
 * (свойство отрисовки, не макет) и только у невидимых для скринридера путей.
 *
 * Пути строятся детерминированно: без Math.random, иначе разметка на сервере
 * и на клиенте разошлась бы и React ругался на несоответствие гидратации.
 */
export function Beams({ className = "", lines = 14 }: { className?: string; lines?: number }) {
  const curves = Array.from({ length: lines }, (_, i) => {
    const x = (i / (lines - 1)) * 1400 - 200;
    const bend = ((i * 137) % 220) - 110;
    return {
      d: `M${x} 0 C${x + bend * 0.35} 190 ${x - bend * 0.6} 380 ${x + bend * 0.4} 580`,
      delay: ((i * 1.37) % 6.4).toFixed(2),
      duration: (5.2 + ((i * 0.91) % 3.4)).toFixed(2),
    };
  });

  return (
    <svg
      aria-hidden="true"
      className={`beams pointer-events-none absolute inset-0 h-full w-full ${className}`}
      viewBox="0 0 1000 580"
      preserveAspectRatio="none"
      fill="none"
    >
      {curves.map((curve, i) => (
        <path
          key={i}
          d={curve.d}
          pathLength={1}
          stroke="var(--color-brand-500)"
          strokeWidth="1"
          strokeOpacity="0.42"
          strokeDasharray="0.16 0.84"
          className="beam-path"
          style={{
            animationDelay: `${curve.delay}s`,
            animationDuration: `${curve.duration}s`,
          }}
        />
      ))}
    </svg>
  );
}
