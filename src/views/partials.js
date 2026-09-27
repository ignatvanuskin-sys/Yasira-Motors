'use strict';

/**
 * Переиспользуемые фрагменты разметки.
 */

const { html, raw, esc } = require('../lib/html');
const { icon } = require('./icons');
const config = require('../config');
const context = require('../lib/context');
const { REVIEW_SOURCE } = require('../content/reviews');

/**
 * Порядковый номер секции для «приборной» нумерации (01, 02, …).
 *
 * Счётчик живёт в контексте запроса (AsyncLocalStorage), поэтому
 * нумерация сама сбрасывается на каждой странице и не зависит от того,
 * в каком порядке шаблон вызывает секции.
 * @returns {string|null}
 */
function nextSectionIndex() {
  const store = context.current();
  if (!store) return null;
  store.sectionIndex = (store.sectionIndex || 0) + 1;
  return String(store.sectionIndex).padStart(2, '0');
}

/**
 * Форматирование цены.
 * Если подтверждённой цены нет — честная формулировка вместо цифры.
 * @param {{priceFrom?:number|null}} service
 */
function priceLabel(service) {
  if (service.priceFrom) {
    return `от ${new Intl.NumberFormat('ru-RU').format(service.priceFrom)} ₸`;
  }
  return 'Стоимость — по запросу';
}

/** Бейдж «цена по запросу» — подсказка, почему нет цифры. */
function priceNote(service) {
  if (service.priceFrom) return 'Цена зависит от автомобиля — уточняется при записи';
  return 'Точную цену администратор назовёт до начала работ';
}

/** Звёзды рейтинга. */
function ratingStars(value) {
  const full = Math.round(Number(value) || 0);
  let out = '';
  for (let i = 1; i <= 5; i += 1) {
    out += html`<span class="star${i <= full ? ' is-on' : ''}">${icon('star', {
      size: 16,
      strokeWidth: 1.4,
    })}</span>`;
  }
  return raw(out);
}

/**
 * Карточка услуги.
 * @param {object} service
 * @param {{chip?:'auto'|'category'}} [options] chip: 'category' — показывать
 *   категорию вместо плашки «Часто заказывают». Нужно в подборке популярных
 *   услуг, где заголовок секции уже говорит о популярности: иначе одинаковые
 *   плашки повторяются в каждой карточке подряд и выглядят как шаблон.
 */
function serviceCard(service, options = {}) {
  const showCategory = options.chip === 'category' || !service.popular;
  return html`
    <article class="service-card${service.popular ? ' is-popular' : ''}">
      <div class="service-card-top">
        <span class="service-icon" aria-hidden="true">${icon(service.icon, { size: 26 })}</span>
        ${showCategory
          ? html`<span class="chip">${service.category}</span>`
          : html`<span class="chip chip-accent">Часто заказывают</span>`}
      </div>
      <h3 class="service-card-title">${service.title}</h3>
      <p class="service-card-text">${service.summary}</p>
      <div class="service-card-meta">
        <span class="meta-item">${icon('clock', { size: 16 })} ${service.durationText}</span>
      </div>
      <div class="service-card-price">
        <span class="price-value">${priceLabel(service)}</span>
        <span class="price-hint">${priceNote(service)}</span>
      </div>
      <div class="service-card-actions">
        <a class="btn btn-primary btn-sm" href="/booking?service=${esc(service.slug)}">Записаться</a>
        <a class="link-arrow" href="/services/${esc(service.slug)}">
          Подробнее ${icon('arrowRight', { size: 16 })}
        </a>
      </div>
    </article>
  `;
}

/**
 * Шапка секции. Номер секции подставляется автоматически.
 *
 * Заголовок можно передать двумя строками — тогда вторая выделяется
 * акцентным цветом. Приём взят с сайтов-референсов: двухстрочный заголовок
 * задаёт ритм и читается легче, чем одна длинная строка.
 *
 * @param {string} kicker
 * @param {string|string[]} title одна строка или две
 * @param {string} [text]
 * @param {{center?:boolean, index?:string|null}} [options]
 */
function sectionHead(kicker, title, text, options = {}) {
  const index = options.index === null ? null : options.index || nextSectionIndex();
  const lines = Array.isArray(title) ? title : [title];
  const lastIndex = lines.length - 1;

  return html`
    <header class="section-head${options.center ? ' is-center' : ''}">
      ${kicker
        ? html`<p class="kicker">
            ${index ? html`<span class="section-index">${index}</span>` : ''}
            <span>${kicker}</span>
          </p>`
        : ''}
      <h2 class="section-title">
        ${lines.map(
          (line, position) => html`<span class="ttl-line${position === lastIndex && lines.length > 1 ? ' is-accent' : ''}"
            >${line}</span
          >`
        )}
      </h2>
      ${text ? html`<p class="section-text">${text}</p>` : ''}
    </header>
  `;
}

