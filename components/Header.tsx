"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, Phone, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { WhatsAppIcon } from "@/components/icons";
import { nav, phone, scheduleSummary, whatsappLink } from "@/lib/site";

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      // Фокус возвращаем на кнопку, которая открыла меню
      triggerRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${
        scrolled || open
          ? "border-line bg-night-950/92 backdrop-blur-md"
          : "border-transparent bg-gradient-to-b from-night-950/85 to-transparent"
      }`}
    >
      <div className="shell flex h-[62px] items-center justify-between gap-4 md:h-[70px]">
        <a href="#top" className="shrink-0" aria-label="YASIRA MOTORS — в начало страницы">
          <Logo />
        </a>

        <nav aria-label="Разделы страницы" className="hidden lg:block">
          <ul className="flex items-center gap-0.5">
            {nav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="inline-flex h-10 items-center rounded-ctl px-3.5 text-[14.5px] font-semibold text-fog-300 transition-colors hover:bg-night-800 hover:text-fog-100"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={`tel:${phone.tel}`}
            className="hidden h-11 items-center gap-2 rounded-ctl border border-line bg-night-850 pr-4 pl-3 text-[14.5px] font-semibold text-fog-100 transition-colors hover:border-brand-500 md:inline-flex"
          >
            <Phone className="h-4 w-4 text-brand-400" strokeWidth={2.4} aria-hidden="true" />
            {phone.display}
          </a>

          <a
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden h-11 w-11 items-center justify-center rounded-ctl border border-line bg-night-850 text-fog-200 transition-colors hover:border-brand-500 hover:text-fog-100 md:inline-flex"
            aria-label="Написать в WhatsApp"
          >
            <WhatsAppIcon className="h-[18px] w-[18px]" />
          </a>

          <a
            href={`tel:${phone.tel}`}
            className="inline-flex h-11 w-11 items-center justify-center rounded-ctl bg-brand-500 text-white md:hidden"
            aria-label={`Позвонить ${phone.display}`}
          >
            <Phone className="h-[19px] w-[19px]" strokeWidth={2.4} aria-hidden="true" />
          </a>

          <button
            ref={triggerRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-ctl border border-line bg-night-850 text-fog-100 lg:hidden"
            aria-label={open ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Мобильное меню */}
      <div
        id="mobile-menu"
        hidden={!open}
        className="shell border-t border-line bg-night-950/98 pb-6 lg:hidden"
      >
        <nav aria-label="Разделы страницы (мобильное меню)">
          <ul className="flex flex-col py-2">
            {nav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-[52px] items-center border-b border-line-soft text-[17px] font-semibold text-fog-100"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <p className="mt-4 text-sm text-fog-400">{scheduleSummary}</p>

        <div className="mt-4 grid gap-2.5">
          <a
            href={`tel:${phone.tel}`}
            className="inline-flex h-[52px] items-center justify-center gap-2.5 rounded-ctl bg-brand-500 text-[15px] font-semibold text-white"
          >
            <Phone className="h-[18px] w-[18px]" strokeWidth={2.4} aria-hidden="true" />
            Позвонить {phone.display}
          </a>
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-[52px] items-center justify-center gap-2.5 rounded-ctl border border-line bg-night-850 text-[15px] font-semibold text-fog-100"
          >
            <WhatsAppIcon className="h-[18px] w-[18px]" />
            Написать в WhatsApp
          </a>
        </div>
      </div>
    </header>
  );
}
