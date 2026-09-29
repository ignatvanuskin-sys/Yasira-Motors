"use client";

import { useEffect, useState } from "react";
import { Phone } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons";
import { phone, whatsappLink } from "@/lib/site";

/**
 * Компактная нижняя панель — два главных действия под большим пальцем.
 * Появляется только после первого экрана, чтобы не закрывать hero-кнопки.
 */
export function MobileBar() {
  const [visible, setVisible] = useState(false);
  const [atFinal, setAtFinal] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 460);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    /*
      У финального блока стоят те же две кнопки, и панель закрывала бы их:
      она уезжает, как только этот блок попадает в поле зрения.
    */
    const node = document.getElementById("cta");
    if (!node || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) setAtFinal(entry.isIntersecting);
      },
      { threshold: 0.25 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const shown = visible && !atFinal;

  return (
    <nav
      aria-label="Быстрые действия: позвонить или написать в WhatsApp"
      className={`overscroll-lock fixed inset-x-0 bottom-0 z-40 border-t border-line bg-night-950/95 backdrop-blur-md transition-transform duration-300 md:hidden ${
        shown ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-hidden={!shown}
    >
      <div className="grid grid-cols-2 gap-2 px-3 py-2.5">
        <a
          href={`tel:${phone.tel}`}
          data-track="call_click"
          data-track-source="sticky"
          className="inline-flex h-[50px] items-center justify-center gap-2 rounded-ctl bg-brand-500 text-[15px] font-bold text-white active:translate-y-px"
          tabIndex={shown ? 0 : -1}
        >
          <Phone className="h-[18px] w-[18px]" strokeWidth={2.4} aria-hidden="true" />
          Позвонить
        </a>
        <a
          href={whatsappLink()}
          target="_blank"
          rel="noopener noreferrer"
          data-track="whatsapp_click"
          data-track-source="sticky"
          className="inline-flex h-[50px] items-center justify-center gap-2 rounded-ctl border border-line bg-night-850 text-[15px] font-bold text-fog-100 active:translate-y-px"
          tabIndex={shown ? 0 : -1}
        >
          <WhatsAppIcon className="h-[18px] w-[18px]" />
          WhatsApp
        </a>
      </div>
    </nav>
  );
}
