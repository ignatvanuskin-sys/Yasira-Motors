'use strict';

/**
 * Админка /dashboard.
 *
 * Разделы: «Сегодня», «Календарь», «Услуги», «Расписание».
 * Доступ — только по паролю из ADMIN_PASSWORD (см. lib/session.js).
 */

const { html, raw, esc } = require('../lib/html');
const { icon } = require('./icons');
const config = require('../config');
const { SERVICES, servicesByCategory } = require('../content/services');
const bookingLib = require('../lib/booking');

/** Русская форма слова по числу: 1 запись, 2 записи, 5 записей. */
function plural(count, forms) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
  return forms[2];
}

/** Подпись для плитки статистики. */
function statLabel(count, forms) {
  return `${count} ${plural(count, forms)}`;
}

const STATUS_TONE = {
  PENDING: 'warn',
  CONFIRMED: 'ok',
  COMPLETED: 'ok',
  CANCELLED: 'muted',
};

/** Экран входа. */
function renderLogin(options = {}) {
  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Вход в панель — ${esc(config.business.name)}</title>
<meta name="robots" content="noindex, nofollow">
<link rel="stylesheet" href="/css/style.css">
</head>
<body class="admin-body">
<main class="admin-login">
  <form class="admin-login-card form" method="post" action="/dashboard/login">
    <div class="brand brand-static">
      <span class="brand-mark" aria-hidden="true">${icon('gauge', { size: 22 })}</span>
      <span class="brand-text">
        <span class="brand-name">YASIRA</span>
        <span class="brand-sub">MOTORS · панель</span>
      </span>
    </div>
    <h1 class="admin-login-title">Вход для администратора</h1>
    ${options.error ? `<p class="admin-error">${esc(options.error)}</p>` : ''}
    <div class="field">
      <label for="password">Пароль</label>
      <input type="password" id="password" name="password" autocomplete="current-password" required autofocus>
    </div>
    <button class="btn btn-primary btn-block" type="submit">Войти</button>
    <p class="form-legal">Доступ только для сотрудников сервиса.</p>
  </form>
</main>
</body>
</html>`;
}

/** Карточка одной записи для списка. */
function bookingRow(booking) {
  return html`
    <article class="admin-booking" data-booking-id="${booking.id}">
      <div class="admin-booking-time">
        <strong>${booking.time}</strong>
        <span>${booking.numericDate}</span>
      </div>
      <div class="admin-booking-body">
        <div class="admin-booking-main">
          <strong>${booking.customerName || '—'}</strong>
          <a href="tel:${(booking.customerPhone || '').replace(/[^\d+]/g, '')}">${booking.customerPhoneDisplay ||
            booking.customerPhone ||
            ''}</a>
        </div>
        <div class="admin-booking-meta">
          <span>${icon('tool', { size: 16 })} ${booking.serviceTitle}</span>
          ${booking.vehicleText
            ? html`<span>${icon('car', { size: 16 })} ${booking.vehicleText}${
                booking.vehicle && booking.vehicle.plate ? ` · ${booking.vehicle.plate}` : ''
              }</span>`
            : ''}
          <span>${icon('doc', { size: 16 })} ${booking.publicId}</span>
        </div>
        ${booking.notes ? html`<p class="admin-booking-note">${booking.notes}</p>` : ''}
      </div>
      <div class="admin-booking-actions">
        <span class="status status-${STATUS_TONE[booking.status] || 'muted'}">${booking.statusLabel}</span>
        <div class="admin-buttons">
          ${booking.status !== bookingLib.STATUS.CONFIRMED && booking.status !== bookingLib.STATUS.COMPLETED
            ? html`<button type="button" class="btn btn-xs btn-primary" data-status="${bookingLib.STATUS.CONFIRMED}" data-id="${booking.id}">Подтвердить</button>`
            : ''}
          ${booking.status !== bookingLib.STATUS.COMPLETED && booking.status !== bookingLib.STATUS.CANCELLED
            ? html`<button type="button" class="btn btn-xs btn-ghost" data-status="${bookingLib.STATUS.COMPLETED}" data-id="${booking.id}">Выполнена</button>`
            : ''}
          ${booking.status !== bookingLib.STATUS.CANCELLED
            ? html`<button type="button" class="btn btn-xs btn-danger" data-status="${bookingLib.STATUS.CANCELLED}" data-id="${booking.id}">Отменить</button>`
            : html`<button type="button" class="btn btn-xs btn-ghost" data-status="${bookingLib.STATUS.PENDING}" data-id="${booking.id}">Вернуть</button>`}
        </div>
      </div>
    </article>
  `;
}

/**
 * @param {{
 *   tab:string, summary:object, bookings:object[], date:string,
 *   filter?:{status?:string[], query?:string}, schedule?:object[], message?:string
 * }} data
 */
function renderDashboard(data) {
  const tabs = [
    { id: 'today', label: 'Сегодня', icon: 'home' },
    { id: 'calendar', label: 'Календарь', icon: 'calendar' },
    { id: 'services', label: 'Услуги', icon: 'tool' },
    { id: 'slots', label: 'Расписание', icon: 'clock' },
  ];
  const active = data.tab || 'today';

  const day = bookingLib.dayAvailability(data.date);

  const content =
    active === 'services'
      ? html`
          <section class="admin-panel">
            <h2 class="admin-title">Услуги в каталоге</h2>
            <p class="admin-hint">
              Список услуг хранится в коде (${esc('src/content/services.js')}) — это гарантирует,
              что на сайте нет случайных изменений. Ниже — что сейчас опубликовано.
              Чтобы изменить состав, добавьте или отредактируйте услугу в каталоге.
            </p>
            ${servicesByCategory().map(
              (group) => html`
                <div class="admin-group">
                  <h3 class="admin-subtitle">${group.name} <span class="muted">${group.items.length}</span></h3>
                  <div class="admin-table">
                    <div class="admin-table-head">
                      <span>Услуга</span><span>Длительность</span><span>Цена</span><span>Записей</span>
                    </div>
                    ${group.items.map((s) => {
                      const count = data.bookings.filter((b) => b.serviceId === s.slug).length;
                      return html`
                        <div class="admin-table-row">
                          <span>
                            <a href="/services/${s.slug}" target="_blank" rel="noopener">${s.title}</a>
                            <span class="muted">${s.source}</span>
                          </span>
                          <span>${s.durationText}</span>
                          <span>${s.priceFrom ? `от ${s.priceFrom} ₸` : 'по запросу'}</span>
                          <span>${count}</span>
                        </div>
                      `;
                    })}
                  </div>
                </div>
              `
            )}
          </section>
        `
      : active === 'slots'
        ? html`
            <section class="admin-panel">
              <h2 class="admin-title">Рабочее расписание</h2>
              <p class="admin-hint">
                Базовый график: ${esc(config.business.hoursText)}. Ёмкость слота —
                ${config.booking.capacity} ${config.booking.capacity === 1 ? 'автомобиль' : 'автомобиля'}.
                Шаг сетки — ${config.booking.slotMinutes} мин.
              </p>
              <form class="admin-form" method="post" action="/dashboard/schedule">
                <div class="field-row">
                  <div class="field">
                    <label for="s-date">Дата</label>
                    <input type="date" id="s-date" name="date" value="${data.date}" required>
                  </div>
                  <div class="field">
                    <label for="s-open">Открытие</label>
                    <input type="time" id="s-open" name="open" value="${day.open || '09:00'}">
                  </div>
                  <div class="field">
                    <label for="s-close">Закрытие</label>
                    <input type="time" id="s-close" name="close" value="${day.close || '20:00'}">
                  </div>
                  <div class="field">
                    <label for="s-capacity">Приёмка, авто</label>
                    <input type="number" id="s-capacity" name="capacity" min="1" max="20" value="${day.capacity || config.booking.capacity}">
                  </div>
                </div>
                <div class="field">
                  <label for="s-note">Комментарий</label>
                  <input type="text" id="s-note" name="note" placeholder="Например: сокращённый день">
                </div>
                <div class="admin-buttons">
                  <button class="btn btn-primary btn-sm" type="submit" name="action" value="save">Сохранить день</button>
                  <button class="btn btn-danger btn-sm" type="submit" name="action" value="close">Закрыть день</button>
                  <button class="btn btn-ghost btn-sm" type="submit" name="action" value="reopen">Вернуть обычный график</button>
                </div>
              </form>

              <h3 class="admin-subtitle">Слоты на ${esc(data.date)}</h3>
              ${day.closed
                ? html`<p class="admin-empty">${day.note || 'День закрыт'}</p>`
                : html`
                    <div class="admin-slots">
                      ${day.slots.map(
                        (slot) => html`
                          <span class="admin-slot${slot.available ? ' is-free' : ' is-taken'}">
                            ${slot.time}
                            <small>${slot.available ? 'свободно' : `занято ${slot.taken}/${slot.capacity}`}</small>
                          </span>
                        `
                      )}
                    </div>
                  `}

              <h3 class="admin-subtitle">Переопределения графика</h3>
              ${
                (data.schedule || []).length
                  ? html`<ul class="admin-list">
                      ${data.schedule.map(
                        (o) => html`
                          <li>
                            <strong>${o.date}</strong>
                            ${o.closed
                              ? html`<span class="status status-muted">закрыт</span>`
                              : html`<span>${o.open}–${o.close}</span>`}
                            ${o.capacity ? html`<span class="muted">приёмка ${o.capacity}</span>` : ''}
                            ${o.note ? html`<span class="muted">${o.note}</span>` : ''}
                          </li>
                        `
                      )}
                    </ul>`
                  : html`<p class="admin-empty">Переопределений нет — действует базовый график.</p>`
              }
            </section>
          `
        : html`
            <section class="admin-panel">
              <div class="admin-toolbar">
                <form class="admin-filter" method="get" action="/dashboard">
                  <input type="hidden" name="tab" value="${active}">
                  ${active === 'calendar'
                    ? html`<input type="date" name="date" value="${data.date}">`
                    : html`<input type="hidden" name="date" value="${data.date}">`}
                  <input type="search" name="q" value="${(data.filter && data.filter.query) || ''}" placeholder="Имя, телефон, авто, номер">
                  <select name="status">
                    <option value="">Все статусы</option>
                    ${Object.entries(bookingLib.STATUS_LABELS).map(
                      ([value, label]) => html`
                        <option value="${value}"${raw(
                          data.filter && data.filter.status && data.filter.status[0] === value
                            ? ' selected'
                            : ''
                        )}>${label}</option>
                      `
                    )}
                  </select>
                  <button class="btn btn-sm btn-ghost" type="submit">Показать</button>
                </form>
              </div>

              ${
                active === 'calendar'
                  ? html`<h2 class="admin-title">Записи на ${bookingLib.fullDate(data.date)}</h2>`
                  : html`<h2 class="admin-title">Записи на сегодня — ${bookingLib.fullDate(data.date)}</h2>`
              }

              ${
                data.bookings.length
                  ? html`<div class="admin-bookings">${data.bookings.map(bookingRow)}</div>`
                  : html`<p class="admin-empty">
                      Записей нет. Когда клиент оформит заявку на сайте, она появится здесь.
                    </p>`
              }
            </section>
          `;

  const body = html`
    <div class="admin-shell">
      <header class="admin-header">
        <div class="container admin-header-inner">
          <div class="brand brand-static">
            <span class="brand-mark" aria-hidden="true">${icon('gauge', { size: 20 })}</span>
            <span class="brand-text">
              <span class="brand-name">YASIRA</span>
              <span class="brand-sub">MOTORS · панель</span>
            </span>
          </div>
          <div class="admin-header-actions">
            <a class="btn btn-xs btn-ghost" href="/" target="_blank" rel="noopener">Открыть сайт</a>
            <form method="post" action="/dashboard/logout" class="inline-form">
              <button class="btn btn-xs btn-ghost" type="submit">Выйти</button>
            </form>
          </div>
        </div>
      </header>

      <div class="container">
        <ul class="admin-stats">
          <li>
            <strong>${data.summary.todayCount}</strong>
            <span>${statLabel(data.summary.todayCount, ['запись на сегодня', 'записи на сегодня', 'записей на сегодня'])}</span>
          </li>
          <li>
            <strong>${data.summary.todayPending}</strong>
            <span>${statLabel(data.summary.todayPending, ['ждёт подтверждения', 'ждут подтверждения', 'ждут подтверждения'])}</span>
          </li>
          <li>
            <strong>${data.summary.upcoming}</strong>
            <span>${statLabel(data.summary.upcoming, ['предстоящая', 'предстоящие', 'предстоящих'])}</span>
          </li>
          <li>
            <strong>${data.summary.customers}</strong>
            <span>${statLabel(data.summary.customers, ['клиент в базе', 'клиента в базе', 'клиентов в базе'])}</span>
          </li>
          <li>
            <strong>${data.summary.total}</strong>
            <span>${statLabel(data.summary.total, ['заявка всего', 'заявки всего', 'заявок всего'])}</span>
          </li>
        </ul>

        <nav class="admin-tabs" aria-label="Разделы панели">
          ${tabs.map(
            (tab) => html`
              <a
                class="admin-tab${tab.id === active ? ' is-active' : ''}"
                href="/dashboard?tab=${tab.id}${tab.id === 'calendar'
                  ? html`&date=${data.date}`
                  : ''}"
              >${icon(tab.icon, { size: 18 })} ${tab.label}</a>
            `
          )}
        </nav>

        ${data.message ? html`<p class="admin-message">${data.message}</p>` : ''}
        ${content}
      </div>
    </div>
  `;

  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Панель управления — ${esc(config.business.name)}</title>
<meta name="robots" content="noindex, nofollow">
<link rel="stylesheet" href="/css/style.css">
<script defer src="/js/admin.js"></script>
</head>
<body class="admin-body">
${body}
</body>
</html>`;
}

module.exports = { renderLogin, renderDashboard, bookingRow, STATUS_TONE, SERVICES };
