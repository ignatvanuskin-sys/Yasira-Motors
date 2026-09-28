'use strict';

/**
 * Главная страница.
 *
 * Задача страницы — за 10–20 секунд дать клиенту ответ: что за сервис, что
 * делают, где находятся, можно ли доверять и как связаться. Поэтому секций
 * десять, а не пятнадцать, и в каждой ровно один смысл.
 *
 * Сайт не собирает заявки: два действия — позвонить и написать в WhatsApp.
 *
 * Выдуманных данных здесь нет. Список марок не приводится, потому что его
 * нет ни в 2ГИС, ни в Яндекс Картах.
 */

const { html, raw, concat } = require('../lib/html');
const { icon } = require('./icons');
const { layout } = require('./layout');
const {
  serviceCard,
  sectionHead,
  actionPair,
  trustCard,
  stepCard,
  ratingBlock,
  reviewCard,
  mapEmbed,
  faqList,
  galleryGrid,
} = require('./partials');
const config = require('../config');
const { CATEGORIES } = require('../content/categories');
const { REVIEWS, REVIEW_SOURCE } = require('../content/reviews');
const { GALLERY } = require('../content/gallery');
const { FAQ } = require('../content/faq');
const seo = require('../lib/seo');

/** Признаки, с которыми приезжают. Язык клиента, а не каталога. */
const SYMPTOMS = [
  'Машина гудит на ходу',
  'Загорелся Check Engine',
  'Стучит подвеска',
  'Плохо заводится',
  'Уходит масло',
  'Тянет в сторону',
  'Пахнет топливом или гарью',
  'Не заряжается аккумулятор',
];

/** Порядок работ сервиса — то, что происходит на самом деле. */
const STEPS = [
  {
    n: '01',
    title: 'Приезжаете или пишете',
    text: 'Можно без записи. Если предупредите по телефону или в WhatsApp, мастер освободит время.',
  },
  {
    n: '02',
    title: 'Осматриваем автомобиль',
    text: 'Диагностика и осмотр на подъёмнике: смотрим то, на что жалуетесь, и то, что связано с этим узлом.',
  },
  {
    n: '03',
    title: 'Объясняем, что случилось',
    text: 'Показываем найденное и говорим причину простыми словами — без «нужно поменять всё».',
  },
  {
    n: '04',
    title: 'Согласовываем стоимость',
    text: 'Называем цену и объём работ до их начала. Работы выполняем только после вашего согласия.',
  },
  {
    n: '05',
    title: 'Выполняем работу',
    text: 'Делаем согласованное. Если по ходу находится что-то ещё — сначала звоним и спрашиваем.',
  },
  {
    n: '06',
    title: 'Забираете автомобиль',
    text: 'Показываем выполненное и отдаём замененные детали, если они остались.',
  },
];

/* ── Секции ──────────────────────────────────────────────────────────────── */

function hero() {
  const b = config.business;
  return html`
    <section class="hero">
      <div class="container hero-inner">
        <div class="hero-text">
          <p class="hero-eyebrow" translate="no">YASIRA MOTORS</p>
          <h1 class="hero-title">
            <span class="ttl-line">Автосервис</span>
            <span class="ttl-line is-accent">в Актау</span>
          </h1>
          <p class="hero-lead">
            Диагностика, ТО и ремонт легковых и грузовых автомобилей.
          </p>
          <p class="hero-note">
            Сначала находим причину — согласовываем стоимость — выполняем работу.
          </p>

          ${actionPair({ whatsappText: config.waText.general })}

          <ul class="hero-facts">
            <li>
              <strong>${b.rating} ★ в 2ГИС</strong>
              <span>${b.ratingsCount} оценок</span>
            </li>
            <li>
              <strong>${b.yandexRating.toFixed(1)} ★ в Яндексе</strong>
              <span>${b.yandexRatingsCount} оценок</span>
            </li>
            <li>
              <strong>${b.addressShort}</strong>
              <span>${b.addressExtra} · ${b.city}</span>
            </li>
          </ul>
        </div>

        <!-- Фотография сервиса отдельным крупным кадром, а не фоном
             под текстом: клиент должен сразу увидеть реальный бокс. -->
        <figure class="hero-photo">
          <img
            src="/img/directions2.jpg"
            alt="Мастер YASIRA MOTORS за работой в боксе"
            width="1200"
            height="800"
            fetchpriority="high"
            decoding="async"
          >
          <figcaption>Наш бокс · ${b.addressShort}</figcaption>
        </figure>
      </div>
    </section>
  `;
}

