import type { ElementType, ReactNode } from "react";

/**
 * Мягкое появление блока при скролле.
 *
 * Компонент намеренно серверный: разметка отдаётся статически, а класс
 * `is-visible` вешает один общий скрипт (components/RevealScript.tsx).
 * Так секции с услугами, преимуществами и шагами работ не попадают в
 * клиентский бандл и не гидратируются.
 *
 * Прогрессивное улучшение: без JS блоки видны сразу (см. <noscript> в layout).
 */
export function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  as?: ElementType;
  className?: string;
}) {
  return (
    <Tag
      data-reveal=""
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={className}
    >
      {children}
    </Tag>
  );
}