/**
 * Встраиваемая карта 2ГИС.
 *
 * Заменяет статичный снимок карты: тот на тёмном фоне читался плохо,
 * показывал пятно вместо ориентиров и не давал ни масштаба, ни адреса.
 * Виджет отдаёт настоящую карту с карточкой сервиса — часами работы,
 * рейтингом и фотографиями.
 *
 * @param {{zoom?:number, tall?:boolean}} [options]
 */
function mapEmbed(options = {}) {
  const b = config.business;
  const params = encodeURIComponent(
    JSON.stringify({
      pos: { lat: b.lat, lon: b.lon, zoom: options.zoom || 17 },
      opt: { city: b.twoGisCity },
      org: b.twoGisFirmId,
    })
  );

  return html`
    <div class="map-embed${options.tall ? ' is-tall' : ''}">
      <iframe
        src="https://widgets.2gis.com/widget?type=firmsonmap&options=${params}"
        title="Карта: ${b.name}, ${b.address}"
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
      ></iframe>
      <a class="map-embed-link" href="${b.twoGis}" rel="noopener" target="_blank">
        ${icon('route', { size: 18 })} Открыть в 2ГИС
      </a>
    </div>
  `;
}

/**
 * Широкая фотолента с подписью — разбивает сетки карточек и показывает
 * реальные снимки сервиса крупно.
 * @param {{file:string, alt:string, title:string, text:string}} photo
 */
function photoBand(photo) {
  return html`
    <figure class="photo-band">
      <img
        src="/img/${photo.file}"
        alt="${photo.alt}"
        loading="lazy"
        decoding="async"
        width="1200"
        height="600"
      >
      <figcaption>
        <strong>${photo.title}</strong>
        <span>${photo.text}</span>
      </figcaption>
    </figure>
  `;
}

/** Карточка отзыва. */
function reviewCard(review) {
  return html`
    <figure class="review-card">
      <div class="review-head">
        <div class="review-stars" aria-label="Оценка ${review.rating} из 5">
          ${ratingStars(review.rating)}
        </div>
        <span class="review-date">${review.date}</span>
      </div>
      <blockquote class="review-text">${review.text}</blockquote>
      <figcaption class="review-author">
        <span class="review-name">${review.author}</span>
        <span class="review-meta">${review.meta}</span>
        <span class="review-source">
          Источник:
          <a href="${REVIEW_SOURCE.url}" rel="noopener" target="_blank">${REVIEW_SOURCE.name}</a>
        </span>
      </figcaption>
    </figure>
  `;
}

/** Галерея реальных фотографий. */
function galleryGrid(items) {
  return html`
    <div class="gallery">
      ${items.map(
        (photo, index) => html`
          <figure class="gallery-item${index === 0 ? ' is-wide' : ''}">
            <img
              src="/img/${esc(photo.file)}"
              alt="${photo.alt}"
              loading="lazy"
              decoding="async"
              width="900"
              height="600"
            >
            <figcaption>
              <strong>${photo.caption}</strong>
              <span>${photo.note}</span>
            </figcaption>
          </figure>
        `
      )}
    </div>
  `;
}

/** Аккордеон FAQ. */
function faqList(items, idPrefix = 'faq') {
  return html`
    <div class="faq-list">
      ${items.map(
        (item, index) => html`
          <details class="faq-item"${raw(index === 0 ? ' open' : '')}>
            <summary>
              <span>${item.q}</span>
              <span class="faq-icon" aria-hidden="true">${icon('arrowRight', { size: 18 })}</span>
            </summary>
            <div class="faq-body"><p>${item.a}</p></div>
          </details>
        `
      )}
    </div>
  `;
}

/** Блок контактов для быстрых действий. */
function contactActions(options = {}) {
  const b = config.business;
  return html`
    <div class="contact-actions">
      <a class="btn btn-primary" href="tel:${b.phone.replace(/[^\d+]/g, '')}">
        ${icon('phone', { size: 18 })} Позвонить
      </a>
      <a class="btn btn-ghost" href="https://wa.me/${b.whatsapp}" rel="noopener" target="_blank">
        ${icon('whatsapp', { size: 18 })} WhatsApp
      </a>
      ${options.withRoute
        ? html`<a
            class="btn btn-ghost"
            href="https://2gis.kz/aktau/directions/points/%7C${b.lon}%2C${b.lat}%3B70000001029237438"
            rel="noopener"
            target="_blank"
          >
            ${icon('route', { size: 18 })} Маршрут
          </a>`
        : ''}
    </div>
  `;
}

module.exports = {
  priceLabel,
  priceNote,
  ratingStars,
  serviceCard,
  sectionHead,
  photoBand,
  mapEmbed,
  nextSectionIndex,
  reviewCard,
  galleryGrid,
  faqList,
  contactActions,
};
