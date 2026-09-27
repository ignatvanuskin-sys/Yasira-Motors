'use strict';

/**
 * Страницы 404 и 500.
 * Тексты — человеческие: без кодов ошибок и технических подробностей.
 */

const { html } = require('../lib/html');
const { icon } = require('./icons');
const { layout } = require('./layout');
const { contactActions } = require('./partials');
const config = require('../config');

function renderNotFound(path) {
  const body = html`
    <section class="section error-section">
      <div class="container narrow error-inner">
        <span class="error-code" aria-hidden="true">404</span>
        <h1 class="error-title">Такой страницы нет</h1>
        <p class="error-text">
          Возможно, ссылка устарела или в адресе опечатка. Зато у нас есть
          услуги, контакты и запись на обслуживание — они точно на месте.
        </p>
        <div class="error-actions">
          <a class="btn btn-primary" href="/">На главную</a>
          <a class="btn btn-ghost" href="/services">Услуги</a>
          <a class="btn btn-ghost" href="/booking">Записаться</a>
        </div>
        ${contactActions()}
      </div>
    </section>
  `;
  return layout({
    title: `Страница не найдена — ${config.business.name}`,
    description: 'Страница не найдена. Перейдите к услугам или запишитесь на обслуживание.',
    path: path || '/404',
    noindex: true,
    body,
  });
}

function renderServerError() {
  const body = html`
    <section class="section error-section">
      <div class="container narrow error-inner">
        <span class="error-code" aria-hidden="true">${icon('alert', { size: 48 })}</span>
        <h1 class="error-title">Что-то пошло не так</h1>
        <p class="error-text">
          Не удалось открыть страницу. Попробуйте обновить её через минуту —
          или позвоните нам, мы поможем.
        </p>
        <div class="error-actions">
          <a class="btn btn-primary" href="/">На главную</a>
          <a class="btn btn-ghost" href="/booking">Записаться по телефону</a>
        </div>
        ${contactActions()}
      </div>
    </section>
  `;
  return layout({
    title: `Ошибка — ${config.business.name}`,
    description: 'Не удалось открыть страницу.',
    path: '/error',
    noindex: true,
    body,
  });
}

module.exports = { renderNotFound, renderServerError };
