import { rubrics } from "@/lib/site";

/**
 * Бесконечная лента рубрик (приём Aceternity Infinite Moving Cards), две
 * дорожки навстречу друг другу.
 *
 * Лента на CSS: трек сдвигается ключевым кадром на половину своей ширины,
 * а содержимое продублировано. Ни JS, ни библиотеки анимаций — но и
 * пауза по наведению, и остановка при `prefers-reduced-motion` (см.
 * globals.css).
 *
 * Копия набора помечена `aria-hidden`: для скринридера рубрики звучат один
 * раз, иначе список из одиннадцати пунктов читался бы дважды.
 *
 * Рубрики — то, что компания сама заявила в 2ГИС. Здесь они вынесены в
 * ленту как перечень работ: это и содержание для посетителя, и плотность
 * текста для поиска.
 */
export function RubricMarquee() {
  const first = rubrics.slice(0, 6);
  const second = rubrics.slice(6);

  return (
    <div className="marquee-group -mx-5 mt-10 md:-mx-8" aria-label="Рубрики работ из 2ГИС">
      <Row items={first} />
      <Row items={second} reverse />
    </div>
  );
}

function Row({ items, reverse = false }: { items: readonly string[]; reverse?: boolean }) {
  return (
    <div className="marquee mt-2.5 overflow-hidden">
      <div
        className="marquee-track"
        style={reverse ? { animationDirection: "reverse" } : undefined}
      >
        <Run items={items} />
        <Run items={items} clone />
      </div>
    </div>
  );
}

function Run({ items, clone = false }: { items: readonly string[]; clone?: boolean }) {
  return (
    <ul className="flex shrink-0 items-center" aria-hidden={clone || undefined}>
      {items.map((item) => (
        <li key={item} className="px-1.5">
          <span className="label inline-flex items-center rounded-chip border border-line bg-night-850 px-3.5 py-2.5 whitespace-nowrap text-fog-400">
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}
