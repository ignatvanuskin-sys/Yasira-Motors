'use strict';

/**
 * Страница контактов /contacts.
 */

const { html } = require('../lib/html');
const { icon } = require('./icons');
const { layout } = require('./layout');
const { sectionHead, faqList, contactActions, mapEmbed } = require('./partials');
const config = require('../config');
const { FAQ } = require('../content/faq');
const seo = require('../lib/seo');

function renderContacts() {
  const b = config.business;

  const body = html`
    <section class="page-head">
      <div class="container">
        <nav class="breadcrumbs" aria-label="Хлебные крошки">
          <a href="/">Главная</a>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Контакты</span>
        </nav>
        <h1 class="page-title">Контакты YASIRA MOTORS</h1>
        <p class="page-text">
          Автосервис и магазин масел и автохимии в Актау, 25-й микрорайон, 52/2.
          Позвоните, напишите в WhatsApp или приезжайте — мы на первом этаже.
        </p>
        ${contactActions({ withRoute: true })}
      </div>
    </section>

    <section class="section">
      <div class="container contacts-layout">
        <div class="contacts-info">
          <ul class="info-list info-list-large">
            <li>
              <span class="info-icon" aria-hidden="true">${icon('map', { size: 22 })}</span>
              <div>
                <strong>Адрес</strong>
                <span>${b.address}</span>
                <span class="muted">${b.addressExtra} · вход со стороны микрорайона</span>
              </div>
            </li>
            <li>
              <span class="info-icon" aria-hidden="true">${icon('clock', { size: 22 })}</span>
              <div>
                <strong>Часы работы</strong>
                <span>Пн–Сб: 09:00–20:00</span>
                <span>Вс: 10:00–17:00</span>
                <span class="muted">В праздничные дни возможны изменения</span>
              </div>
            </li>
            <li>
              <span class="info-icon" aria-hidden="true">${icon('phone', { size: 22 })}</span>
              <div>
                <strong>Телефоны</strong>
                <span><a href="tel:${b.phone.replace(/[^\d+]/g, '')}">${b.phone}</a></span>
                <span>
                  <a href="tel:${b.phone2.replace(/[^\d+]/g, '')}">${b.phone2}</a> ·
                  <a href="tel:${b.phone3.replace(/[^\d+]/g, '')}">${b.phone3}</a>
                </span>
              </div>
            </li>
            <li>
              <span class="info-icon" aria-hidden="true">${icon('whatsapp', { size: 22 })}</span>
              <div>
                <strong>WhatsApp и почта</strong>
                <span><a href="https://wa.me/${b.whatsapp}" rel="noopener" target="_blank">Написать в WhatsApp</a></span>
                <span class="muted">
                  <a href="mailto:${b.email}">${b.email}</a> ·
                  <a href="mailto:${b.emailSales}">${b.emailSales}</a>
                </span>
              </div>
            </li>
            <li>
              <span class="info-icon" aria-hidden="true">${icon('ig', { size: 22 })}</span>
              <div>
                <strong>Соцсети и отзывы</strong>
                <span><a href="${b.instagram}" rel="noopener" target="_blank">Instagram @yasira_motors</a></span>
                <span class="muted">
                  <a href="${b.twoGis}" rel="noopener" target="_blank">Карточка и отзывы на 2ГИС</a>
                </span>
              </div>
            </li>
            <li>
              <span class="info-icon" aria-hidden="true">${icon('card', { size: 22 })}</span>
              <div>
                <strong>Оплата</strong>
                <span>${b.payments.join(' · ')}</span>
              </div>
            </li>
            <li>
              <span class="info-icon" aria-hidden="true">${icon('car', { size: 22 })}</span>
              <div>
                <strong>Как добраться</strong>
                <span>Остановка «${b.transit.stop}» — ${b.transit.walk}</span>
                <span class="muted">${b.parkingCount} парковки рядом со зданием</span>
              </div>
            </li>
          </ul>

          <div class="contacts-cta">
            <h2 class="aside-title">Запишитесь на обслуживание</h2>
            <p class="aside-text">
              Онлайн-запись работает круглосуточно: выберите услугу, дату и время,
              а администратор подтвердит запись по телефону.
            </p>
            <a class="btn btn-primary" href="/booking">
              ${icon('calendar', { size: 18 })} Выбрать время
            </a>
          </div>
        </div>

        <div class="contacts-map">
          ${mapEmbed({ zoom: 17, tall: true })}
          <p class="map-coords">
            Координаты: ${b.lat.toFixed(6)}, ${b.lon.toFixed(6)}
          </p>
        </div>
      </div>
    </section>

    <section class="section faq-section" id="faq">
      <div class="container narrow">
        ${sectionHead('Вопросы и ответы', 'Перед визитом')}
        ${faqList(FAQ)}
      </div>
    </section>

    <section class="final-cta">
      <div class="container final-cta-inner">
        <h2 class="final-cta-title">Нужна помощь с выбором услуги?</h2>
        <p class="final-cta-text">
          Опишите проблему по телефону — подскажем, с чего начать, и назовём ориентир по стоимости.
        </p>
        ${contactActions()}
      </div>
    </section>
  `;

  return layout({
    title: `Контакты — ${config.business.name}, автосервис в Актау`,
    description:
      'YASIRA MOTORS: Актау, 25-й микрорайон, 52/2. Телефон +7 777 088 44 36. ' +
      'Пн–Сб 09:00–20:00, Вс 10:00–17:00. WhatsApp, Instagram, маршрут до сервиса.',
    path: '/contacts',
    activePath: '/contacts',
    schema: seo.schemaScript({
      path: '/contacts',
      title: 'Контакты YASIRA MOTORS',
      description: 'Адрес, телефоны и часы работы автосервиса YASIRA MOTORS в Актау.',
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
