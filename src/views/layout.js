'use strict';

/**
 * Общий каркас страницы: <head>, шапка, подвал, компактный мобильный док.
 *
 * Задача шапки — не показать меню, а дать позвонить. Поэтому телефон
 * и WhatsApp стоят в ней постоянно, а разделов всего четыре.
 */

const { html, esc, raw, isRaw } = require('../lib/html');
const { icon } = require('./icons');
const config = require('../config');
const seo = require('../lib/seo');
const context = require('../lib/context');

const NAV = [
  { href: '/services', label: 'Услуги', match: '/services' },
  { href: '/#about', label: 'О сервисе', match: '/#about' },
  { href: '/#reviews', label: 'Отзывы', match: '/#reviews' },
  { href: '/contacts', label: 'Контакты', match: '/contacts' },
];

/**
 * @param {object} page
 * @param {string} page.title
 * @param {string} page.description
 * @param {string} page.path
 * @param {string} [page.activePath]
 * @param {boolean} [page.noindex]
 * @param {string} [page.schema]
 * @param {*} page.body
 * @param {string} [page.image]
 * @param {string} [page.preloadImage]
 * @param {string} [page.script]
 * @returns {string}
 */
function layout(page) {
  const b = config.business;
  const canonical = seo.url(page.path);
  const ogImage = `${config.siteUrl}${page.image || '/img/directions2.jpg'}`;
  const active = page.activePath || page.path;
  const status = config.openStatus();

  const nonceValue = context.nonce();
  const nonceHtml = raw(nonceValue ? ` nonce="${esc(nonceValue)}"` : '');
  const bodyHtml = isRaw(page.body) ? page.body : raw(String(page.body || ''));

  return String(html`<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${page.title}</title>
<meta name="description" content="${page.description}">
<link rel="canonical" href="${canonical}">
${page.noindex ? html`<meta name="robots" content="noindex, follow">` : html`<meta name="robots" content="index, follow">`}
<meta name="theme-color" content="#ffffff">
<meta name="format-detection" content="telephone=no">

<meta property="og:type" content="website">
<meta property="og:site_name" content="${b.name}">
<meta property="og:title" content="${page.title}">
<meta property="og:description" content="${page.description}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${ogImage}">
<meta property="og:locale" content="ru_RU">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${page.title}">
<meta name="twitter:description" content="${page.description}">
<meta name="twitter:image" content="${ogImage}">

<link rel="icon" href="/favicon.svg" type="image/svg+xml">
${page.preloadImage ? html`<link rel="preload" as="image" href="${page.preloadImage}" fetchpriority="high">` : ''}
<link rel="preload" as="font" type="font/woff2" href="/fonts/manrope-cyrillic.woff2" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="/fonts/manrope-latin.woff2" crossorigin>
<link rel="stylesheet" href="/css/style.css">
<script defer src="/js/app.js"></script>
${page.schema ? html`<script type="application/ld+json"${nonceHtml}>${raw(page.schema)}</script>` : ''}
</head>
<body>
<a class="skip-link" href="#main">Перейти к содержимому</a>

<header class="site-header" data-header>
  <div class="container header-inner">
    <a class="brand" href="/" aria-label="${esc(b.name)} — на главную" translate="no">
      <span class="brand-mark" aria-hidden="true">${icon('gauge', { size: 22, strokeWidth: 1.7 })}</span>
      <span class="brand-text">
        <span class="brand-name">YASIRA</span>
        <span class="brand-sub">MOTORS · ${esc(b.city)}</span>
      </span>
    </a>

    <nav class="main-nav" aria-label="Основное меню">
      ${NAV.map(
        (item) => html`<a href="${item.href}"${raw(item.match === active ? ' aria-current="page"' : '')}
          >${item.label}</a
        >`
      )}
    </nav>

    <div class="header-actions">
      <span class="open-state${status.open ? ' is-open' : ''}">
        <span class="open-dot" aria-hidden="true"></span>
        ${status.label}, ${status.detail}
      </span>
      <a class="btn btn-primary btn-sm header-call" href="${config.telHref(b.phone)}">
        ${icon('phone', { size: 17 })} Позвонить
      </a>
      <a
        class="btn btn-whatsapp btn-sm header-wa"
        href="${config.waLink(config.waText.general)}"
        rel="noopener"
        target="_blank"
      >
        ${icon('whatsapp', { size: 17 })} WhatsApp
      </a>
    </div>

    <button
      class="nav-toggle"
      type="button"
      aria-label="Открыть меню"
      aria-expanded="false"
      aria-controls="mobile-nav"
      data-nav-toggle
    >
      ${icon('menu', { size: 22 })}
    </button>
  </div>

  <div class="mobile-nav" id="mobile-nav" hidden data-mobile-nav>
    <nav class="mobile-nav-links" aria-label="Меню на телефоне">
      ${NAV.map((item) => html`<a href="${item.href}">${item.label}</a>`)}
    </nav>
    <div class="mobile-nav-actions">
      <a class="btn btn-primary" href="${config.telHref(b.phone)}">
        ${icon('phone', { size: 18 })} ${b.phone}
      </a>
      <a
        class="btn btn-whatsapp"
        href="${config.waLink(config.waText.general)}"
        rel="noopener"
        target="_blank"
      >
        ${icon('whatsapp', { size: 18 })} Написать в WhatsApp
      </a>
    </div>
  </div>
</header>

<main id="main">${bodyHtml}</main>

<footer class="site-footer">
  <div class="container footer-inner">
    <div class="footer-brand">
      <div class="brand brand-static" translate="no">
        <span class="brand-mark" aria-hidden="true">${icon('gauge', { size: 22 })}</span>
        <span class="brand-text">
          <span class="brand-name">YASIRA</span>
          <span class="brand-sub">MOTORS</span>
        </span>
      </div>
      <p class="footer-note">
        ${esc(b.kind)} в ${esc(b.city)}. ${esc(b.tagline)}.
      </p>
    </div>

    <div class="footer-col">
      <h3 class="footer-title">Адрес и часы</h3>
      <ul class="footer-list">
        <li>${esc(b.address)}, ${esc(b.addressExtra)}</li>
        <li>${esc(b.hoursText)}</li>
        <li>Остановка «${esc(b.transit.stop)}» — ${esc(b.transit.walk)}</li>
      </ul>
    </div>

    <div class="footer-col">
      <h3 class="footer-title">Связаться</h3>
      <ul class="footer-list">
        <li>
          <a href="${config.telHref(b.phone)}">${esc(b.phone)}</a>
          <span class="muted"> — ${esc(b.phoneList[0].role)}</span>
        </li>
        <li>
          <a
            class="is-accent"
            href="${config.waLink(config.waText.general)}"
            rel="noopener"
            target="_blank"
            >Написать в WhatsApp</a
          >
        </li>
        <li><a href="mailto:${esc(b.email)}">${esc(b.email)}</a></li>
      </ul>
    </div>

    <div class="footer-col">
      <h3 class="footer-title">Разделы</h3>
      <ul class="footer-list">
        ${NAV.map((item) => html`<li><a href="${item.href}">${item.label}</a></li>`)}
        <li>
          <a href="${b.twoGis}" rel="noopener" target="_blank">Карточка в 2ГИС</a>
        </li>
      </ul>
    </div>
  </div>

  <div class="container footer-bottom">
    <p>© ${new Date().getFullYear()} ${esc(b.legalName)}. Данные о сервисе — из карточки 2ГИС и с сайта yasira.kz.</p>
  </div>
</footer>

<!-- Компактный док вместо нижней панели: две круглые кнопки,
     не перекрывают содержимое и не занимают четверть экрана -->
<div class="mobile-dock">
  <a class="dock-btn dock-call" href="${config.telHref(b.phone)}" aria-label="Позвонить">
    ${icon('phone', { size: 21 })}
  </a>
  <a
    class="dock-btn dock-wa"
    href="${config.waLink(config.waText.general)}"
    rel="noopener"
    target="_blank"
    aria-label="Написать в WhatsApp"
  >
    ${icon('whatsapp', { size: 21 })}
  </a>
</div>

${page.script ? html`<script${nonceHtml}>${raw(page.script)}</script>` : ''}
</body>
</html>`);
}

module.exports = { layout, NAV };
