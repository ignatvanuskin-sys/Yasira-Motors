'use strict';

/**
 * Страница онлайн-записи /booking — шестишаговый мастер.
 *
 * Разметка отдаётся целиком на сервере (работает без JS на первом шаге),
 * переключение шагов и загрузка слотов — на клиенте.
 *
 * Экран успеха — отдельный адрес /booking/success?code=YM-00001,
 * поэтому он переживает перезагрузку страницы и не ломается при возврате
 * кнопкой «назад».
 */

const { html, esc, raw } = require('../lib/html');
const { icon } = require('./icons');
const { layout } = require('./layout');
const { sectionHead, contactActions } = require('./partials');
const config = require('../config');
const { servicesByCategory } = require('../content/services');
const seo = require('../lib/seo');

const STEPS = [
  { n: 1, label: 'Услуга' },
  { n: 2, label: 'Автомобиль' },
  { n: 3, label: 'Дата' },
  { n: 4, label: 'Время' },
  { n: 5, label: 'Контакты' },
  { n: 6, label: 'Проверка' },
];

/**
 * @param {{preselectedService?:string}} options
 */
function renderBooking(options = {}) {
  const b = config.business;

  const body = html`
    <section class="page-head page-head-booking">
      <div class="container">
        <nav class="breadcrumbs" aria-label="Хлебные крошки">
          <a href="/">Главная</a>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Запись на обслуживание</span>
        </nav>
        <h1 class="page-title">Онлайн-запись в YASIRA MOTORS</h1>
        <p class="page-text">
          Шесть коротких шагов. Обязательных полей минимум: услуга, дата и время,
          имя и телефон. Марка и модель автомобиля помогут мастеру подготовиться,
          но их можно не заполнять.
        </p>
      </div>
    </section>

    <section class="section booking-page">
      <div class="container booking-page-layout">
        <div class="wizard" data-wizard data-preselect="${options.preselectedService || ''}">
          <ol class="wizard-steps" data-wizard-steps aria-label="Шаги записи">
            ${STEPS.map(
              (step) => html`
                <li
                  class="wizard-step${step.n === 1 ? ' is-active' : ''}"
                  data-step="${step.n}"
                  ${raw(step.n === 1 ? 'aria-current="step"' : '')}
                >
                  <span class="wizard-step-num">${step.n}</span>
                  <span class="wizard-step-label">${step.label}</span>
                </li>
              `
            )}
          </ol>

          <form class="wizard-form form" data-booking-form novalidate>
            <!-- ШАГ 1: услуга -->
            <fieldset class="wizard-panel" data-panel="1">
              <legend class="wizard-panel-title">Выберите услугу</legend>
              <p class="wizard-panel-hint">
                Не уверены, что нужно? Выберите «Компьютерная диагностика» — мастер
                определит причину и предложит работы.
              </p>
              <div class="service-picker">
                ${servicesByCategory().map(
                  (group) => html`
                    <div class="service-picker-group">
                      <h3 class="service-picker-title">${group.name}</h3>
                      <div class="service-picker-items">
                        ${group.items.map(
                          (s) => html`
                            <label class="service-option">
                              <input
                                type="radio"
                                name="serviceSlug"
                                value="${s.slug}"
                                ${raw(options.preselectedService === s.slug ? 'checked' : '')}
                              >
                              <span class="service-option-body">
                                <span class="service-option-icon" aria-hidden="true">${icon(s.icon, {
                                  size: 22,
                                })}</span>
                                <span class="service-option-text">
                                  <strong>${s.title}</strong>
                                  <span>${s.summary}</span>
                                  <span class="service-option-meta">${s.durationText}</span>
                                </span>
                              </span>
                            </label>
                          `
                        )}
                      </div>
                    </div>
                  `
                )}
              </div>
              <p class="field-error" data-error-for="serviceSlug" hidden></p>
              <div class="wizard-nav">
                <span></span>
                <button class="btn btn-primary" type="button" data-next="2">
                  Далее ${icon('arrowRight', { size: 18 })}
                </button>
              </div>
            </fieldset>

            <!-- ШАГ 2: автомобиль -->
            <fieldset class="wizard-panel" data-panel="2" hidden>
              <legend class="wizard-panel-title">Автомобиль</legend>
              <p class="wizard-panel-hint">
                Поля ниже необязательные — но с ними мастер подготовится заранее.
              </p>
              <div class="field-row">
                <div class="field">
                  <label for="w-brand">Марка</label>
                  <input type="text" id="w-brand" name="brand" placeholder="Toyota" autocomplete="off">
                  <p class="field-error" data-error-for="brand" hidden></p>
                </div>
                <div class="field">
                  <label for="w-model">Модель</label>
                  <input type="text" id="w-model" name="model" placeholder="Camry" autocomplete="off">
                  <p class="field-error" data-error-for="model" hidden></p>
                </div>
              </div>
              <div class="field-row">
                <div class="field">
                  <label for="w-year">Год выпуска</label>
                  <input type="text" id="w-year" name="year" inputmode="numeric" placeholder="2020" maxlength="4">
                  <p class="field-error" data-error-for="year" hidden></p>
                </div>
                <div class="field">
                  <label for="w-plate">Госномер <span class="muted">(необязательно)</span></label>
                  <input type="text" id="w-plate" name="plate" placeholder="123 ABC 12" autocomplete="off">
                  <p class="field-error" data-error-for="plate" hidden></p>
                </div>
              </div>
              <div class="wizard-nav">
                <button class="btn btn-ghost" type="button" data-back="1">
                  ${icon('arrowLeft', { size: 18 })} Назад
                </button>
                <button class="btn btn-primary" type="button" data-next="3">
                  Далее ${icon('arrowRight', { size: 18 })}
                </button>
              </div>
            </fieldset>

            <!-- ШАГ 3: дата -->
            <fieldset class="wizard-panel" data-panel="3" hidden>
              <legend class="wizard-panel-title">Выберите дату</legend>
              <p class="wizard-panel-hint">
                Запись открыта на ${config.booking.horizonDays} дней вперёд.
                Серые дни — выходные или нет свободного времени.
              </p>
              <div class="calendar" data-calendar aria-live="polite">
                <p class="calendar-loading">Загружаем доступные даты…</p>
              </div>
              <p class="field-error" data-error-for="date" hidden></p>
              <div class="wizard-nav">
                <button class="btn btn-ghost" type="button" data-back="2">
                  ${icon('arrowLeft', { size: 18 })} Назад
                </button>
                <button class="btn btn-primary" type="button" data-next="4" data-requires="date">
                  Далее ${icon('arrowRight', { size: 18 })}
                </button>
              </div>
            </fieldset>

            <!-- ШАГ 4: время -->
            <fieldset class="wizard-panel" data-panel="4" hidden>
              <legend class="wizard-panel-title">Выберите время</legend>
              <p class="wizard-panel-hint" data-slots-hint>
                Показываем только свободное время выбранной даты.
              </p>
              <div class="slots" data-slots aria-live="polite">
                <p class="slots-loading">Сначала выберите дату.</p>
              </div>
              <p class="field-error" data-error-for="time" hidden></p>
              <div class="wizard-nav">
                <button class="btn btn-ghost" type="button" data-back="3">
                  ${icon('arrowLeft', { size: 18 })} Назад
                </button>
                <button class="btn btn-primary" type="button" data-next="5" data-requires="time">
                  Далее ${icon('arrowRight', { size: 18 })}
                </button>
              </div>
            </fieldset>

            <!-- ШАГ 5: контакты -->
            <fieldset class="wizard-panel" data-panel="5" hidden>
              <legend class="wizard-panel-title">Как с вами связаться</legend>
              <p class="wizard-panel-hint">
                Администратор позвонит, чтобы подтвердить запись и назвать стоимость.
              </p>
              <div class="field">
                <label for="w-name">Имя</label>
                <input type="text" id="w-name" name="name" autocomplete="name" required placeholder="Как к вам обращаться">
                <p class="field-error" data-error-for="name" hidden></p>
              </div>
              <div class="field">
                <label for="w-phone">Телефон</label>
                <input type="tel" id="w-phone" name="phone" autocomplete="tel" required placeholder="+7 777 000 00 00" data-phone-input>
                <p class="field-error" data-error-for="phone" hidden></p>
              </div>
              <div class="field">
                <label for="w-notes">Комментарий <span class="muted">(необязательно)</span></label>
                <textarea id="w-notes" name="notes" rows="3" placeholder="Опишите симптом: когда появился, на что обратить внимание"></textarea>
              </div>
              <p class="form-legal">
                Оставляя заявку, вы соглашаетесь на обработку контактных данных
                для подтверждения записи.
              </p>
              <div class="wizard-nav">
                <button class="btn btn-ghost" type="button" data-back="4">
                  ${icon('arrowLeft', { size: 18 })} Назад
                </button>
                <button class="btn btn-primary" type="button" data-next="6" data-validate-contact>
                  Далее ${icon('arrowRight', { size: 18 })}
                </button>
              </div>
            </fieldset>

            <!-- ШАГ 6: проверка -->
            <fieldset class="wizard-panel" data-panel="6" hidden>
              <legend class="wizard-panel-title">Проверьте запись</legend>
              <div class="summary" data-summary></div>
              <p class="form-legal">
                Отправляя заявку, вы подтверждаете, что данные указаны верно.
                Запись окончательно подтвердит администратор по телефону.
              </p>
              <div class="wizard-nav">
                <button class="btn btn-ghost" type="button" data-back="5">
                  ${icon('arrowLeft', { size: 18 })} Изменить данные
                </button>
                <button class="btn btn-primary btn-lg" type="submit" data-submit>
                  ${icon('check', { size: 20 })} Подтвердить запись
                </button>
              </div>
            </fieldset>

            <div class="form-status" data-form-status role="status" aria-live="polite"></div>
          </form>
        </div>

        <aside class="booking-aside">
          <div class="aside-card">
            <h2 class="aside-title">${b.name}</h2>
            <ul class="aside-list">
              <li>${icon('map', { size: 18 })} ${b.address}</li>
              <li>${icon('clock', { size: 18 })} ${b.hoursText}</li>
              <li>
                ${icon('phone', { size: 18 })}
                <a href="tel:${b.phone.replace(/[^\d+]/g, '')}">${b.phone}</a>
              </li>
              <li>${icon('card', { size: 18 })} ${b.payments.join(' · ')}</li>
            </ul>
          </div>

          <div class="aside-card">
            <h2 class="aside-title">Что дальше</h2>
            <ol class="aside-steps">
              <li>Заявка уходит администратору сразу после отправки.</li>
              <li>Администратор звонит и подтверждает время.</li>
              <li>Вы приезжаете в сервис к согласованному времени.</li>
              <li>Мастер осматривает автомобиль и называет стоимость до начала работ.</li>
            </ol>
          </div>

          <div class="aside-card aside-card-accent">
            <h2 class="aside-title">Удобнее позвонить?</h2>
            <p class="aside-text">
              Если не хотите заполнять форму — позвоните или напишите в WhatsApp,
              и мы запишем вас сами.
            </p>
            ${contactActions()}
          </div>
        </aside>
      </div>
    </section>

    <section class="section section-muted">
      <div class="container narrow">
        ${sectionHead('Если что-то изменилось', 'Перенос и отмена записи')}
        <p class="page-text">
          Запись можно перенести или отменить — без штрафов. Позвоните по телефону
          ${b.phone} или напишите в WhatsApp, назовите имя и удобное время.
          Если вы не сможете приехать, лучше сообщить заранее: этим вы освободите
          время для другого клиента.
        </p>
      </div>
    </section>
  `;

  return layout({
    title: `Онлайн-запись на обслуживание — ${config.business.name}, Актау`,
    description:
      'Запишитесь в автосервис YASIRA MOTORS онлайн: выберите услугу, дату и время. ' +
      'Актау, 25-й микрорайон, 52/2. Администратор подтвердит запись по телефону.',
    path: '/booking',
    activePath: '/booking',
    noindex: false,
    schema: seo.schemaScript({
      path: '/booking',
      title: 'Онлайн-запись в автосервис YASIRA MOTORS',
      description: 'Онлайн-запись на обслуживание автомобиля в Актау.',
      breadcrumbs: [
        { name: 'Главная', url: '/' },
        { name: 'Запись', url: '/booking' },
      ],
    }),
    body,
  });
}

