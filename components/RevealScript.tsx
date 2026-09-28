"use client";

import { useEffect } from "react";

/**
 * Один общий наблюдатель за элементами [data-reveal].
 * Подключается один раз в layout — вместо гидратации каждой секции.
 */
export function RevealScript() {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-visible)"));
    if (nodes.length === 0) return;

    if (typeof IntersectionObserver === "undefined") {
      for (const node of nodes) node.classList.add("is-visible");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );

    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return null;
}