function trustSection() {
  const b = config.business;
  const items = [
    { value: `${b.rating} из 5`, label: 'рейтинг в 2ГИС', note: `${b.ratingsCount} оценок` },
    {
      value: `${b.yandexRating.toFixed(1)} из 5`,
      label: 'рейтинг в Яндекс Картах',
      note: `${b.yandexRatingsCount} оценок`,
    },
    { value: `${b.groupYears} лет`, label: 'работает группа компаний Yasira', note: 'с 2006 года в Казахстане' },
    { value: `${b.oilsCount}+`, label: 'наименований масел и автохимии', note: 'в наличии, без ожидания поставки' },
    { value: 'Легковые и грузовые', label: 'обслуживаем оба типа транспорта', note: 'включая дизельные двигатели' },
  ];

  return html`
    <section class="section" id="about">
      <div class="container">
        ${sectionHead(
          'Почему нам доверяют',
          ['Почему владельцы', 'выбирают YASIRA MOTORS'],
          'Каждый пункт подтверждается карточками организации в 2ГИС и Яндекс Картах или официальным сайтом компании.'
        )}
        <div class="trust-grid">${items.map((item) => trustCard(item))}</div>
      </div>
    </section>
  `;
}

function servicesSection() {
  return html`
    <section class="section section-soft" id="services">
      <div class="container">
        ${sectionHead(
          'Услуги',
          ['Что мы делаем', 'в сервисе'],
          'Восемь направлений. Названия — как их называет клиент, а не как в каталоге.'
        )}
        <div class="category-grid">
          ${CATEGORIES.map(
            (category) => html`
              <article class="category-card">
                <span class="category-icon" aria-hidden="true">${icon(category.icon, { size: 24 })}</span>
                <h3 class="category-title">${category.title}</h3>
                <p class="category-text">${category.text}</p>
                <ul class="category-items">
                  ${category.items.map((item) => html`<li>${item}</li>`)}
                </ul>
                <a class="link-arrow" href="/services/${category.lead}">
                  Подробнее ${icon('arrowRight', { size: 16 })}
                </a>
              </article>
            `
          )}
        </div>
        <div class="section-cta">
          <a class="btn btn-ghost" href="/services">
            Смотреть все услуги ${icon('arrowRight', { size: 18 })}
          </a>
        </div>
      </div>
    </section>
  `;
}

function symptomsSection() {
  const waText = `${config.waText.diagnose} `;
  return html`
    <section class="section symptoms-section">
      <div class="container">
        <div class="symptoms-layout">
          <div>
            ${sectionHead(
              'Подсказка',
              ['Не знаете,', 'что с машиной?'],
              'Опишите словами, что происходит — этого достаточно, чтобы понять, с чего начать. Диагноз по телефону не ставим: причину определит мастер на осмотре.'
            )}
            <ul class="symptom-list">
              ${SYMPTOMS.map((text) => html`<li class="symptom-chip">${text}</li>`)}
            </ul>
          </div>
          <div class="symptoms-action">
            <p class="symptoms-action-text">
              Напишите, что беспокоит, и мы подскажем, с чего начать диагностику
              и сколько времени это займёт.
            </p>
            ${actionPair({ whatsappText: waText })}
          </div>
        </div>
      </div>
    </section>
  `;
}

function processSection() {
  return html`
    <section class="section section-soft">
      <div class="container">
        ${sectionHead(
          'Как проходит обслуживание',
          ['Как проходит', 'ремонт']
        )}
        <div class="steps-grid">${STEPS.map((step) => stepCard(step))}</div>
      </div>
    </section>
  `;
}

function gallerySection() {
  return html`
    <section class="section">
      <div class="container">
        ${sectionHead(
          'Фотографии',
          ['Наш сервис'],
          'Реальные фотографии YASIRA MOTORS — бокс, оборудование, работа мастеров. Это снимки компании, а не стоковые изображения.'
        )}
        ${galleryGrid(GALLERY)}
      </div>
    </section>
  `;
}

