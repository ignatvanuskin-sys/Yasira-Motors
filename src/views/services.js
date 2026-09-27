'use strict';

/**
 * Страница каталога услуг /services.
 */

const { html } = require('../lib/html');
const { icon } = require('./icons');
const { layout } = require('./layout');
const { serviceCard, sectionHead, faqList, contactActions } = require('./partials');
const config = require('../config');
const { SERVICES, servicesByCategory, SYMPTOM_MAP } = require('../content/services');
const { FAQ } = require('../content/faq');
const seo = require('../lib/seo');

function renderServices() {
  const groups = servicesByCategory();

  const body = html`
    <section class="page-head">
      <div class="container">
        <nav class="breadcrumbs" aria-label="Хлебные крошки">
          <a href="/">Главная</a>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Услуги</span>
        </nav>
        <h1 class="page-title">Услуги автосервиса YASIRA MOTORS</h1>
        <p class="page-text">
          Направления работ, заявленные компанией в карточке 2ГИС и на официальном сайте:
          от компьютерной диагностики и планового обслуживания до ремонта двигателя,
          коробок передач и автоэлектрики. ${SERVICES.length} направлений.
        </p>
        <div class="page-actions">
          <a class="btn btn-primary" href="/booking">${icon('calendar', { size: 18 })} Записаться</a>
          <a class="btn btn-ghost" href="#selector">Подобрать услугу</a>
        </div>
      </div>
    </section>

    <section class="section" id="catalog">
      <div class="container">
        ${groups.map(
          (group) => html`
            <div class="catalog-group" id="${group.name
              .toLowerCase()
              .replace(/[^a-zа-я0-9]+/gi, '-')}">
              <h2 class="catalog-title">${group.name}</h2>
              <div class="services-grid">
                ${group.items.map((s) => serviceCard(s))}
              </div>
            </div>
          `
        )}
      </div>
    </section>

    <section class="section selector-section" id="selector">
      <div class="container">
        ${sectionHead(
          'Подбор услуги',
          'Не знаете, с чего начать?',
          'Выберите симптом — подскажем вероятное направление работ.'
        )}
        <div class="selector" data-selector>
          <label class="selector-label" for="selector-symptom-2">Что вас беспокоит?</label>
          <div class="selector-control">
            <select id="selector-symptom-2" data-selector-input>
              <option value="">Выберите симптом или задачу</option>
              ${SYMPTOM_MAP.map((s) => html`<option value="${s.slug}">${s.text}</option>`)}
            </select>
            <button class="btn btn-primary" type="button" data-selector-go>Подобрать</button>
          </div>
          <div class="selector-result" data-selector-result hidden></div>
          <p class="selector-hint">
            ${icon('info', { size: 16 })}
            Подсказка не заменяет диагностику: точную причину мастер определит после осмотра.
          </p>
        </div>
      </div>
    </section>

    <section class="section faq-section">
      <div class="container narrow">
        ${sectionHead('Вопросы об услугах', 'Частые вопросы')}
        ${faqList(FAQ.slice(0, 8))}
      </div>
    </section>

    <section class="final-cta">
      <div class="container final-cta-inner">
        <h2 class="final-cta-title">Не нашли нужную услугу?</h2>
        <p class="final-cta-text">
          Позвоните — уточним, выполняем ли мы эту работу и сколько она будет стоить.
        </p>
        ${contactActions()}
      </div>
    </section>
  `;

  return layout({
    title: `Услуги автосервиса в Актау — ${config.business.name}`,
    description:
      'Полный список услуг YASIRA MOTORS в Актау: компьютерная диагностика, замена масла, ' +
      'развал-схождение, ремонт ходовой части, двигателя, АКПП и МКПП, автоэлектрика, шиномонтаж, масла и автохимия.',
    path: '/services',
    activePath: '/services',
    schema: seo.schemaScript({
      path: '/services',
      title: 'Услуги автосервиса YASIRA MOTORS',
      description: 'Каталог услуг автосервиса в Актау.',
      breadcrumbs: [
        { name: 'Главная', url: '/' },
        { name: 'Услуги', url: '/services' },
      ],
    }),
    body,
  });
}

module.exports = { renderServices };
