'use strict';

/**
 * Страница услуг /services.
 *
 * Одна страница вместо двадцати: восемь категорий, внутри — конкретные работы.
 * Подробности живут на отдельных страницах услуг, куда ведёт «Что входит».
 *
 * Категории проверяются на согласованность со справочником услуг при сборке
 * (scripts/build.js), поэтому категория без услуг или услуга без категории
 * не дойдут до продакшена.
 */

const { html } = require('../lib/html');
const { icon } = require('./icons');
const { layout } = require('./layout');
const { sectionHead, actionPair, serviceCard, stepCard } = require('./partials');
const config = require('../config');
const { SERVICES } = require('../content/services');
const { CATEGORIES } = require('../content/categories');
const { FAQ } = require('../content/faq');
const { faqList } = require('./partials');
const seo = require('../lib/seo');

/**
 * Услуги, входящие в категорию.
 *
 * Соответствие вынесено в код страницы, а не в данные: категория — это
 * взгляд на услуги для клиента, и она может объединять несколько услуг
 * (например, АКПП и МКПП в «Коробки передач»). Согласованность проверяется
 * при сборке — категория без услуг не дойдёт до продакшена.
 */
const CATEGORY_SERVICES = {
  diagnostika: ['kompyuternaya-diagnostika', 'razval-shozhdenie'],
  to: ['zamena-masla-i-filtrov', 'tehnicheskoe-obsluzhivanie'],
  hodovaya: ['remont-hodovoy-chasti'],
  dvigatel: ['remont-dvigatelya'],
  korobki: ['remont-akpp', 'remont-mkpp'],
  elektrika: ['remont-starterov-i-generatorov'],
  shinomontazh: ['shinomontazh'],
  materialy: ['avtohimiya-i-masla'],
};

/** @param {{slug:string}} category */
function serviceSlugsOf(category) {
  return CATEGORY_SERVICES[category.slug] || [];
}

function renderServices() {
  const b = config.business;

  const body = html`
    <section class="page-head">
      <div class="container">
        <nav class="breadcrumbs" aria-label="Хлебные крошки">
          <a href="/">Главная</a>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Услуги</span>
        </nav>
        <h1 class="page-title">Услуги автосервиса в Актау</h1>
        <p class="page-text">
          Восемь направлений работ. Точную стоимость называем после осмотра
          автомобиля и согласовываем её до начала ремонта — поэтому прайса
          «от и до» здесь нет.
        </p>
        ${actionPair({ whatsappText: config.waText.general })}
      </div>
    </section>

    ${CATEGORIES.map((category) => {
      const items = SERVICES.filter((service) => serviceSlugsOf(category).includes(service.slug));
      return html`
        <section class="section section-tint" id="${category.slug}">
          <div class="container">
            ${sectionHead(
              category.title,
              [category.items[0], category.items.slice(1).join(' · ') || category.text],
              category.text
            )}
            <div class="service-grid">
              ${(items.length ? items : SERVICES.filter((s) => s.slug === category.lead)).map(
                (service) => serviceCard(service, { chip: true })
              )}
            </div>
            <div class="section-cta">
              ${actionPair({
                whatsappText: config.waText.service(category.title.toLowerCase()),
              })}
            </div>
          </div>
        </section>
      `;
    })}

    <section class="section section-deep">
      <div class="container narrow">
        ${sectionHead('Частые вопросы', ['Что спрашивают', 'перед звонком'])}
        ${faqList(FAQ)}
      </div>
    </section>

    <section class="section section-band final-cta">
      <div class="container narrow final-cta-inner">
        <h2 class="final-cta-title">
          <span class="ttl-line">Не нашли нужную</span>
          <span class="ttl-line is-accent">работу в списке?</span>
        </h2>
        <p class="final-cta-text">
          Позвоните или напишите в WhatsApp — опишите проблему, и мы скажем,
          делаем ли такое и с чего начать.
        </p>
        ${actionPair({ whatsappText: config.waText.general })}
        <p class="final-cta-meta">${b.addressShort} · ${b.hoursText}</p>
      </div>
    </section>
  `;

  return layout({
    title: `Услуги автосервиса — ${b.name}, ${b.city}`,
    description:
      'Диагностика, ТО, ремонт двигателя, ходовой части, АКПП и МКПП, автоэлектрика, ' +
      `шиномонтаж, масла и автохимия. ${b.addressShort}, ${b.city}.`,
    path: '/services',
    activePath: '/services',
    image: '/img/directions2.jpg',
    schema: seo.schemaScript({
      path: '/services',
      title: `Услуги автосервиса ${b.name}`,
      description: 'Диагностика, ремонт и техническое обслуживание автомобилей в Актау.',
      includeFaqPage: true,
      breadcrumbs: [
        { name: 'Главная', url: '/' },
        { name: 'Услуги', url: '/services' },
      ],
    }),
    body,
  });
}

module.exports = { renderServices, CATEGORY_SERVICES };
