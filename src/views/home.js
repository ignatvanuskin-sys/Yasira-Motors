'use strict';

/**
 * Главная страница.
 *
 * Логика секций: каждая отвечает на конкретный вопрос клиента
 * и двигает его к записи. Секций ровно столько, сколько нужно, —
 * «на всякий случай» блоки не добавляются.
 */

const { html, raw, concat } = require('../lib/html');
const { icon } = require('./icons');
const { layout } = require('./layout');
const {
  serviceCard,
  sectionHead,
  photoBand,
  mapEmbed,
  reviewCard,
  galleryGrid,
  faqList,
  contactActions,
} = require('./partials');
const config = require('../config');
const { SERVICES, servicesByCategory, SYMPTOM_MAP } = require('../content/services');
const { REVIEWS, REVIEW_TOPICS, REVIEW_SOURCE } = require('../content/reviews');
const { GALLERY, HERO_IMAGE } = require('../content/gallery');
const { FAQ } = require('../content/faq');
const seo = require('../lib/seo');

/* ───────────────────────────────── HERO ──────────────────────────────────── */

function hero() {
  const b = config.business;
  return html`
    <section class="hero" id="hero">
      <div class="hero-media" aria-hidden="false">
        <img
          src="/img/${HERO_IMAGE.file}"
          alt="${HERO_IMAGE.alt}"
          width="800"
          height="1000"
          fetchpriority="high"
          decoding="async"
        >
        <span class="hero-media-scrim"></span>
      </div>

      <div class="container hero-inner">
        <p class="hero-kicker">
          ${icon('map', { size: 16 })} ${b.city} · ${b.addressShort}
        </p>

        <h1 class="hero-title">
          Ремонт и обслуживание автомобилей в Актау — <span class="accent">с\u00a0честной диагностикой</span>
        </h1>

        <p class="hero-text">
          Компьютерная диагностика, техническое обслуживание, ремонт двигателя,
          ходовой части, коробок передач и автоэлектрики. Сначала находим причину —
          потом называем цену. Легковые и грузовые автомобили.
        </p>

        <div class="hero-actions">
          <a class="btn btn-primary btn-lg" href="/booking">
            ${icon('calendar', { size: 20 })} Записаться на обслуживание
          </a>
          <a class="btn btn-ghost btn-lg" href="/services">Посмотреть услуги</a>
        </div>

        <ul class="hero-facts">
          <li>
            <strong>${b.rating}</strong>
            <span>рейтинг в 2ГИС<br>${b.ratingsCount} оценок</span>
          </li>
          <li>
            <strong>09:00–20:00</strong>
            <span>Пн–Сб, график работы<br>воскресенье: 10:00–17:00</span>
          </li>
          <li>
            <strong>${b.reviewsCount}</strong>
            <span>отзывов<br>на 2ГИС</span>
          </li>
          <li>
            <strong>${b.parkingCount}</strong>
            <span>парковки рядом<br>остановка «${b.transit.stop}» в ${b.transit.walk}</span>
          </li>
        </ul>
      </div>
    </section>
  `;
}

/* ─────────────────────────────── TRUST BAR ───────────────────────────────── */

function trustBar() {
  const b = config.business;
  const items = [
    {
      icon: 'award',
      value: `${b.rating} из 5`,
      label: `Рейтинг в 2ГИС по ${b.ratingsCount} оценкам`,
    },
    {
      icon: 'users',
      value: `${b.reviewsCount} отзывов`,
      label: `Реальные отзывы клиентов, источник — ${REVIEW_SOURCE.name}`,
    },
    {
      icon: 'box',
      value: '1500+',
      label: 'Наименований масел, смазок и автохимии в наличии',
    },
    {
      icon: 'gauge',
      value: '20 лет',
      label: 'Группа компаний Yasira работает на рынке Казахстана',
    },
    {
      icon: 'card',
      value: '3 способа оплаты',
      label: b.payments.join(' · '),
    },
    {
      icon: 'map',
      value: `${b.transit.walk.split('·')[0].trim()} пешком`,
      label: `От остановки «${b.transit.stop}» до сервиса`,
    },
  ];

  return html`
    <section class="trust-bar" aria-label="Ключевые факты о сервисе">
      <div class="container">
        <ul class="trust-grid">
          ${items.map(
            (item) => html`
              <li class="trust-item">
                <span class="trust-icon" aria-hidden="true">${icon(item.icon, { size: 22 })}</span>
                <div>
                  <strong>${item.value}</strong>
                  <span>${item.label}</span>
                </div>
              </li>
            `
          )}
        </ul>
      </div>
    </section>
  `;
}

