'use strict';

/**
 * Страницы 404 и 500.
 * Тексты человеческие: без кодов ошибок и технических подробностей.
 */

const { html } = require('../lib/html');
const { layout } = require('./layout');
const { actionPair } = require('./partials');
const config = require('../config');

/** @param {string} path */
function renderNotFound(path) {
  const body = html`
    <section class="section error-section">
      <div class="container narrow error-inner">
        <p class="error-code">СТРАНИЦА НЕ НАЙДЕНА</p>
        <h1 class="error-title">Такой страницы нет</h1>
        <p class="error-text">
          Возможно, ссылка устарела. Быстрее всего — позвонить: подскажем
          по работам и назовём время визита.
        </p>
        ${actionPair({ whatsappText: config.waText.general })}
        <p class="error-text muted">
          ${config.business.addressShort} · ${config.business.hoursText}
        </p>
      </div>
    </section>
  `;

  return layout({
    title: `Страница не найдена — ${config.business.name}`,
    description: 'Страница не найдена. Контакты автосервиса YASIRA MOTORS в Актау.',
    path: path || '/404',
    noindex: true,
    body,
  });
}

function renderError() {
  const body = html`
    <section class="section error-section">
      <div class="container narrow error-inner">
        <p class="error-code">ЧТО-ТО ПОШЛО НЕ ТАК</p>
        <h1 class="error-title">Не удалось открыть страницу</h1>
        <p class="error-text">
          Попробуйте обновить страницу. Если не помогает — позвоните или напишите
          в WhatsApp, ответим и без сайта.
        </p>
        ${actionPair({ whatsappText: config.waText.general })}
      </div>
    </section>
  `;

  return layout({
    title: `Не удалось открыть страницу — ${config.business.name}`,
    description: 'Временная ошибка. Контакты автосервиса YASIRA MOTORS в Актау.',
    path: '/error',
    noindex: true,
    body,
  });
}

module.exports = { renderNotFound, renderError };
