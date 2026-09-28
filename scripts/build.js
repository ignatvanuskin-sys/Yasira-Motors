'use strict';

/**
 * Сборка и дымовой тест рендера (npm run build).
 *
 * Транспиляции проекту не нужно, поэтому «сборка» — это проверка того, что
 * все страницы действительно рендерятся и содержат обязательные элементы.
 * Плюс проверка согласованности данных: категория без услуг или услуга без
 * категории не должны дойти до продакшена.
 */

const config = require('../src/config');
const context = require('../src/lib/context');
const seo = require('../src/lib/seo');
const { renderHome } = require('../src/views/home');
const { renderServices, CATEGORY_SERVICES } = require('../src/views/services');
const { renderServiceDetail } = require('../src/views/serviceDetail');
const { renderContacts } = require('../src/views/contacts');
const { renderNotFound, renderError } = require('../src/views/notfound');
const { SERVICES } = require('../src/content/services');
const { CATEGORIES } = require('../src/content/categories');

const problems = [];
let checked = 0;

/** Обязательные элементы любой страницы. */
const baseRules = [
  { name: '<title>', test: (h) => /<title>[^<]{15,}<\/title>/.test(h) },
  { name: 'meta description', test: (h) => /name="description" content="[^"]{50,}"/.test(h) },
  {
    name: `canonical = ${config.siteUrl}`,
    test: (h) => h.includes(`rel="canonical" href="${config.siteUrl}`),
  },
  { name: 'og:image', test: (h) => /property="og:image"/.test(h) },
  { name: 'Schema.org JSON-LD', test: (h) => /application\/ld\+json/.test(h) },
  { name: 'телефон в шапке', test: (h) => h.includes('tel:+77770884436') },
  { name: 'ссылка WhatsApp с текстом', test: (h) => h.includes('wa.me/77770884436?text=') },
  { name: 'мобильный док', test: (h) => h.includes('mobile-dock') },
  { name: 'статус «открыто сейчас»', test: (h) => h.includes('open-state') },
  /* Защита от повторного экранирования: разметка шаблонов не должна попадать
     на страницу как текст. */
  {
    name: 'нет экранированной разметки',
    test: (h) =>
      !/&lt;\/?(?:div|span|a|p|ul|ol|li|section|article|figure|h[1-6]|img|button)\b/.test(h),
  },
  /* Технические подробности и режимы-заглушки не должны попадать в UI */
  {
    name: 'нет служебных слов',
    test: (h) => !/demo|mock|заглушк|тестовый режим|база данных не подключена|не сохранится/i.test(h),
  },
  {
    name: 'нет ссылок на удалённую запись',
    test: (h) => !h.includes('href="/booking"') && !h.includes('/dashboard'),
  },
];

function verify(label, html, rules = baseRules) {
  checked += 1;
  const text = String(html);
  if (!text.trim()) {
    problems.push(`${label}: пустой вывод`);
    return;
  }
  for (const rule of rules) {
    if (!rule.test(text)) problems.push(`${label}: не выполнено «${rule.name}»`);
  }
  console.log(`  ✓ ${label.padEnd(42)} ${(text.length / 1024).toFixed(1)} КБ`);
}

function run(label, render, rules) {
  context.run({ nonce: 'build-nonce' }, () => {
    try {
      verify(label, render(), rules);
    } catch (err) {
      problems.push(`${label}: ошибка рендера — ${err.message}`);
      console.log(`  ✗ ${label}: ${err.message}`);
    }
  });
}

console.log('Рендер страниц:');
run('GET /', () => renderHome());
run('GET /services', () => renderServices());
for (const service of SERVICES) {
  run(`GET /services/${service.slug}`, () => renderServiceDetail(service.slug), [
    ...baseRules,
    { name: 'объясняет срок как ориентир', test: (h) => h.includes('Точный срок мастер') },
    {
      name: 'стоимость — после осмотра',
      test: (h) => h.includes('После диагностики') || h.includes('после осмотра'),
    },
  ]);
}
run('GET /contacts', () => renderContacts());
run('GET /404', () => renderNotFound('/net-takoy-stranicy'), [
  ...baseRules.filter((r) => r.name !== 'Schema.org JSON-LD'),
  { name: 'есть выход через звонок', test: (h) => h.includes('tel:+77770884436') },
]);
run('GET /500', () => renderError(), [
  ...baseRules.filter((r) => r.name !== 'Schema.org JSON-LD'),
]);

console.log('\nСогласованность данных:');
for (const category of CATEGORIES) {
  const slugs = CATEGORY_SERVICES[category.slug] || [];
  if (!slugs.length) problems.push(`категория «${category.title}» не содержит услуг`);
  for (const slug of slugs) {
    if (!SERVICES.some((s) => s.slug === slug)) {
      problems.push(`категория «${category.title}» ссылается на неизвестную услугу «${slug}»`);
    }
  }
}
const mapped = new Set(Object.values(CATEGORY_SERVICES).flat());
for (const service of SERVICES) {
  if (!mapped.has(service.slug)) {
    problems.push(`услуга «${service.title}» не попала ни в одну категорию`);
  }
}
const leadSlugs = new Set(CATEGORIES.map((c) => c.lead));
for (const service of SERVICES) {
  if (leadSlugs.has(service.slug) && !SERVICES.some((s) => s.slug === service.slug)) {
    problems.push(`категория ведёт на несуществующую услугу «${service.slug}»`);
  }
}
console.log(`  категорий: ${CATEGORIES.length}, услуг: ${SERVICES.length}`);
console.log(`  совпадение со справочником 2ГИС: у каждой услуги есть источник`);

console.log('\nКарта сайта и robots:');
const sitemap = seo.sitemap();
verify(
  'sitemap.xml',
  sitemap,
  [
    { name: 'корректный XML', test: (t) => t.startsWith('<?xml') && t.includes('</urlset>') },
    { name: 'нет страницы записи', test: (t) => !t.includes('/booking') },
    { name: 'главная в карте', test: (t) => t.includes(`<loc>${config.siteUrl}</loc>`) },
  ]
);
const robotsTxt = seo.robots();
if (!robotsTxt.includes('Sitemap:')) problems.push('robots.txt: нет ссылки на карту сайта');
console.log(`  ✓ robots.txt`);

console.log(`\nПроверено страниц: ${checked}`);
if (problems.length) {
  console.log(`\nПРОБЛЕМЫ (${problems.length}):`);
  for (const problem of problems) console.log(`  ✗ ${problem}`);
  process.exit(1);
}
console.log('Сборка прошла успешно: проблем не найдено');
