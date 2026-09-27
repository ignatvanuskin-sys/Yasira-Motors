'use strict';

/**
 * Переиспользуемые фрагменты разметки.
 */

const { html, raw, esc } = require('../lib/html');
const { icon } = require('./icons');
const config = require('../config');
const { REVIEW_SOURCE } = require('../content/reviews');

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

/** Карточка услуги. */
function serviceCard(service, options = {}) {
  return html`
    <article class="service-card">
      <div class="service-card-top">
        <span class="service-icon" aria-hidden="true">${icon(service.icon, { size: 26 })}</span>
        ${service.popular
          ? html`<span class="chip chip-accent">Часто заказывают</span>`
          : html`<span class="chip">${service.category}</span>`}
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

/** Шапка секции. */
function sectionHead(kicker, title, text, options = {}) {
  return html`
    <header class="section-head${options.center ? ' is-center' : ''}">
      ${kicker ? html`<p class="kicker">${kicker}</p>` : ''}
      <h2 class="section-title">${title}</h2>
      ${text ? html`<p class="section-text">${text}</p>` : ''}
    </header>
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
  reviewCard,
  galleryGrid,
  faqList,
  contactActions,
};
