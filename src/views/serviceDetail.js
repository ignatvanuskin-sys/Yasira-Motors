'use strict';

/**
 * Страница отдельной услуги /services/{slug}.
 *
 * Структура: hero → что делаем → когда нужно → что входит → цена →
 * сколько занимает → FAQ → запись.
 */

const { html, esc } = require('../lib/html');
const { icon } = require('./icons');
const { layout } = require('./layout');
const { sectionHead, faqList, priceLabel, priceNote, contactActions } = require('./partials');
const config = require('../config');
const { SERVICES } = require('../content/services');
const seo = require('../lib/seo');

/**
 * @param {object} service
 */
function renderServiceDetail(service) {
  const related = SERVICES.filter(
    (s) => s.slug !== service.slug && s.category === service.category
  ).slice(0, 3);

  const body = html`
    <section class="page-head page-head-service">
      <div class="container">
        <nav class="breadcrumbs" aria-label="Хлебные крошки">
          <a href="/">Главная</a>
          <span aria-hidden="true">/</span>
          <a href="/services">Услуги</a>
          <span aria-hidden="true">/</span>
          <span aria-current="page">${service.title}</span>
        </nav>

        <div class="service-hero">
          <div class="service-hero-body">
            <p class="kicker">${icon(service.icon, { size: 16 })} ${service.category}</p>
            <h1 class="page-title">${service.title}</h1>
            <p class="page-text">${service.description}</p>

            <div class="service-facts">
              <div class="fact">
                <span class="fact-label">Стоимость</span>
                <strong class="fact-value">${priceLabel(service)}</strong>
                <span class="fact-hint">${priceNote(service)}</span>
              </div>
              <div class="fact">
                <span class="fact-label">Время работ</span>
                <strong class="fact-value">${service.durationText}</strong>
                <span class="fact-hint">Точный срок — после осмотра автомобиля</span>
              </div>
            </div>

            <div class="page-actions">
              <a class="btn btn-primary btn-lg" href="/booking?service=${esc(service.slug)}">
                ${icon('calendar', { size: 20 })} Записаться на ${service.title.toLowerCase()}
              </a>
              <a
                class="btn btn-ghost btn-lg"
                href="tel:${config.business.phone.replace(/[^\d+]/g, '')}"
              >
                ${icon('phone', { size: 20 })} Спросить цену
              </a>
            </div>
          </div>

          <div class="service-hero-aside">
            <div class="aside-card">
              <h2 class="aside-title">Источник данных</h2>
              <p class="aside-text">${service.source}</p>
            </div>
            ${related.length
              ? html`
                  <div class="aside-card">
                    <h2 class="aside-title">Другие услуги раздела</h2>
                    <ul class="aside-links">
                      ${related.map(
                        (s) => html`
                          <li>
                            <a href="/services/${s.slug}">
                              ${icon(s.icon, { size: 18 })} ${s.title}
                            </a>
                          </li>
                        `
                      )}
                    </ul>
                  </div>
                `
              : ''}
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container two-col">
        <div class="col">
          ${sectionHead('Когда нужно', 'Признаки, с которыми приезжают')}
          <ul class="check-list">
            ${service.symptoms.map((s) => html`<li>${icon('check', { size: 18 })} ${s}</li>`)}
          </ul>
        </div>
        <div class="col">
          ${sectionHead('Что входит', 'Состав работ')}
          <ul class="check-list">
            ${service.included.map((s) => html`<li>${icon('tool', { size: 18 })} ${s}</li>`)}
          </ul>
        </div>
      </div>
    </section>

    <section class="section section-muted">
      <div class="container narrow">
        ${sectionHead('Стоимость', 'Что с ценой на эту услугу')}
        <div class="price-panel">
          <div class="price-panel-value">${priceLabel(service)}</div>
          <p class="price-panel-text">
            Цена зависит от марки, модели, года выпуска и состояния автомобиля.
            Мы не публикуем «средние» цифры, потому что они почти всегда оказываются
            неверными. Администратор назовёт стоимость после уточнения деталей —
            и до начала работ.
          </p>
          ${contactActions()}
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container narrow">
        ${sectionHead('Вопросы', `Частые вопросы: ${service.title.toLowerCase()}`)}
        ${faqList(service.faq)}
      </div>
    </section>

    <section class="final-cta">
      <div class="container final-cta-inner">
        <h2 class="final-cta-title">Записаться на ${service.title.toLowerCase()}</h2>
        <p class="final-cta-text">
          ${config.business.addressShort} · ${config.business.hoursText}
        </p>
        <div class="final-cta-actions">
          <a class="btn btn-primary btn-lg" href="/booking?service=${esc(service.slug)}">
            ${icon('calendar', { size: 20 })} Выбрать время
          </a>
          <a
            class="btn btn-ghost btn-lg"
            href="tel:${config.business.phone.replace(/[^\d+]/g, '')}"
          >
            ${icon('phone', { size: 20 })} ${config.business.phone}
          </a>
        </div>
      </div>
    </section>
  `;

  return layout({
    title: `${service.title} в Актау — ${config.business.name}`,
    description: `${service.summary} YASIRA MOTORS, ${config.business.addressShort}. ${service.durationText}. Онлайн-запись на обслуживание.`,
    path: `/services/${service.slug}`,
    activePath: '/services',
    image: '/img/directions2.jpg',
    schema: seo.schemaScript({
      path: `/services/${service.slug}`,
      title: `${service.title} — YASIRA MOTORS, Актау`,
      description: service.summary,
      service,
      faq: service.faq,
      breadcrumbs: [
        { name: 'Главная', url: '/' },
        { name: 'Услуги', url: '/services' },
        { name: service.title, url: `/services/${service.slug}` },
      ],
    }),
    body,
  });
}

module.exports = { renderServiceDetail };
