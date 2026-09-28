'use strict';

/**
 * Страница отдельной услуги /services/{slug}.
 *
 * Структура: что делаем → когда нужно → что входит → стоимость и срок →
 * вопросы по этой работе → позвонить или написать.
 *
 * Про сроки: в контенте стоят оценки вида «от 30 минут», но подаются они как
 * ориентир, а не как обещание. Точный срок зависит от автомобиля.
 */

const { html, esc } = require('../lib/html');
const { icon } = require('./icons');
const { layout } = require('./layout');
const { sectionHead, actionPair } = require('./partials');
const config = require('../config');
const { SERVICES, getService } = require('../content/services');
const { categoryForService } = require('../content/categories');
const seo = require('../lib/seo');

/**
 * @param {string} slug
 * @returns {string|null} null — если услуги с таким адресом нет (тогда 404)
 */
function renderServiceDetail(slug) {
  const service = getService(slug);
  if (!service) return null;

  const b = config.business;
  const category = categoryForService(service.slug);
  const related = SERVICES.filter(
    (item) => item.slug !== service.slug && item.category === service.category
  ).slice(0, 4);

  const body = html`
    <section class="page-head">
      <div class="container">
        <nav class="breadcrumbs" aria-label="Хлебные крошки">
          <a href="/">Главная</a>
          <span aria-hidden="true">/</span>
          <a href="/services">Услуги</a>
          <span aria-hidden="true">/</span>
          <span aria-current="page">${service.title}</span>
        </nav>
        ${category ? html`<p class="kicker">${category.title}</p>` : ''}
        <h1 class="page-title">${service.title}</h1>
        <p class="page-text">${service.description}</p>

        <div class="fact-panel">
          <div class="fact-item">
            <span>Стоимость</span>
            <strong>После диагностики</strong>
          </div>
          <div class="fact-item">
            <span>Время работы</span>
            <strong>${service.durationText}</strong>
          </div>
        </div>

        ${actionPair({
          whatsappText: config.waText.service(service.title.toLowerCase()),
        })}
      </div>
    </section>

    <section class="section section-tint">
      <div class="container">
        <div class="two-col">
          <div>
            ${sectionHead('Когда нужно', ['С чем', 'приезжают'])}
            <ul class="check-list">
              ${service.symptoms.map((symptom) => html`<li>${symptom}</li>`)}
            </ul>
          </div>
          <div>
            ${sectionHead('Что входит', ['Состав', 'работ'])}
            <ul class="check-list">
              ${service.included.map((item) => html`<li>${item}</li>`)}
            </ul>
          </div>
        </div>
      </div>
    </section>

    <section class="section section-deep">
      <div class="container narrow">
        ${sectionHead(
          'Стоимость',
          ['Почему цена', 'после осмотра'],
          'Стоимость зависит от марки, модели, года и состояния автомобиля. ' +
            'Мастер называет её и объём работ до начала ремонта — работы выполняются только после вашего согласия.'
        )}
        <p class="page-text">
          Ориентир по времени: ${service.durationText}. Точный срок мастер назовёт
          после осмотра — он зависит от состояния узлов и наличия деталей.
          Звоните или пишите, если нужна оценка по вашей ситуации.
        </p>
        ${actionPair({ whatsappText: config.waText.service(service.title.toLowerCase()) })}
      </div>
    </section>

    ${service.faq && service.faq.length
      ? html`
          <section class="section section-tint">
            <div class="container narrow">
              ${sectionHead('Вопросы по работе', ['Что ещё', 'спрашивают'])}
              <div class="faq-list">
                ${service.faq.map(
                  (item) => html`
                    <details class="faq-item">
                      <summary>
                        <span>${item.q}</span>
                        <span class="faq-icon" aria-hidden="true">${icon('plus', { size: 18 })}</span>
                      </summary>
                      <div class="faq-answer"><p>${item.a}</p></div>
                    </details>
                  `
                )}
              </div>
            </div>
          </section>
        `
      : ''}

    ${related.length
      ? html`
          <section class="section section-tint">
            <div class="container">
              ${sectionHead('Рядом по смыслу', ['Другие работы', 'по этому направлению'])}
              <ul class="check-list">
                ${related.map(
                  (item) => html`<li>
                    <a href="/services/${esc(item.slug)}">${item.title}</a>
                  </li>`
                )}
              </ul>
            </div>
          </section>
        `
      : ''}

    <section class="section section-band final-cta">
      <div class="container narrow final-cta-inner">
        <h2 class="final-cta-title">
          <span class="ttl-line">Нужна эта работа?</span>
          <span class="ttl-line is-accent">Позвоните или напишите</span>
        </h2>
        <p class="final-cta-text">
          Расскажите, что происходит с автомобилем, — подскажем, с чего начать,
          и назовём время визита. Можно приехать и без звонка.
        </p>
        ${actionPair({ whatsappText: config.waText.service(service.title.toLowerCase()) })}
        <p class="final-cta-meta">${b.addressShort} · ${b.hoursText}</p>
      </div>
    </section>
  `;

  return layout({
    title: `${service.title} в Актау — ${b.name}`,
    description: `${service.summary} Автосервис ${b.name}, ${b.addressShort}. Стоимость — после осмотра, до начала работ.`,
    path: `/services/${service.slug}`,
    activePath: '/services',
    image: '/img/directions2.jpg',
    schema: seo.schemaScript({
      path: `/services/${service.slug}`,
      title: `${service.title} — ${b.name}`,
      description: service.summary,
      service: {
        title: service.title,
        summary: service.summary,
        priceFrom: service.priceFrom,
      },
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
