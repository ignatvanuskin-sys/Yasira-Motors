'use strict';

/**
 * Инлайновые SVG-иконки.
 *
 * Свои иконки вместо иконочного шрифта: ноль лишних запросов,
 * нулевой layout shift, никакой внешней зависимости.
 * Все иконки — 24×24, stroke=currentColor.
 */

const { raw } = require('../lib/html');

/**
 * @param {string} name
 * @param {{size?:number, className?:string, strokeWidth?:number}} [options]
 * @returns {string} готовый SVG (безопасный, генерируется только из констант)
 */
function icon(name, options = {}) {
  const paths = ICONS[name] || ICONS.dot;
  const size = options.size || 24;
  const cls = options.className ? ` class="${options.className}"` : '';
  const sw = options.strokeWidth || 1.6;
  return raw(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" ` +
      `fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" ` +
      `stroke-linejoin="round" aria-hidden="true" focusable="false"${cls}>${paths}</svg>`
  );
}

const ICONS = {
  /* ── услуги ─────────────────────────────────────────────────────────── */
  chip: `<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M9 3v4M15 3v4M9 17v4M15 17v4M3 9h4M3 15h4M17 9h4M17 15h4"/>`,
  oil: `<path d="M3 16h4l2-4h2V9"/><path d="M9 12h3l3-3h6v6H9z"/><path d="M5 16a2 2 0 1 0 4 0"/>`,
  wrench: `<path d="M14.7 6.3a4 4 0 0 0 5.3 5.3l-8 8a2.8 2.8 0 0 1-4-4l8-8a4 4 0 0 0-1.3-1.3z"/><path d="M6 6l2 2"/>`,
  target: `<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>`,
  axle: `<path d="M3 12h18"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="12" r="3"/><path d="M12 9v6"/>`,
  engine: `<path d="M6 10h3l2-2h5v2h2l2 2v6H6z"/><path d="M9 8V6h4"/><path d="M3 13h3"/><path d="M18 13h3"/>`,
  gearbox: `<circle cx="12" cy="12" r="3"/><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18"/>`,
  bolt: `<path d="M13 2 4 14h6l-1 8 9-12h-6z"/>`,
  tire: `<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v5M12 16v5M3 12h5M16 12h5"/>`,
  can: `<path d="M6 7h12v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z"/><path d="M6 7c0-1.7 2.7-3 6-3s6 1.3 6 3"/><path d="M9 12h6"/>`,
  dot: `<circle cx="12" cy="12" r="3"/>`,

  /* ── интерфейс ──────────────────────────────────────────────────────── */
  phone: `<path d="M5 3h3l2 5-2.5 1.5a12 12 0 0 0 6 6L15 13l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/>`,
  whatsapp: `<path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.6-1.2A9 9 0 1 0 12 3z"/><path d="M8.5 9.5c0 3 2 5 5 5 .8 0 1.5-.5 1.5-1.2 0-.4-1.4-1.1-1.7-.9-.4.2-.7.7-1.2.6-1-.2-2.1-1.3-2.3-2.3-.1-.5.4-.8.6-1.2.2-.3-.5-1.7-.9-1.7-.7 0-1.2.7-1.2 1.5z"/>`,
  route: `<path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>`,
  calendar: `<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>`,
  clock: `<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>`,
  check: `<path d="M4 12.5 9 17.5 20 6.5"/>`,
  arrowRight: `<path d="M5 12h14M13 6l6 6-6 6"/>`,
  arrowLeft: `<path d="M19 12H5M11 18l-6-6 6-6"/>`,
  star: `<path d="m12 3.6 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.8l5.9-.9z"/>`,
  menu: `<path d="M4 7h16M4 12h16M4 17h16"/>`,
  close: `<path d="M6 6l12 12M18 6L6 18"/>`,
  shield: `<path d="M12 3l7 3v6c0 4.4-3 8-7 9-4-1-7-4.6-7-9V6z"/><path d="M9 12l2 2 4-4"/>`,
  award: `<circle cx="12" cy="9" r="5"/><path d="M8.5 13.5 7 21l5-2.5L17 21l-1.5-7.5"/>`,
  users: `<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 5.2A3.2 3.2 0 0 1 16 11"/><path d="M17.5 14.4A6 6 0 0 1 21 20"/>`,
  car: `<path d="M5 16h14M6 16v2H4v-6l2-5h12l2 5v6h-2v-2"/><circle cx="7.5" cy="16" r="1.6"/><circle cx="16.5" cy="16" r="1.6"/>`,
  map: `<path d="M9 4 3 6.5v14L9 18l6 2.5 6-2.5v-14L15 6.5z"/><path d="M9 4v14M15 6.5v14"/>`,
  card: `<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>`,
  spark: `<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>`,
  pickaxe: `<path d="M14 4c3 1 6 4 6 6"/><path d="M20 4c-6 0-11 3-13 8"/><path d="M8 12l-4 8 8-4"/>`,
  box: `<path d="M3 8l9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>`,
  doc: `<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>`,
  info: `<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>`,
  alert: `<path d="M12 4 2.5 20h19z"/><path d="M12 10v4M12 17h.01"/>`,
  tool: `<path d="M14.7 6.3a4 4 0 0 0 5.3 5.3l-8 8a2.8 2.8 0 0 1-4-4l8-8z"/>`,
  gauge: `<path d="M4 18a8 8 0 1 1 16 0"/><path d="M12 14l4-4"/><circle cx="12" cy="15" r="1.4"/>`,
  battery: `<rect x="3" y="8" width="15" height="9" rx="2"/><path d="M21 11v3"/><path d="M7 12.5h4M9 10.5v4"/>`,
  ig: `<rect x="3" y="3" width="18" height="18" rx="4.5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>`,
  home: `<path d="M4 11l8-6 8 6v8a1 1 0 0 1-1 1h-4v-5H9v5H5a1 1 0 0 1-1-1z"/>`,
};

module.exports = { icon, ICONS };