function reviewsSection() {
  const b = config.business;
  /* Четыре отзыва с текстом: короче стены, но достаточно, чтобы поверить.
     Все — реальные, из карточки 2ГИС. */
  const shown = REVIEWS.filter((review) => review.text).slice(0, 4);

  return html`
    <section class="section section-soft" id="reviews">
      <div class="container">
        ${sectionHead(
          'Отзывы',
          ['Что пишут', 'клиенты']
        )}
        <div class="reviews-top">
          ${ratingBlock()}
          <div class="reviews-top-text">
            <p>
              ${b.ratingsCount} оценок в 2ГИС и ${b.yandexRatingsCount} в Яндекс Картах.
              Ниже — четыре отзыва, остальные можно прочитать на площадках.
            </p>
            <a class="btn btn-ghost btn-sm" href="${b.twoGis}" rel="noopener" target="_blank">
              Смотреть все отзывы в 2ГИС ${icon('arrowRight', { size: 16 })}
            </a>
          </div>
        </div>
        <div class="reviews-grid">${shown.map((review) => reviewCard(review))}</div>
      </div>
    </section>
  `;
}

function faqSection() {
  return html`
    <section class="section" id="faq">
      <div class="container narrow">
        ${sectionHead('Частые вопросы', ['Что спрашивают', 'перед звонком'])}
        ${faqList(FAQ)}
      </div>
    </section>
  `;
}

function contactsSection() {
  const b = config.business;
  const [mainPhone, ...otherPhones] = b.phoneList;

  return html`
    <section class="section section-soft" id="contacts">
      <div class="container">
        ${sectionHead('Как нас найти', [b.addressShort, b.addressExtra])}
        <div class="contacts-layout">
          <div class="contacts-info">
            <ul class="info-list">
              <li>
                <span class="info-icon" aria-hidden="true">${icon('map', { size: 20 })}</span>
                <div>
                  <strong>Адрес</strong>
                  <span>${b.address}, ${b.addressExtra}</span>
                  <span class="muted">Вход со стороны микрорайона</span>
                </div>
              </li>
              <li>
                <span class="info-icon" aria-hidden="true">${icon('clock', { size: 20 })}</span>
                <div>
                  <strong>Часы работы</strong>
                  <span>Пн–Сб: 09:00–19:00</span>
                  <span>Вс: 10:00–17:00</span>
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
                <span class="info-icon" aria-hidden="true">${icon('car', { size: 20 })}</span>
                <div>
                  <strong>Как добраться</strong>
                  <span>Остановка «${b.transit.stop}» — ${b.transit.walk}</span>
                  <span class="muted">${b.parkingCount} парковки рядом</span>
                </div>
              </li>
            </ul>

            ${actionPair({ whatsappText: config.waText.general, withRoute: true })}
          </div>

          ${mapEmbed({ tall: true })}
        </div>
      </div>
    </section>
  `;
}

function finalCta() {
  return html`
    <section class="section section-dark final-cta">
      <div class="container narrow final-cta-inner">
        <h2 class="final-cta-title">
          <span class="ttl-line">Нужен ремонт</span>
          <span class="ttl-line is-accent">или диагностика?</span>
        </h2>
        <p class="final-cta-text">
          Позвоните или напишите в WhatsApp — расскажите, что происходит
          с автомобилем. Подскажем, с чего начать, и назовём время визита.
        </p>
        ${actionPair({ whatsappText: config.waText.general })}
        <p class="final-cta-meta">
          ${config.business.addressShort} · ${config.business.hoursText}
        </p>
      </div>
    </section>
  `;
}

/* ── Страница ────────────────────────────────────────────────────────────── */

function renderHome() {
  const body = concat([
    hero(),
    trustSection(),
    servicesSection(),
    symptomsSection(),
    processSection(),
    gallerySection(),
    reviewsSection(),
    faqSection(),
    contactsSection(),
    finalCta(),
  ]);

  const b = config.business;

  return layout({
    title: `${b.name} — автосервис в ${b.city} | Диагностика, ТО и ремонт авто`,
    description:
      `Автосервис ${b.name} в ${b.city}: диагностика, ТО, ремонт двигателя, ходовой, АКПП, ` +
      `автоэлектрика, шиномонтаж. ${b.addressShort}. Рейтинг ${b.rating} в 2ГИС.`,
    path: '/',
    activePath: '/',
    image: '/img/directions2.jpg',
    preloadImage: '/img/directions2.jpg',
    schema: seo.schemaScript({
      path: '/',
      title: `${b.name} — автосервис в ${b.city}`,
      description:
        'Диагностика, техническое обслуживание и ремонт легковых и грузовых автомобилей в Актау.',
      /* Разметка описывает то, что реально видно на странице: отзывы и FAQ. */
      includeReviews: true,
      includeFaqPage: true,
      breadcrumbs: [],
    }),
    body,
  });
}

module.exports = { renderHome, REVIEW_SOURCE };
