import type { ReactNode } from "react";

export function Section({
  id,
  children,
  className = "",
  bordered = false,
  tone = "base",
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  bordered?: boolean;
  /** alt — секция на чуть более светлом фоне: даёт ритм длинной странице */
  tone?: "base" | "alt";
}) {
  const background = tone === "alt" ? "bg-night-900" : "";
  return (
    <section
      id={id}
      className={`py-16 md:py-24 ${background} ${
        bordered ? "border-t border-line-soft" : ""
      } ${className}`}
    >
      <div className="shell">{children}</div>
    </section>
  );
}

/**
 * Заголовок секции: служебная строка моноширинным капсом и заголовок.
 *
 * Номеров у секций нет намеренно. «01/02/03» подразумевал порядок изучения,
 * которого у страницы нет: человек приходит сразу к услугам или к контактам.
 * Нумерация осталась только в блоке «Как мы работаем» — там это шаги.
 */
export function SectionHead({
  eyebrow,
  title,
  lead,
  align = "left",
  className = "",
}: {
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={`${align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"} ${className}`}
    >
      <p className="label text-fog-500">{eyebrow}</p>

      <h2 className="display mt-4 text-[clamp(1.6rem,4.4vw,2.85rem)] text-fog-100">{title}</h2>

      {lead ? <p className="mt-5 text-[16px] leading-relaxed text-fog-400">{lead}</p> : null}
    </div>
  );
}
