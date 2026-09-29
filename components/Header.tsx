"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Menu, Phone, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { WhatsAppIcon } from "@/components/icons";
import { nav, phone, scheduleSummary, whatsappLink } from "@/lib/site";

/** Совпадает с menu-out в globals.css: столько меню уезжает перед hidden. */
const MENU_CLOSE_MS = 160;

/**
 * Единственный источник offsets для прокрутки задан в CSS (scroll-padding-top),
 * поэтому переход делается через scrollIntoView, а не через расчёт вручную.
 */
export function Header() {
  const [open, setOpen] = useState(false);
  /** Идёт закрытие: меню ещё в DOM, но уже уезжает — иначе анимации не будет. */
  const [closing, setClosing] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  /** Раздел, который читают прямо сейчас: подсвечивается в навигации. */
  const [activeId, setActiveId] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<number | null>(null);

  const cancelClose = () => {
    if (closeTimer.current === null) return;
    window.clearTimeout(closeTimer.current);
    closeTimer.current = null;
    setClosing(false);
  };

  const openMenu = () => {
    cancelClose();
    setOpen(true);
  };

  const closeMenu = () => {
    if (!open || closing) return;
    setClosing(true);
    closeTimer.current = window.setTimeout(() => {
      closeTimer.current = null;
      setClosing(false);
      setOpen(false);
    }, MENU_CLOSE_MS);
  };

  /**
   * Плавный переход к разделу по анкору.
   *
   * Обычный переход по ссылке даёт рывок: пока меню открыто, скролл страницы
   * заблокирован (body overflow hidden), и браузер отрабатывает переход раньше,
   * чем блокировка снимется. Поэтому сначала снимаем блокировку синхронно,
   * закрываем меню, и только потом прокручиваем.
   */
  const goToAnchor = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    const target = document.getElementById(href.replace(/^\/?#/, ""));
    closeMenu();
    // На странице 404 цели нет — пусть работает обычный переход на главную
    if (!target) return;
    event.preventDefault();
    document.body.style.overflow = "";
    window.requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    window.history.pushState(null, "", href);
  };

  useEffect(
    () => () => {
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    },
    [],
  );

  /*
    Подсветка активного раздела. Активной считаем ту секцию, что ближе всего
    к верху экрана: у страницы нет «текущего» раздела в смысле истории, есть
    только тот, который человек читает прямо сейчас.
  */
  useEffect(() => {
    const ids = nav.map((item) => item.href.replace(/^\/?#/, "")).filter(Boolean);
    const nodes = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!nodes.length || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const top = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setActiveId(top.target.id);
      },
      { rootMargin: "-84px 0px -55% 0px" },
    );

    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, []);

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
      closeMenu();
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
        {/* Абсолютные адреса от корня: те же ссылки работают и на странице 404,
            где относительный «#services» не нашёл бы цель */}
        <a href="/#top" className="shrink-0" aria-label="YASIRA MOTORS — в начало страницы">
          <Logo />
        </a>

        <nav aria-label="Разделы страницы" className="hidden lg:block">
          <ul className="flex items-center gap-0.5">
            {nav.map((item) => (
              <li key={item.href}>
                <a
                  href={`/${item.href}`}
                  onClick={(event) => goToAnchor(event, item.href)}
                  aria-current={
                    activeId === item.href.replace(/^\/?#/, "") ? "true" : undefined
                  }
                  className={`inline-flex h-10 items-center rounded-ctl px-3.5 text-[14.5px] font-semibold transition-colors ${
                    activeId === item.href.replace(/^\/?#/, "")
                      ? "bg-night-800 text-fog-100"
                      : "text-fog-300 hover:bg-night-800 hover:text-fog-100"
                  }`}
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
            data-track="call_click"
            data-track-source="header"
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
            data-track="whatsapp_click"
            data-track-source="header"
          >
            <WhatsAppIcon className="h-[18px] w-[18px]" />
          </a>

          <a
            href={`tel:${phone.tel}`}
            className="inline-flex h-11 w-11 items-center justify-center rounded-ctl bg-brand-500 text-white md:hidden"
            aria-label={`Позвонить ${phone.display}`}
            data-track="call_click"
            data-track-source="header"
          >
            <Phone className="h-[19px] w-[19px]" strokeWidth={2.4} aria-hidden="true" />
          </a>

          <button
            ref={triggerRef}
            type="button"
            onClick={() => (open ? closeMenu() : openMenu())}
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
      {/*
        Панель вынесена из потока шапки: пока она была в потоке, её высота
        растягивала саму шапку вместе с её фоном. Теперь это выпадающая
        панель под шапкой, которая умеет появляться и уезжать.
      */}
      <div
        id="mobile-menu"
        hidden={!open}
        data-state={closing ? "closing" : "open"}
        className="menu-panel overscroll-lock shell absolute inset-x-0 top-full max-h-[calc(100svh-62px)] overflow-y-auto bg-night-950/98 pb-6 lg:hidden"
      >
        <nav aria-label="Разделы страницы (мобильное меню)">
          <ul className="flex flex-col py-2">
            {nav.map((item) => (
              <li key={item.href}>
                <a
                  href={`/${item.href}`}
                  onClick={(event) => goToAnchor(event, item.href)}
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
