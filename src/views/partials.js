'use strict';

/**
 * Переиспользуемые фрагменты разметки.
 *
 * Весь сайт сводится к двум действиям — позвонить и написать в WhatsApp.
 * Поэтому пара кнопок вынесена в один компонент: если действие поменяется,
 * оно поменяется сразу везде, а не в двадцати местах.
 */

const { html, raw, esc } = require('../lib/html');
const { icon } = require('./icons');
const config = require('../config');
const context = require('../lib/context');
const { REVIEW_SOURCE } = require('../content/reviews');

/**
 * Порядковый номер секции для нумерации 01, 02, …
 * Счётчик живёт в контексте запроса, поэтому сам сбрасывается на каждой
 * странице.
 * @returns {string|null}
 */
function nextSectionIndex() {
  const store = context.current();
  if (!store) return null;
  store.sectionIndex = (store.sectionIndex || 0) + 1;
  return String(store.sectionIndex).padStart(2, '0');
}

/**
 * Шапка секции. Заголовок можно передать двумя строками — вторая
 * выделяется акцентным цветом.
 * @param {string} kicker
 * @param {string|string[]} title
 * @param {string} [text]
 * @param {{center?:boolean, index?:string|null}} [options]
 */
function sectionHead(kicker, title, text, options = {}) {
  const index = options.index === null ? null : options.index || nextSectionIndex();
  const lines = Array.isArray(title) ? title : [title];
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
          (line, i) =>
            html`<span
              class="ttl-line${i === lines.length - 1 && lines.length > 1 ? ' is-accent' : ''}"
              >${line}</span
            >`
        )}
      </h2>
      ${text ? html`<p class="section-text">${text}</p>` : ''}
    </header>
  `;
}

/**
 * Пара основных действий: позвонить и написать в WhatsApp.
 * @param {{whatsappText?:string, withRoute?:boolean, compact?:boolean, secondaryToCall?:boolean}} [options]
 */
function actionPair(options = {}) {
  const b = config.business;
  const waText = options.whatsappText || config.waText.general;
  const compact = options.compact ? ' btn-sm' : '';

  return html`
    <div class="action-pair${options.compact ? ' is-compact' : ''}">
      <a class="btn btn-primary${compact}" href="${config.telHref(b.phone)}">
        ${icon('phone', { size: 18 })} Позвонить
      </a>
      <a
        class="btn btn-whatsapp${compact}"
        href="${config.waLink(waText)}"
        rel="noopener"
        target="_blank"
      >
        ${icon('whatsapp', { size: 18 })} Написать в WhatsApp
      </a>
      ${options.withRoute
        ? html`<a
            class="btn btn-ghost${compact}"
            href="${b.twoGis}"
            rel="noopener"
            target="_blank"
          >
            ${icon('route', { size: 18 })} Маршрут
          </a>`
        : ''}
    </div>
  `;
}

/**
 * Карточка услуги.
 *
 * Сокращена до сути: что делаем — и как узнать стоимость. Раньше в карточке
 * были категория, срок, цена и две кнопки; это заставляло читать вместо
 * того, чтобы звонить.
 * @param {object} service
 * @param {{chip?:boolean}} [options]
 */
function serviceCard(service, options = {}) {
  return html`
    <article class="service-card">
      <span class="service-icon" aria-hidden="true">${icon(service.icon, { size: 24 })}</span>
      <h3 class="service-card-title">
        ${options.chip ? html`<a href="/services/${service.slug}">${service.title}</a>` : service.title}
      </h3>
      <p class="service-card-text">${service.summary}</p>
      <div class="service-card-foot">
        <a class="link-arrow" href="/services/${service.slug}">
          ${options.chip ? 'Что входит' : 'Уточнить стоимость'} ${icon('arrowRight', { size: 16 })}
        </a>
        <span class="service-card-actions">
          <a
            class="icon-btn"
            href="${config.telHref(config.business.phone)}"
            aria-label="Позвонить в YASIRA MOTORS"
          >
            ${icon('phone', { size: 17 })}
          </a>
          <a
            class="icon-btn"
            href="${config.waLink(config.waText.service(service.title.toLowerCase()))}"
            rel="noopener"
            target="_blank"
            aria-label="Написать в WhatsApp про «${service.title}»"
          >
            ${icon('whatsapp', { size: 17 })}
          </a>
        </span>
      </div>
    </article>
  `;
}

/** Плитка доверия: значение + подпись. */
function trustCard(item) {
  return html`
    <article class="trust-card">
      <strong class="trust-value">${item.value}</strong>
      <span class="trust-label">${item.label}</span>
      ${item.note ? html`<span class="trust-note">${item.note}</span>` : ''}
    </article>
  `;
}

/** Плитка процесса: номер, заголовок, пояснение. */
function stepCard(step) {
  return html`
    <article class="step">
      <span class="step-num">${step.n}</span>
      <div>
        <h3 class="step-title">${step.title}</h3>
        <p class="step-text">${step.text}</p>
      </div>
    </article>
  `;
}

/** Карточка отзыва. */
function reviewCard(review) {
  return html`
    <article class="review-card">
      <div class="review-head">
        ${ratingStars(review.rating)}
        <span class="review-date">${review.date}</span>
      </div>
      <p class="review-text">«${review.text}»</p>
      <footer class="review-foot">
        <strong>${review.author}</strong>
        <span class="review-meta">${review.meta}</span>
        <span class="review-source">
          Источник:
          <a href="${REVIEW_SOURCE.url}" rel="noopener" target="_blank">${REVIEW_SOURCE.name}</a>
        </span>
      </footer>
    </article>
  `;
}

/** Звёзды рейтинга. */
function ratingStars(value) {
  const full = Math.round(Number(value) || 0);
  let out = '';
  for (let i = 1; i <= 5; i += 1) {
    out += html`<span class="star${i <= full ? ' is-on' : ''}" aria-hidden="true"
      >${icon('star', { size: 15, strokeWidth: 1.6 })}</span
    >`;
  }
  return raw(out);
}

/**
 * Блок рейтингов: две площадки с подтверждёнными цифрами.
 * Одна площадка — это мнение одной площадки; две подтверждают друг друга.
 */
function ratingBlock() {
  const b = config.business;
  return html`
    <div class="rating-block">
      <a class="rating-card" href="${b.twoGis}" rel="noopener" target="_blank">
        <span class="rating-score">${b.rating}</span>
        ${ratingStars(b.rating)}
        <span class="rating-source">2ГИС</span>
        <span class="rating-count">${b.ratingsCount} оценок</span>
      </a>
      <a class="rating-card" href="${b.yandex}" rel="noopener" target="_blank">
        <span class="rating-score">${b.yandexRating.toFixed(1)}</span>
        ${ratingStars(b.yandexRating)}
        <span class="rating-source">Яндекс Карты</span>
        <span class="rating-count">${b.yandexRatingsCount} оценок</span>
      </a>
    </div>
  `;
}

/** Встраиваемая карта 2ГИС: показывает карточку сервиса, а не метку. */
function mapEmbed(options = {}) {
  const b = config.business;
  const params = encodeURIComponent(
    JSON.stringify({
      pos: { lat: b.lat, lon: b.lon, zoom: options.zoom || 17 },
      opt: { city: b.twoGisCity },
      org: b.twoGisFirmId,
    })
  );
  const src = `https://widgets.2gis.com/widget?type=firmsonmap&options=${params}`;
  return html`
    <div class="map-embed${options.tall ? ' is-tall' : ''}">
      <iframe
        src="${src}"
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

/** Список вопросов FAQ. */
function faqList(items, idPrefix) {
  return html`
    <div class="faq-list">
      ${items.map(
        (item, i) => html`
          <details class="faq-item"${raw(i === 0 ? ' open' : '')}>
            <summary>
              <span>${item.q}</span>
              <span class="faq-icon" aria-hidden="true">${icon('plus', { size: 18 })}</span>
            </summary>
            <div class="faq-answer"><p>${item.a}</p></div>
          </details>
        `
      )}
    </div>
  `;
}

/**
 * Галерея: большая мозаика из реальных фотографий.
 * Раскладка задаётся в CSS по порядку элементов — первый кадр самый крупный.
 */
function galleryGrid(photos) {
  return html`
    <div class="gallery">
      ${photos.map(
        (photo, i) => html`
          <figure class="gallery-item${i === 0 ? ' is-wide' : ''}">
            <img
              src="/img/${esc(photo.file)}"
              alt="${photo.alt}"
              loading="${i === 0 ? 'eager' : 'lazy'}"
              decoding="async"
              width="900"
              height="600"
            >
          </figure>
        `
      )}
    </div>
  `;
}

/** Строка «признак проблемы» — для блока «Не знаете, что с машиной?» */
function symptomChip(text) {
  return html`<li class="symptom-chip">${text}</li>`;
}

module.exports = {
  sectionHead,
  actionPair,
  serviceCard,
  trustCard,
  stepCard,
  ratingStars,
  ratingBlock,
  reviewCard,
  mapEmbed,
  faqList,
  galleryGrid,
  symptomChip,
  nextSectionIndex,
};
