'use strict';

/**
 * Страница контактов /contacts.
 *
 * Задача страницы — чтобы человек мог позвонить, написать или приехать.
 * Ничего лишнего: адрес, часы, телефоны, как добраться, карта.
 */

const { html } = require('../lib/html');
const { icon } = require('./icons');
const { layout } = require('./layout');
const { sectionHead, actionPair, mapEmbed, faqList, ratingBlock } = require('./partials');
const config = require('../config');
const { FAQ } = require('../content/faq');
const seo = require('../lib/seo');

function renderContacts() {
  const b = config.business;
  const [mainPhone, ...otherPhones] = b.phoneList;
  const status = config.openStatus();

  const body = html`
    <section class="page-head">
      <div class="container">
        <nav class="breadcrumbs" aria-label="Хлебные крошки">
          <a href="/">Главная</a>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Контакты</span>
        </nav>
        <h1 class="page-title">Контакты ${b.name}</h1>
        <p class="page-text">
          ${b.address}, ${b.addressExtra}. ${b.hoursText}.
          Сейчас: <strong>${status.label.toLowerCase()}, ${status.detail}</strong>.
        </p>
        ${actionPair({ whatsappText: config.waText.general, withRoute: true })}
      </div>
    </section>

    <section class="section section-tint">
      <div class="container">
        <div class="contacts-layout">
          <div class="contacts-info">
            <ul class="info-list">
              <li>
                <span class="info-icon" aria-hidden="true">${icon('map', { size: 20 })}</span>
                <div>
                  <strong>Адрес</strong>
                  <span>${b.address}</span>
                  <span class="muted">${b.addressExtra}, вход со стороны микрорайона</span>
                </div>
              </li>
              <li>
                <span class="info-icon" aria-hidden="true">${icon('clock', { size: 20 })}</span>
                <div>
                  <strong>Часы работы</strong>
                  <span>Пн–Сб: 09:00–19:00</span>
                  <span>Вс: 10:00–17:00</span>
                  <span class="muted">В праздничные дни возможны изменения — уточните по телефону</span>
                </div>
              </li>
              <li>
                <span class="info-icon" aria-hidden="true">${icon('phone', { size: 20 })}</span>
                <div>
                  <strong>Телефон</strong>
                  <span>
                    <a href="${config.telHref(mainPhone.number)}">${mainPhone.number}</a>
                    <span class="muted"> — ${mainPhone.role}</span>
                  </span>
                  <span class="muted">
                    Другие телефоны:
                    ${otherPhones.map(
                      (entry) => html`<span class="phone-chip">
                        <a href="${config.telHref(entry.number)}">${entry.number}</a> — ${entry.role}
                      </span>`
                    )}
                  </span>
                </div>
              </li>
              <li>
                <span class="info-icon" aria-hidden="true">${icon('whatsapp', { size: 20 })}</span>
                <div>
                  <strong>WhatsApp и почта</strong>
                  <span>
                    <a
                      href="${config.waLink(config.waText.general)}"
                      rel="noopener"
                      target="_blank"
                      >Написать в WhatsApp</a
                    >
                  </span>
                  <span><a href="mailto:${b.email}">${b.email}</a></span>
                </div>
              </li>
              <li>
                <span class="info-icon" aria-hidden="true">${icon('car', { size: 20 })}</span>
                <div>
                  <strong>Как добраться</strong>
                  <span>Остановка «${b.transit.stop}» — ${b.transit.walk}</span>
                  <span class="muted">${b.parkingCount} парковки рядом</span>
                </div>
              </li>
              <li>
                <span class="info-icon" aria-hidden="true">${icon('card', { size: 20 })}</span>
                <div>
                  <strong>Оплата</strong>
                  <span>${b.payments.join(' · ')}</span>
                </div>
              </li>
            </ul>
          </div>

          ${mapEmbed({ tall: true })}
        </div>

        <p class="page-text muted">
          Координаты: ${b.lat.toFixed(6)}, ${b.lon.toFixed(6)}
        </p>
      </div>
    </section>

    <section class="section section-deep">
      <div class="container">
        ${sectionHead('Отзывы', ['Нас оценивают', 'на двух площадках'])}
        ${ratingBlock()}
      </div>
    </section>

    <section class="section section-tint">
      <div class="container narrow">
        ${sectionHead('Частые вопросы', ['Что спрашивают', 'перед звонком'])}
        ${faqList(FAQ)}
      </div>
    </section>

    <section class="section section-band final-cta">
      <div class="container narrow final-cta-inner">
        <h2 class="final-cta-title">
          <span class="ttl-line">Остались</span>
          <span class="ttl-line is-accent">вопросы?</span>
        </h2>
        <p class="final-cta-text">
          Позвоните или напишите в WhatsApp — ответим без «приезжайте, посмотрим на месте».
        </p>
        ${actionPair({ whatsappText: config.waText.general })}
        <p class="final-cta-meta">${b.addressShort} · ${b.hoursText}</p>
      </div>
    </section>
  `;

  return layout({
    title: `Контакты — ${b.name}, автосервис в ${b.city}`,
    description:
      `${b.address}, ${b.addressExtra}. ${b.hoursText}. Телефон ${b.phone}. ` +
      'WhatsApp, маршрут до сервиса, карта и рейтинги на 2ГИС и Яндекс Картах.',
    path: '/contacts',
    activePath: '/contacts',
    image: '/img/adv1.jpg',
    schema: seo.schemaScript({
      path: '/contacts',
      title: `Контакты ${b.name}`,
      description: `Адрес, телефоны и часы работы автосервиса ${b.name} в ${b.city}.`,
      includeFaqPage: true,
      breadcrumbs: [
        { name: 'Главная', url: '/' },
        { name: 'Контакты', url: '/contacts' },
      ],
    }),
    body,
  });
}

module.exports = { renderContacts };