/* ──────────────────────────────── SERVICES ───────────────────────────────── */

function servicesSection() {
  const groups = servicesByCategory();
  const popular = SERVICES.filter((s) => s.popular);

  return html`
    <section class="section section-deep services-section" id="services">
      <div class="container">
        ${sectionHead(
          'Услуги',
          ['Что можно сделать', 'в YASIRA MOTORS'],
          'Направления работ заявлены компанией в карточке 2ГИС и на официальном сайте. ' +
            'Выберите категорию, чтобы посмотреть подробности и записаться.'
        )}

        <div class="popular-row">
          <h3 class="popular-title">Часто заказывают</h3>
          <div class="popular-grid">
            ${popular.map((s) => serviceCard(s, { chip: 'category' }))}
          </div>
        </div>

        <div class="category-list">
          ${groups.map(
            (group) => html`
              <div class="category-block">
                <h3 class="category-title">
                  <span>${group.name}</span>
                  <span class="category-count">${group.items.length}</span>
                </h3>
                <ul class="category-items">
                  ${group.items.map(
                    (s) => html`
                      <li>
                        <a class="category-link" href="/services/${s.slug}">
                          <span class="category-link-icon" aria-hidden="true">${icon(s.icon, {
                            size: 20,
                          })}</span>
                          <span class="category-link-body">
                            <strong>${s.title}</strong>
                            <span>${s.summary}</span>
                          </span>
                          <span class="category-link-arrow">${icon('arrowRight', { size: 18 })}</span>
                        </a>
                      </li>
                    `
                  )}
                </ul>
              </div>
            `
          )}
        </div>

        <div class="section-cta">
          <a class="btn btn-ghost" href="/services">
            Все услуги и цены ${icon('arrowRight', { size: 18 })}
          </a>
        </div>
      </div>
    </section>
  `;
}

/* ──────────────────────────── SMART SERVICE SELECTOR ─────────────────────── */

function selectorSection() {
  return html`
    <section class="section section-tint selector-section" id="selector">
      <div class="container">
        ${sectionHead(
          'Подбор услуги',
          ['С чем приезжают', 'в сервис'],
          'Опишите симптом — покажем, с какой услуги логично начать. ' +
            'Это не диагноз: точную причину мастер определит на месте.'
        )}

        <div class="selector" data-selector>
          <label class="selector-label" for="selector-symptom">Что вас беспокоит?</label>
          <div class="selector-control">
            <select id="selector-symptom" data-selector-input>
              <option value="">Выберите симптом или задачу</option>
              ${SYMPTOM_MAP.map(
                (s) => html`<option value="${s.slug}">${s.text}</option>`
              )}
            </select>
            <button class="btn btn-primary" type="button" data-selector-go>Подобрать</button>
          </div>

          <div class="selector-result" data-selector-result hidden></div>

          <p class="selector-hint">
            ${icon('info', { size: 16 })}
            Формулировка «возможно, вам подойдёт» — это подсказка, а не диагноз.
            Поставить точный диагноз можно только после осмотра автомобиля.
          </p>
        </div>
      </div>
    </section>
  `;
}

/* ───────────────────────────── WHY YASIRA MOTORS ─────────────────────────── */

