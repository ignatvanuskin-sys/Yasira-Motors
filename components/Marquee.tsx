import { serviceGroups } from "@/lib/content";
import { company } from "@/lib/site";

/**
 * Бегущая строка с направлениями работ — визуальный разделитель между первым
 * экраном и услугами. Декоративная: для скринридеров скрыта, при
 * prefers-reduced-motion анимация выключается, при наведении ставится на паузу.
 * Ширина трека = две одинаковые копии, поэтому сдвиг на 50% даёт бесшовный цикл.
 */
export function Marquee() {
  const words = [...serviceGroups.map((group) => group.title), company.city];

  return (
    <div
      className="marquee relative overflow-hidden border-y border-line bg-night-900 py-4"
      aria-hidden="true"
    >
      <div className="marquee-track">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center">
            {words.map((word) => (
              <span key={word} className="flex items-center">
                <span className="label px-6 whitespace-nowrap text-fog-500 sm:px-7">{word}</span>
                <span className="h-1 w-1 shrink-0 rounded-full bg-brand-500/70" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