/**
 * Экран успеха после отправки заявки.
 * @param {{booking:object, notFound?:boolean}} options
 */
function renderBookingSuccess(options) {
  const b = config.business;
  const booking = options.booking;

  const body = options.notFound
    ? html`
        <section class="section success-section">
          <div class="container narrow success-inner">
            <span class="success-icon success-icon-warn" aria-hidden="true">${icon('info', {
              size: 40,
            })}</span>
            <h1 class="success-title">Запись не найдена</h1>
            <p class="success-text">
              Возможно, ссылка устарела. Позвоните нам — найдём вашу заявку по номеру телефона.
            </p>
            ${contactActions()}
          </div>
        </section>
      `
    : html`
        <section class="section success-section">
          <div class="container narrow success-inner">
            <span class="success-icon" aria-hidden="true">${icon('check', { size: 40 })}</span>
            <h1 class="success-title">Запись принята</h1>
            <p class="success-text">
              Мы получили вашу заявку. Администратор свяжется с вами по указанному
              телефону, чтобы подтвердить время и уточнить стоимость работ.
            </p>

            <div class="summary summary-success">
              <div class="summary-row">
                <span>Номер записи</span><strong>${booking.publicId}</strong>
              </div>
              <div class="summary-row">
                <span>Услуга</span><strong>${booking.serviceTitle}</strong>
              </div>
              ${booking.vehicleText
                ? html`<div class="summary-row">
                    <span>Автомобиль</span><strong>${booking.vehicleText}</strong>
                  </div>`
                : ''}
              <div class="summary-row">
                <span>Дата</span><strong>${booking.fullDate}</strong>
              </div>
              <div class="summary-row">
                <span>Время</span><strong>${booking.time}</strong>
              </div>
              <div class="summary-row">
                <span>Имя</span><strong>${booking.customerName}</strong>
              </div>
              <div class="summary-row">
                <span>Телефон</span><strong>${booking.customerPhoneDisplay || booking.customerPhone}</strong>
              </div>
              <div class="summary-row">
                <span>Статус</span><strong>${booking.statusLabel}</strong>
              </div>
            </div>

            <div class="success-contacts">
              <h2 class="aside-title">Контакты сервиса</h2>
              <ul class="aside-list">
                <li>${icon('map', { size: 18 })} ${b.address}</li>
                <li>${icon('clock', { size: 18 })} ${b.hoursText}</li>
                <li>
                  ${icon('phone', { size: 18 })}
                  <a href="tel:${b.phone.replace(/[^\d+]/g, '')}">${b.phone}</a>
                </li>
              </ul>
              <p class="success-note">
                Сохраните номер записи <strong>${booking.publicId}</strong> — по нему
                администратор быстро найдёт вашу заявку.
              </p>
            </div>

            ${contactActions({ withRoute: true })}

            <div class="success-actions">
              <a class="btn btn-ghost" href="/">На главную</a>
              <a class="btn btn-ghost" href="/booking">Записаться ещё раз</a>
            </div>
          </div>
        </section>
      `;

  return layout({
    title: options.notFound
      ? `Запись не найдена — ${b.name}`
      : `Запись ${booking ? booking.publicId : ''} принята — ${b.name}`,
    description: 'Подтверждение онлайн-записи в автосервис YASIRA MOTORS, Актау.',
    path: '/booking/success',
    activePath: '/booking',
    noindex: true,
    body,
  });
}

module.exports = { renderBooking, renderBookingSuccess };