function whySection() {
  const items = [
    {
      icon: 'award',
      title: `${config.business.rating} из 5 в 2ГИС`,
      text: `Рейтинг держится на ${config.business.ratingsCount} подтверждённых оценках. В 2026 году сервис отмечен премией 2GIS Awards в категории «Лучший автосервис».`,
    },
    {
      icon: 'chip',
      title: 'Компьютерная диагностика — отдельное направление',
      text: 'Сервис заявляет диагностику как самостоятельную услугу: её можно заказать, не обязуясь ремонтировать здесь же. Ошибки считываются с блоков управления, а не угадываются.',
    },
    {
      icon: 'box',
      title: 'Масла и расходники рядом',
      text: 'Компания развивает поставку масел и автохимии — более 1500 наименований в наличии. Нужные материалы чаще всего есть на месте, ждать поставку не приходится.',
    },
    {
      icon: 'engine',
      title: 'Бензин и дизель, легковые и грузовые',
      text: 'В перечне работ — ремонт дизельных двигателей, МКПП и АКПП, стартеров и генераторов. Сервисное обслуживание грузового транспорта заявлено отдельным направлением.',
    },
    {
      icon: 'map',
      title: '25-й микрорайон, первый этаж',
      text: `${config.business.address}. Остановка «${config.business.transit.stop}» — ${config.business.transit.walk}. Рядом ${config.business.parkingCount} парковки: подъехать и оставить машину удобно.`,
    },
    {
      icon: 'shield',
      title: 'Понятный порядок работ',
      text: 'Мы не называем цену «от балды»: сначала диагностика и дефектовка, затем согласование объёма и стоимости. Вы решаете, что делаем сейчас, а что можно отложить.',
    },
  ];

  return html`
    <section class="section section-deep why-section" id="why">
      <div class="container">
        ${sectionHead(
          'Почему YASIRA MOTORS',
          ['Факты,', 'а не общие слова'],
          'Каждый пункт ниже подтверждается данными из карточки организации 2ГИС и с официального сайта компании.'
        )}
        <div class="why-grid">
          ${items.map(
            (item) => html`
              <article class="why-card">
                <span class="why-icon" aria-hidden="true">${icon(item.icon, { size: 24 })}</span>
                <h3>${item.title}</h3>
                <p>${item.text}</p>
              </article>
            `
          )}
        </div>

        ${photoBand({
          file: 'directions1.jpg',
          alt: 'Склад масел и автохимии YASIRA MOTORS: бочки и канистры ADDINOL',
          title: 'Масла и автохимия — на месте, а не «под заказ»',
          text:
            'Больше 1500 наименований масел, смазок и автохимии в наличии. ' +
            'Поэтому расходники чаще всего меняют в тот же приезд, без ожидания поставки.',
        })}
      </div>
    </section>
  `;
}

/* ──────────────────────────── HOW WE WORK ────────────────────────────────── */

function howSection() {
  const steps = [
    { n: '01', title: 'Выбираете услугу', text: 'Онлайн в каталоге или по телефону — как удобнее.' },
    { n: '02', title: 'Выбираете время', text: 'Смотрим свободные слоты и бронируем удобный.' },
    { n: '03', title: 'Приезжаете в сервис', text: `${config.business.addressShort}, 1 этаж. Остановка «${config.business.transit.stop}» рядом.` },
    { n: '04', title: 'Получаете обслуживание', text: 'Мастер называет объём и стоимость до начала работ.' },
  ];
  return html`
    <section class="section section-tint how-section" id="how">
      <div class="container">
        ${sectionHead('Как это работает', [
          'Четыре шага',
          'от заявки до готового автомобиля',
        ])}
        <ol class="steps">
          ${steps.map(
            (step) => html`
              <li class="step">
                <span class="step-num">${step.n}</span>
                <div class="step-body">
                  <h3>${step.title}</h3>
                  <p>${step.text}</p>
                </div>
              </li>
            `
          )}
        </ol>
        <div class="section-cta">
          <a class="btn btn-primary" href="/booking">Записаться на обслуживание</a>
        </div>
      </div>
    </section>
  `;
}

/* ────────────────────────────── PRICING / CATEGORIES ─────────────────────── */

