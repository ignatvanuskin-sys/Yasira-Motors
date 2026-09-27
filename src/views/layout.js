'use strict';

/**
 * Общий каркас страницы: <head>, шапка, подвал, мобильная панель.
 * Разметка собирается через tagged-шаблон html`` — все подстановки
 * экранируются автоматически.
 */

const { html, esc, raw, attrs, isRaw } = require('../lib/html');
const { icon } = require('./icons');
const config = require('../config');
const seo = require('../lib/seo');
const context = require('../lib/context');

const NAV = [
  { href: '/', label: 'Главная' },
  { href: '/services', label: 'Услуги' },
  { href: '/booking', label: 'Запись' },
  { href: '/contacts', label: 'Контакты' },
];

/** Телефон в формате для tel: */
function telHref(phone) {
  return `tel:${String(phone).replace(/[^\d+]/g, '')}`;
}

/** Ссылка WhatsApp с готовым текстом. */
function whatsappHref(text) {
  const message = encodeURIComponent(text || 'Здравствуйте! Пишу с сайта YASIRA MOTORS.');
  return `https://wa.me/${config.business.whatsapp}?text=${message}`;
}

/** Ссылка на маршрут в 2GIS. */
function routeHref() {
  return `https://2gis.kz/aktau/directions/points/%7C${config.business.lon}%2C${config.business.lat}%3B70000001029237438`;
}

/**
 * @param {{
 *   title:string, description:string, path:string, body:string,
 *   schema?:object, image?:string, activePath?:string, noindex?:boolean,
 *   script?:string, preloadImage?:string, bodyClass?:string
 * }} page
 */
