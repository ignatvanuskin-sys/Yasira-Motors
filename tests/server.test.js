'use strict';

/**
 * Интеграционный тест: сервер поднимается и отдаёт все страницы.
 *
 * Такой тест обязателен именно потому, что статические проверки не ловят
 * ошибки вида «функция с другим именем»: линтер и проверка типов видели
 * корректный код, а сервер падал на первом же запросе. Здесь страницы
 * действительно запрашиваются через HTTP.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

process.env.NODE_ENV = 'test';

const server = require('../server');
const { SERVICES } = require('../src/content/services');
const config = require('../src/config');

let base;

test.before(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => {
  server.close();
});

/** @param {string} path */
async function get(path) {
  const res = await fetch(base + path);
  return { status: res.status, html: await res.text(), headers: res.headers };
}

test('главная отдаётся и содержит главное', async () => {
  const { status, html } = await get('/');
  assert.equal(status, 200);
  assert.match(html, /<title>[^<]*YASIRA MOTORS/);
  assert.ok(html.includes('Автосервис'));
  assert.ok(html.includes('tel:+77770884436'), 'ссылка на звонок');
  assert.ok(html.includes('wa.me/77770884436?text='), 'ссылка WhatsApp с текстом');
  assert.ok(html.includes('widgets.2gis.com'), 'карта 2ГИС');
  assert.equal(/href="\/booking"|href="\/dashboard"/.test(html), false, 'удалённых страниц нет');
});

test('страница услуг и все страницы услуг открываются', async () => {
  const list = await get('/services');
  assert.equal(list.status, 200);
  for (const service of SERVICES) {
    const page = await get(`/services/${service.slug}`);
    assert.equal(page.status, 200, `страница ${service.slug}`);
    assert.ok(page.html.includes(service.title), `заголовок услуги ${service.slug}`);
  }
});

test('несуществующая услуга и мусорный адрес дают 404', async () => {
  assert.equal((await get('/services/net-takoy-uslugi')).status, 404);
  assert.equal((await get('/net-takoy-stranicy')).status, 404);
  const { html } = await get('/net-takoy-stranicy');
  assert.ok(html.includes('tel:+77770884436'), 'выход через звонок на 404');
});

test('контакты, sitemap, robots и healthz отвечают', async () => {
  assert.equal((await get('/contacts')).status, 200);
  assert.equal((await get('/sitemap.xml')).status, 200);
  assert.equal((await get('/robots.txt')).status, 200);
  const health = await get('/healthz');
  assert.equal(health.status, 200);
  assert.equal(health.html.trim(), 'ok');
});

test('карта сайта не содержит удалённых страниц', async () => {
  const { html } = await get('/sitemap.xml');
  assert.equal(html.includes('/booking'), false);
  assert.ok(html.includes('/services/remont-akpp'));
});

test('методы кроме GET отклоняются: сайт ничего не принимает', async () => {
  const res = await fetch(base + '/', { method: 'POST' });
  assert.equal(res.status, 405);
});

test('заголовки безопасности выставлены, включая frame-src для карты', async () => {
  const { headers } = await get('/');
  const csp = headers.get('content-security-policy');
  assert.ok(csp, 'CSP присутствует');
  assert.ok(csp.includes("default-src 'self'"));
  assert.ok(csp.includes('frame-src https://widgets.2gis.com'), 'карта не будет заблокирована');
  assert.equal(csp.includes('unsafe-inline'), false, 'без ослабления script-src');
  assert.equal(headers.get('x-content-type-options'), 'nosniff');
  assert.equal(headers.get('x-frame-options'), 'DENY');
});

test('статика отдаётся, а выход за пределы каталога закрыт', async () => {
  const css = await get('/css/style.css');
  assert.equal(css.status, 200);
  assert.ok(css.headers.get('content-type').includes('text/css'));

  const font = await get('/fonts/manrope-cyrillic.woff2');
  assert.equal(font.status, 200);
  assert.ok((font.headers.get('cache-control') || '').includes('immutable'));

  // Попытки обхода каталога
  for (const path of ['/../server.js', '/..%2fserver.js', '/%2e%2e/server.js', '/css/../../server.js']) {
    const res = await get(path);
    assert.notEqual(res.status, 200, `обход каталога закрыт: ${path}`);
  }
});

test('на каждой странице есть данные организации для поисковиков', async () => {
  for (const path of ['/', '/services', '/contacts']) {
    const { html } = await get(path);
    const match = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
    assert.ok(match, `JSON-LD на ${path}`);
    const data = JSON.parse(match[1].replace(/\\u003c/g, '<'));
    const org = data['@graph'].find((node) => node['@type'] === 'AutoRepair');
    assert.ok(org, `организация в разметке ${path}`);
    assert.equal(org.telephone, config.business.phone);
    assert.ok(org.geo.latitude && org.geo.longitude);
    assert.ok(org.openingHoursSpecification.length);
  }
});