function pricingSection() {
  return html`
    <section class="section section-deep pricing-section" id="pricing">
      <div class="container">
        ${sectionHead(
          'Стоимость',
          ['Почему мы не публикуем', 'прайс «от и до»'],
          'Цена ремонта зависит от марки, модели, года и состояния конкретного автомобиля. ' +
            'Цифра, названная без осмотра, вводила бы в заблуждение — поэтому её здесь нет.'
        )}

        <div class="pricing-grid">
          <article class="pricing-card pricing-card-main">
            <h3>Как формируется цена</h3>
            <ol class="pricing-steps">
              <li>
                ${icon('check', { size: 18 })}
                <span>Вы описываете проблему и автомобиль — по телефону или в заявке.</span>
              </li>
              <li>
                ${icon('check', { size: 18 })}
                <span>Мастер проводит диагностику и определяет объём работ.</span>
              </li>
              <li>
                ${icon('check', { size: 18 })}
                <span>Вам называют стоимость и состав работ <strong>до</strong> начала ремонта.</span>
              </li>
              <li>
                ${icon('check', { size: 18 })}
                <span>Работы выполняются только после вашего согласования.</span>
              </li>
            </ol>
            <div class="pricing-actions">
              <a class="btn btn-primary" href="/booking">Записаться на диагностику</a>
              <a class="btn btn-ghost" href="tel:${config.business.phone.replace(/[^\d+]/g, '')}">
                ${icon('phone', { size: 18 })} Узнать цену
              </a>
            </div>
          </article>

          <aside class="pricing-card pricing-card-aside">
            <h3>Ориентиры по времени</h3>
            <ul class="pricing-times">
              <li><span>Компьютерная диагностика</span><strong>от 30 мин</strong></li>
              <li><span>Замена масла и фильтров</span><strong>от 40 мин</strong></li>
              <li><span>Развал-схождение</span><strong>от 40 мин</strong></li>
              <li><span>Шиномонтаж</span><strong>от 30 мин</strong></li>
              <li><span>Ремонт ходовой части</span><strong>от 1 часа</strong></li>
              <li><span>Ремонт двигателя / КПП</span><strong>от 1 дня</strong></li>
            </ul>
            <p class="pricing-note">
              ${icon('info', { size: 16 })}
              Время указано ориентировочно: точный срок мастер называет после осмотра.
              Один из клиентов в отзыве на 2ГИС указал, что полная замена масла с салонным,
              воздушным и масляным фильтрами обошлась примерно в 15 000 ₸ — это ориентир
              из отзыва, а не действующий прайс.
            </p>
          </aside>
        </div>
      </div>
    </section>
  `;
}

/* ──────────────────────────────── GALLERY ────────────────────────────────── */

function gallerySection() {
  return html`
    <section class="section section-tint gallery-section" id="gallery">
      <div class="container">
        ${sectionHead(
          'Фотографии',
          ['Так выглядит', 'сервис изнутри'],
          'Это снимки компании, а не стоковые изображения. Фотографии опубликованы на официальном сайте yasira.kz.'
        )}
        ${galleryGrid(GALLERY)}
      </div>
    </section>
  `;
}

/* ──────────────────────────────── REVIEWS ────────────────────────────────── */

function reviewsSection() {
  const items = REVIEWS.slice(0, 6);
  return html`
    <section class="section section-deep reviews-section" id="reviews">
      <div class="container">
        ${sectionHead(
          'Отзывы',
          [
            `Рейтинг ${config.business.rating} из 5`,
            `по ${config.business.ratingsCount} оценкам в 2ГИС`,
          ],
          'Ниже — отрывки реальных отзывов с указанием автора и даты. Мы не пишем отзывы за клиентов.'
        )}

        <div class="review-topics" aria-label="О чём чаще всего пишут клиенты">
          ${REVIEW_TOPICS.map((topic) => html`<span class="chip">${topic}</span>`)}
        </div>

        <div class="reviews-grid">
          ${items.map((review) => reviewCard(review))}
        </div>

        <div class="section-cta">
          <a
            class="btn btn-ghost"
            href="${REVIEW_SOURCE.url}"
            rel="noopener"
            target="_blank"
          >
            Смотреть все ${config.business.reviewsCount} отзывов в 2ГИС
            ${icon('arrowRight', { size: 18 })}
          </a>
        </div>
      </div>
    </section>
  `;
}