function layout(page) {
  const b = config.business;
  const canonical = seo.url(page.path);
  const ogImage = `${config.siteUrl}${page.image || '/img/directions2.jpg'}`;
  const active = page.activePath || page.path;
  /* CSP-nonce текущего запроса: позволяет оставить script-src строгим. */
  const nonceValue = context.nonce();
  const nonceAttr = nonceValue ? ` nonce="${esc(nonceValue)}"` : '';
  const nonceHtml = raw(nonceAttr);

  return String(html`<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.description)}">
<link rel="canonical" href="${esc(canonical)}">
<meta name="robots" content="${page.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'}">
<meta name="theme-color" content="#07080c">
<meta name="format-detection" content="telephone=no">

<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(b.name)}">
<meta property="og:locale" content="ru_KZ">
<meta property="og:title" content="${esc(page.title)}">
<meta property="og:description" content="${esc(page.description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc(ogImage)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">

<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/favicon.svg">
${page.preloadImage ? html`<link rel="preload" as="image" href="${page.preloadImage}" fetchpriority="high">` : ''}
<link rel="preload" as="font" type="font/woff2" href="/fonts/manrope-cyrillic.woff2" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="/fonts/manrope-latin.woff2" crossorigin>
<link rel="stylesheet" href="/css/style.css">
<script defer src="/js/app.js"></script>
${page.schema ? html`<script type="application/ld+json"${nonceHtml}>${raw(page.schema)}</script>` : ''}
</head>
<body${attrs({ class: page.bodyClass })}>
<a class="skip-link" href="#main">Перейти к содержанию</a>

<header class="site-header" id="site-header">
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
        (item) => html`<a href="${item.href}"${raw(
          item.href === active ? ' class="is-active" aria-current="page"' : ''
        )}>${item.label}</a>`
      )}
    </nav>

    <div class="header-actions">
      <a class="header-phone" href="${telHref(b.phone)}" aria-label="Позвонить в сервис">
        ${icon('phone', { size: 18 })}
        <span>${esc(b.phone)}</span>
      </a>
      <a class="btn btn-primary btn-sm" href="/booking">Записаться</a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="mobile-nav" aria-label="Открыть меню">
        ${icon('menu', { size: 22 })}
      </button>
    </div>
  </div>

  <div class="mobile-nav" id="mobile-nav" hidden>
    <nav class="container" aria-label="Мобильное меню">
      ${NAV.map((item) => html`<a href="${item.href}">${item.label}</a>`)}
      <div class="mobile-nav-contacts">
        <a class="btn btn-ghost" href="${telHref(b.phone)}">${icon('phone', { size: 18 })} Позвонить</a>
        <a class="btn btn-ghost" href="${whatsappHref()}" rel="noopener" target="_blank">${icon(
          'whatsapp',
          { size: 18 }
        )} WhatsApp</a>
      </div>
    </nav>
  </div>
</header>

<main id="main">
${isRaw(page.body) ? page.body : raw(String(page.body || ''))}
</main>

<footer class="site-footer">
  <div class="container footer-grid">
    <div class="footer-brand">
      <div class="brand brand-static" translate="no">
        <span class="brand-mark" aria-hidden="true">${icon('gauge', { size: 22 })}</span>
        <span class="brand-text">
          <span class="brand-name">YASIRA</span>
          <span class="brand-sub">MOTORS</span>
        </span>
      </div>
      <p class="footer-note">
        Автосервис в Актау: диагностика, техническое обслуживание и ремонт
        легковых и грузовых автомобилей. Магазин масел и автохимии.
      </p>
      <p class="footer-meta">${esc(b.tagline)}</p>
    </div>

    <div>
      <h3 class="footer-title">Контакты</h3>
      <ul class="footer-list">
        <li><a href="${telHref(b.phone)}">${esc(b.phone)}</a></li>
        <li><a href="${telHref(b.phone2)}">${esc(b.phone2)}</a></li>
        <li><a href="${telHref(b.phone3)}">${esc(b.phone3)}</a></li>
        <li><a href="mailto:${esc(b.email)}">${esc(b.email)}</a></li>
        <li>
          <a href="${whatsappHref()}" rel="noopener" target="_blank">WhatsApp</a>
          ·
          <a href="${esc(b.instagram)}" rel="noopener" target="_blank">Instagram</a>
        </li>
      </ul>
    </div>

    <div>
      <h3 class="footer-title">Адрес и часы</h3>
      <ul class="footer-list">
        <li>${esc(b.address)}</li>
        <li>${esc(b.hoursText)}</li>
        <li><a href="${routeHref()}" rel="noopener" target="_blank">Построить маршрут</a></li>
        <li><a href="${esc(b.twoGis)}" rel="noopener" target="_blank">Отзывы на 2ГИС</a></li>
      </ul>
    </div>

    <div>
      <h3 class="footer-title">Разделы</h3>
      <ul class="footer-list">
        ${NAV.map((item) => html`<li><a href="${item.href}">${item.label}</a></li>`)}
        <li><a href="/services#selector">Подбор услуги</a></li>
        <li><a href="/contacts#faq">Вопросы и ответы</a></li>
      </ul>
    </div>
  </div>

  <div class="container footer-bottom">
    <p>© ${new Date().getFullYear()} ${esc(b.name)} · ${esc(b.city)}, Казахстан</p>
    <p class="footer-legal">
      Рейтинг и отзывы — по данным 2ГИС на ${esc('27.09.2026')}.
      Стоимость работ уточняется у администратора.
    </p>
  </div>
</footer>

<div class="mobile-bar" role="region" aria-label="Быстрые действия">
  <a class="mobile-bar-item" href="${telHref(b.phone)}">
    ${icon('phone', { size: 20 })}<span>Позвонить</span>
  </a>
  <a class="mobile-bar-item" href="${whatsappHref()}" rel="noopener" target="_blank">
    ${icon('whatsapp', { size: 20 })}<span>WhatsApp</span>
  </a>
  <a class="mobile-bar-item mobile-bar-cta" href="/booking">
    ${icon('calendar', { size: 20 })}<span>Записаться</span>
  </a>
</div>

${page.script ? html`<script${nonceHtml}>${raw(page.script)}</script>` : ''}
</body>
</html>`);
}

module.exports = { layout, NAV, telHref, whatsappHref, routeHref };
