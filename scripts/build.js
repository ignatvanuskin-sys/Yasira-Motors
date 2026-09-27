'use strict';

/**
 * Сборка и дымовой тест рендера (npm run build).
 *
 * Проект не требует транспиляции, поэтому «сборка» здесь — это
 * проверка того, что все страницы действительно рендерятся и содержат
 * обязательные элементы: заголовок, canonical, контакты, Schema.org.
 * Если шаблон сломается, это выяснится на этапе сборки, а не в проде.
 */

const fs = require('node:fs');
const path = require('node:path');

process.env.DATA_FILE = process.env.DATA_FILE || path.join(__dirname, '..', 'data', 'db.json');

const config = require('../src/config');
const context = require('../src/lib/context');
const { SERVICES } = require('../src/content/services');

const { renderHome } = require('../src/views/home');
const { renderServices } = require('../src/views/services');
const { renderServiceDetail } = require('../src/views/serviceDetail');
const { renderBooking } = require('../src/views/booking');
const { renderContacts } = require('../src/views/contacts');
const { renderNotFound } = require('../src/views/notfound');

const checks = [];
let failures = 0;

/**
 * @param {string} label
 * @param {string} html
 * @param {Array<{name:string, test:(h:string)=>boolean}>} rules
 */
function verify(label, html, rules) {
  const errors = [];
  if (!html || html.length < 500) errors.push('страница подозрительно короткая');
  if (!html.startsWith('<!doctype html>')) errors.push('отсутствует <!doctype html>');
  if (!html.includes('</html>')) errors.push('HTML не закрыт');
  for (const rule of rules) {
    if (!rule.test(html)) errors.push(`не найдено: ${rule.name}`);
  }
  const status = errors.length ? 'FAIL' : 'ok';
  if (errors.length) failures += 1;
  checks.push({ label, status, bytes: Buffer.byteLength(html, 'utf8'), errors });
}

const baseRules = [
  { name: '<title>', test: (h) => /<title>[^<]{10,}<\/title>/.test(h) },
  { name: 'meta description', test: (h) => /name="description" content="[^"]{40,}"/.test(h) },
  {
    // canonical должен совпадать с настроенным SITE_URL, а не с «https вообще».
    name: `canonical = ${config.siteUrl}`,
    test: (h) => h.includes(`rel="canonical" href="${config.siteUrl}`),
  },
  { name: 'og:image', test: (h) => /property="og:image"/.test(h) },
  { name: 'телефон в шапке', test: (h) => h.includes('+7 777 088 44 36') },
  { name: 'ссылка WhatsApp', test: (h) => h.includes('wa.me/') },
  { name: 'мобильная панель', test: (h) => h.includes('mobile-bar') },
  { name: 'ссылка на запись', test: (h) => h.includes('href="/booking"') },
  {
    /* Защита от двойного экранирования: если фрагмент шаблона попал
       на страницу как текст, в HTML появятся &lt;div, &lt;span и т.п.
       Это самая коварная ошибка шаблонизатора — её видно только в браузере. */
    name: 'нет экранированной разметки',
    test: (h) =>
      !/&lt;\/?(?:div|span|a|p|ul|ol|li|input|label|section|article|figure|img|h[1-6]|button|form|select|option)\b/.test(
        h
      ),
  },
];

/* Индексируемые страницы дополнительно обязаны содержать Schema.org.
   У страниц ошибок и экрана успеха разметки нет и не должно быть. */
const indexedRules = baseRules.concat([
  {
    name: 'Schema.org JSON-LD',
    test: (h) => /application\/ld\+json/.test(h) && /schema\.org/.test(h),
  },
  { name: 'robots index', test: (h) => /name="robots" content="index/.test(h) },
]);

function run(name, render, rules) {
  context.run({ nonce: 'build-nonce' }, () => {
    verify(name, render(), rules || indexedRules);
  });
}

run('GET /', renderHome);
run('GET /services', renderServices);
run('GET /booking', () => renderBooking({}));
run('GET /contacts', renderContacts);
run('GET /404', () => renderNotFound('/nope'), baseRules);

for (const service of SERVICES) {
  run(`GET /services/${service.slug}`, () =>
    renderServiceDetail(service)
  );
}

/* Дополнительные проверки страницы услуги */
context.run({ nonce: 'build-nonce' }, () => {
  const html = renderServiceDetail(SERVICES[0]);
  verify(`услуга: контент «${SERVICES[0].title}»`, html, [
    { name: 'цена или формулировка «по запросу»', test: (h) => h.includes('Стоимость — по запросу') || h.includes('от ') },
    { name: 'сводка работ', test: (h) => h.includes('Что входит') },
    { name: 'когда нужно', test: (h) => h.includes('Когда нужно') },
    { name: 'FAQ', test: (h) => h.includes('faq-list') },
  ]);
});

/* Проверка, что запрещённых слов нет ни на одной странице */
const forbidden = ['Demo mode', 'Mock mode', 'DATABASE_ERROR', 'MOCK_MODE', 'API_FAILED'];
context.run({ nonce: 'build-nonce' }, () => {
  const pages = [renderHome(), renderServices(), renderBooking({}), renderContacts()];
  for (const phrase of forbidden) {
    if (pages.some((page) => page.includes(phrase))) {
      failures += 1;
      checks.push({
        label: `запрещённая фраза «${phrase}»`,
        status: 'FAIL',
        bytes: 0,
        errors: ['фраза присутствует в публичном HTML'],
      });
    }
  }
});

/* Итог */
const totalBytes = checks.reduce((sum, item) => sum + item.bytes, 0);

console.log('YASIRA MOTORS — проверка сборки\n');
for (const check of checks) {
  const mark = check.status === 'ok' ? '✓' : '✗';
  const size = check.bytes ? ` ${(check.bytes / 1024).toFixed(1)} КБ` : '';
  console.log(`  ${mark} ${check.label}${size}`);
  for (const error of check.errors) console.log(`      — ${error}`);
}

console.log(
  `\nПроверено страниц: ${checks.length}. Суммарный HTML: ${(totalBytes / 1024).toFixed(1)} КБ.`
);

const publicFiles = [];
(function walkPublic(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkPublic(full);
    else publicFiles.push(full);
  }
})(config.publicDir);

const publicSize = publicFiles.reduce((sum, file) => sum + fs.statSync(file).size, 0);
console.log(
  `Статика: ${publicFiles.length} файлов, ${(publicSize / 1024 / 1024).toFixed(2)} МБ (из них изображения — см. public/img).`
);

if (failures) {
  console.error(`\nСборка не прошла: ${failures} проблем.`);
  process.exit(1);
}
console.log('\nСборка прошла успешно.');