/* ──────────────────────────── BOOKING (inline) ───────────────────────────── */

function bookingSection() {
  const b = config.business;
  return html`
    <section class="section section-band booking-section" id="booking">
      <div class="container booking-layout">
        <div class="booking-copy">
          ${sectionHead(
            'Онлайн-запись',
            ['Запишитесь', 'на удобное время'],
            'Выберите услугу, дату и время — заявка уйдёт администратору сразу. ' +
              'Он свяжется с вами, чтобы подтвердить запись и уточнить детали.'
          )}
          <ul class="booking-benefits">
            <li>${icon('clock', { size: 18 })} Свободные слоты видны сразу — занятое время выбрать нельзя</li>
            <li>${icon('shield', { size: 18 })} Достаточно имени и телефона: остальное уточним при звонке</li>
            <li>${icon('check', { size: 18 })} Запись можно перенести или отменить — без штрафов</li>
          </ul>
          <p class="booking-alt">
            Не хотите заполнять форму? Позвоните:
            <a href="tel:${b.phone.replace(/[^\d+]/g, '')}">${b.phone}</a>
          </p>
          ${contactActions()}
        </div>

        <div class="booking-widget" data-booking-widget>
          <form class="form" data-quick-booking novalidate>
            <h3 class="form-title">Быстрая запись</h3>

            <div class="field">
              <label for="qb-service">Услуга</label>
              <select id="qb-service" name="serviceSlug" required data-service-select>
                <option value="">Выберите услугу</option>
                ${servicesByCategory().map(
                  (group) => html`
                    <optgroup label="${group.name}">
                      ${group.items.map(
                        (s) => html`<option value="${s.slug}">${s.title}</option>`
                      )}
                    </optgroup>
                  `
                )}
              </select>
              <p class="field-error" data-error-for="serviceSlug" hidden></p>
            </div>

            <div class="field-row">
              <div class="field">
                <label for="qb-date">Дата</label>
                <input type="date" id="qb-date" name="date" required data-date-input>
                <p class="field-error" data-error-for="date" hidden></p>
              </div>
              <div class="field">
                <label for="qb-time">Время</label>
                <select id="qb-time" name="time" required data-time-select disabled>
                  <option value="">Сначала выберите дату</option>
                </select>
                <p class="field-error" data-error-for="time" hidden></p>
              </div>
            </div>

            <div class="field">
              <label for="qb-name">Имя</label>
              <input type="text" id="qb-name" name="name" autocomplete="name" required placeholder="Как к вам обращаться…">
              <p class="field-error" data-error-for="name" hidden></p>
            </div>

            <div class="field">
              <label for="qb-phone">Телефон</label>
              <input type="tel" id="qb-phone" name="phone" autocomplete="tel" required placeholder="+7 777 000 00 00" data-phone-input>
              <p class="field-error" data-error-for="phone" hidden></p>
            </div>

            <button class="btn btn-primary btn-block" type="submit" data-submit>
              Отправить заявку
            </button>

            <p class="form-legal">
              Нажимая кнопку, вы соглашаетесь на обработку контактных данных
              для подтверждения записи.
            </p>

            <div class="form-status" data-form-status role="status" aria-live="polite"></div>
          </form>

          <div class="booking-success" data-booking-success hidden></div>
        </div>
      </div>
    </section>
  `;
}

/* ─────────────────────────────── LOCATION ────────────────────────────────── */

