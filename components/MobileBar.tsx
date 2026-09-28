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

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 460);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-night-950/95 backdrop-blur-md transition-transform duration-300 md:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-hidden={!visible}
    >
      <div className="grid grid-cols-2 gap-2 px-3 py-2.5">
        <a
          href={`tel:${phone.tel}`}
          className="inline-flex h-[50px] items-center justify-center gap-2 rounded-ctl bg-brand-500 text-[15px] font-bold text-white active:translate-y-px"
          tabIndex={visible ? 0 : -1}
        >
          <Phone className="h-[18px] w-[18px]" strokeWidth={2.4} aria-hidden="true" />
          Позвонить
        </a>
        <a
          href={whatsappLink()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-[50px] items-center justify-center gap-2 rounded-ctl border border-line bg-night-850 text-[15px] font-bold text-fog-100 active:translate-y-px"
          tabIndex={visible ? 0 : -1}
        >
          <WhatsAppIcon className="h-[18px] w-[18px]" />
          WhatsApp
        </a>
      </div>
    </div>
  );
}