function locationSection() {
  const b = config.business;
  return html`
    <section class="section section-deep location-section" id="location">
      <div class="container">
        ${sectionHead('Как нас найти', [b.addressShort, 'первый этаж'])}
        <div class="location-layout">
          <div class="location-info">
            <ul class="info-list">
              <li>
                <span class="info-icon" aria-hidden="true">${icon('map', { size: 20 })}</span>
                <div>
                  <strong>Адрес</strong>
                  <span>${b.address}</span>
                  <span class="muted">${b.addressExtra}</span>
                </div>
              </li>
              <li>
                <span class="info-icon" aria-hidden="true">${icon('clock', { size: 20 })}</span>
                <div>
                  <strong>Часы работы</strong>
                  <span>Пн–Сб: 09:00–20:00</span>
                  <span>Вс: 10:00–17:00</span>
                </div>
              </li>
              <li>
                <span class="info-icon" aria-hidden="true">${icon('phone', { size: 20 })}</span>
                <div>
                  <strong>Телефоны</strong>
                  <span><a href="tel:${b.phone.replace(/[^\d+]/g, '')}">${b.phone}</a></span>
                  <span class="muted">
                    <a href="tel:${b.phone2.replace(/[^\d+]/g, '')}">${b.phone2}</a> ·
                    <a href="tel:${b.phone3.replace(/[^\d+]/g, '')}">${b.phone3}</a>
                  </span>
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
            </ul>
            ${contactActions({ withRoute: true })}
          </div>

          ${mapEmbed({ tall: true })}
        </div>
      </div>
    </section>
  `;
}

/* ────────────────────────────────── FAQ ─────────────────────────────────── */

function faqSection() {
  return html`
    <section class="section section-tint faq-section" id="faq">
      <div class="container narrow">
        ${sectionHead('Вопросы и ответы', ['Частые вопросы', 'о сервисе и записи'])}
        ${faqList(FAQ)}
      </div>
    </section>
  `;
}

/* ─────────────────────────────── FINAL CTA ──────────────────────────────── */

function finalCta() {
  const b = config.business;
  return html`
    <section class="final-cta">
      <div class="container final-cta-inner">
        <h2 class="final-cta-title">Готовы записаться?</h2>
        <p class="final-cta-text">
          Выберите удобное время — администратор подтвердит запись и уточнит
          стоимость работ по вашему автомобилю.
        </p>
        <div class="final-cta-actions">
          <a class="btn btn-primary btn-lg" href="/booking">
            ${icon('calendar', { size: 20 })} Записаться
          </a>
          <a class="btn btn-ghost btn-lg" href="tel:${b.phone.replace(/[^\d+]/g, '')}">
            ${icon('phone', { size: 20 })} Позвонить
          </a>
        </div>
        <p class="final-cta-meta">
          ${b.address} · ${b.hoursText}
        </p>
      </div>
    </section>
  `;
}

/* ──────────────────────────────── сборка ────────────────────────────────── */

function renderHome() {
  // concat() сохраняет пометку безопасности фрагментов: join() привёл бы
  // их к строкам, и разметка была бы экранирована при вставке в каркас.
  const body = concat([
    hero(),
    trustBar(),
    servicesSection(),
    selectorSection(),
    whySection(),
    howSection(),
    pricingSection(),
    gallerySection(),
    reviewsSection(),
    bookingSection(),
    locationSection(),
    faqSection(),
    finalCta(),
  ]);

  return layout({
    title: `Автосервис в Актау — ${config.business.name} | Диагностика, ТО, ремонт авто`,
    description:
      'YASIRA MOTORS — автосервис в Актау, 25-й микрорайон, 52/2. Компьютерная диагностика, ' +
      'замена масла, ремонт двигателя, ходовой части, АКПП и МКПП, автоэлектрика, шиномонтаж. ' +
      `Рейтинг ${config.business.rating} в 2ГИС. Онлайн-запись на обслуживание.`,
    path: '/',
    activePath: '/',
    image: '/img/directions2.jpg',
    preloadImage: `/img/${HERO_IMAGE.file}`,
    schema: seo.schemaScript({
      path: '/',
      title: `${config.business.name} — автосервис в Актау`,
      description:
        'Автосервис в Актау: компьютерная диагностика, техническое обслуживание и ремонт автомобилей.',
      image: '/img/directions2.jpg',
      includeReviews: true,
      includeFaqPage: true,
      breadcrumbs: [{ name: 'Главная', url: '/' }],
    }),
    body,
  });
}

module.exports = { renderHome };
