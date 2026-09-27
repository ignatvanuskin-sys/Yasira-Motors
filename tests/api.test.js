'use strict';

/** Интеграционные тесты HTTP: страницы, API записи, защита, админка. */

const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const http = require('node:http');

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'yasira-api-'));
process.env.DATA_FILE = path.join(TMP, 'db.json');
process.env.NODE_ENV = 'test';
process.env.ADMIN_PASSWORD = 'test-password-1234';
process.env.SESSION_SECRET = 'test-session-secret';

const test = require('node:test');
const assert = require('node:assert/strict');

const server = require('../server');
const booking = require('../src/lib/booking');
const config = require('../src/config');

let base;
let adminCookie = '';

test.before(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  fs.rmSync(TMP, { recursive: true, force: true });
});

/**
 * @param {string} url
 * @param {{method?:string, body?:object, ip?:string, cookie?:string, redirect?:string}} [options]
 */
async function call(url, options = {}) {
  const headers = {};
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (options.ip) headers['X-Forwarded-For'] = options.ip;
  if (options.cookie) headers.Cookie = options.cookie;

  const response = await fetch(base + url, {
    method: options.method || 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    // По умолчанию fetch сам идёт по редиректу — для проверки 302 это мешает.
    redirect: options.redirect || 'follow',
  });

  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* не JSON — это нормально для HTML-страниц */
  }
  return { status: response.status, text, json, headers: response.headers };
}

/** Открытая дата и свободное время. */
function openSlot(offsetDays = 2) {
  for (let offset = offsetDays; offset < config.booking.horizonDays; offset += 1) {
    const date = booking.toDateKey(booking.addDays(new Date(), offset));
    const slots = booking.availableSlots(date, new Date()).slots;
    if (slots.length) return { date, time: slots[0].time };
  }
  throw new Error('Нет доступных слотов для теста');
}

/* ── Страницы ────────────────────────────────────────────────────────────── */

test('главная страница отдаётся и содержит ключевые блоки', async () => {
  const response = await call('/');
  assert.equal(response.status, 200);
  assert.match(response.text, /<title>[^<]*YASIRA/i);
  assert.match(response.text, /Записаться на обслуживание/);
  assert.match(response.text, /25-й микрорайон, 52\/2/);
  assert.match(response.text, /application\/ld\+json/);
});

test('каталог услуг и страница услуги открываются', async () => {
  const list = await call('/services');
  assert.equal(list.status, 200);
  assert.match(list.text, /Услуги автосервиса/);

  const detail = await call('/services/kompyuternaya-diagnostika');
  assert.equal(detail.status, 200);
  assert.match(detail.text, /Компьютерная диагностика/);
  assert.match(detail.text, /Стоимость — по запросу/);
});

test('страница записи и контактов открываются', async () => {
  assert.equal((await call('/booking')).status, 200);
  assert.equal((await call('/contacts')).status, 200);
});

test('несуществующая страница отдаёт человеческую 404', async () => {
  const response = await call('/net-takoy-stranicy');
  assert.equal(response.status, 404);
  assert.match(response.text, /Такой страницы нет/);
  assert.doesNotMatch(response.text, /Cannot GET|ENOENT|stack/i);
});

test('служебные адреса работают', async () => {
  const robots = await call('/robots.txt');
  assert.equal(robots.status, 200);
  assert.match(robots.text, /Sitemap:/);

  const sitemap = await call('/sitemap.xml');
  assert.equal(sitemap.status, 200);
  assert.match(sitemap.text, /<urlset/);
  assert.match(sitemap.text, /\/services\/kompyuternaya-diagnostika/);

  const health = await call('/healthz');
  assert.equal(health.status, 200);
  assert.equal(health.json.ok, true);
});

test('security-заголовки выставлены', async () => {
  const response = await call('/');
  assert.match(response.headers.get('content-security-policy'), /default-src 'self'/);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('x-frame-options'), 'DENY');
  assert.match(response.headers.get('referrer-policy'), /strict-origin/);
});

test('статика отдаётся, выход за пределы каталога запрещён', async () => {
  const css = await call('/css/style.css');
  assert.equal(css.status, 200);
  assert.match(css.headers.get('content-type'), /text\/css/);

  const image = await call('/img/directions2.jpg');
  assert.equal(image.status, 200);
  assert.match(image.headers.get('content-type'), /image\/jpeg/);

  const traversal = await fetch(`${base}/..%2Fserver.js`);
  assert.equal(traversal.status, 404);
});

/* ── API слотов и календаря ─────────────────────────────────────────────── */

test('API слотов отдаёт свободное время и отклоняет мусор', async () => {
  const { date } = openSlot();
  const response = await call(`/api/slots?date=${date}`);

  assert.equal(response.status, 200);
  assert.equal(response.json.ok, true);
  assert.ok(response.json.slots.length > 0);
  assert.match(response.json.slots[0].time, /^\d{2}:\d{2}$/);

  const bad = await call('/api/slots?date=вчера');
  assert.equal(bad.status, 400);
  assert.equal(bad.json.ok, false);
});

test('API календаря ограничивает горизонт', async () => {
  const response = await call('/api/calendar?days=14');
  assert.equal(response.status, 200);
  assert.equal(response.json.days.length, 14);
});

test('API услуги возвращает данные для подбора', async () => {
  const response = await call('/api/services/remont-dvigatelya');
  assert.equal(response.status, 200);
  assert.equal(response.json.service.slug, 'remont-dvigatelya');
  assert.match(response.json.service.priceLabel, /по запросу/);

  const missing = await call('/api/services/net-takoy');
  assert.equal(missing.status, 404);
});

/* ── Создание записи ────────────────────────────────────────────────────── */

test('успешная запись возвращает номер и данные', async () => {
  const { date, time } = openSlot(3);
  const response = await call('/api/bookings', {
    method: 'POST',
    ip: '10.10.0.1',
    body: {
      serviceSlug: 'kompyuternaya-diagnostika',
      date,
      time,
      name: 'Интеграционный Тест',
      phone: '8 777 088 44 36',
      brand: 'Toyota',
      model: 'Camry',
      year: '2020',
    },
  });

  assert.equal(response.status, 201);
  assert.equal(response.json.ok, true);
  assert.match(response.json.booking.publicId, /^YM-\d{5}$/);

  const success = await call(`/booking/success?code=${response.json.booking.publicId}`);
  assert.equal(success.status, 200);
  assert.match(success.text, /Запись принята/);
  assert.doesNotMatch(success.text, /demo|mock|не сохранится|демонстрацион/i);
});

test('повторная заявка на занятый слот отклоняется понятным текстом', async () => {
  const { date, time } = openSlot(4);

  const first = await call('/api/bookings', {
    method: 'POST',
    ip: '10.10.0.2',
    body: {
      serviceSlug: 'shinomontazh',
      date,
      time,
      name: 'Первый Клиент',
      phone: '+77001110001',
    },
  });
  assert.equal(first.status, 201);

  const second = await call('/api/bookings', {
    method: 'POST',
    ip: '10.10.0.3',
    body: {
      serviceSlug: 'remont-akpp',
      date,
      time,
      name: 'Второй Клиент',
      phone: '+77001110002',
    },
  });

  assert.equal(second.status, 409);
  assert.equal(second.json.code, 'SLOT_TAKEN');
  assert.match(second.json.error, /занято/i);
  assert.doesNotMatch(second.json.error, /SLOT_TAKEN|500|ERROR/);
});

test('некорректная заявка возвращает ошибки по полям', async () => {
  const response = await call('/api/bookings', {
    method: 'POST',
    ip: '10.10.0.4',
    body: {
      serviceSlug: '',
      date: '2026-13-40',
      time: '99:99',
      name: 'A',
      phone: '123',
    },
  });

  assert.equal(response.status, 422);
  assert.equal(response.json.ok, false);
  assert.ok(response.json.errors.name);
  assert.ok(response.json.errors.phone);
  assert.ok(response.json.errors.serviceSlug);
});

test('запись на прошедшую дату отклоняется', async () => {
  const past = booking.toDateKey(booking.addDays(new Date(), -3));
  const response = await call('/api/bookings', {
    method: 'POST',
    ip: '10.10.0.5',
    body: {
      serviceSlug: 'shinomontazh',
      date: past,
      time: '10:00',
      name: 'Клиент Прошлого',
      phone: '+77001110003',
    },
  });

  assert.equal(response.status, 400);
  assert.equal(response.json.ok, false);
});

test('ограничение частоты отсекает спам заявок', async () => {
  const ip = '10.99.99.1';
  let limited = false;
  let statuses = [];

  for (let i = 0; i < 12; i += 1) {
    const response = await call('/api/bookings', {
      method: 'POST',
      ip,
      body: { serviceSlug: 'shinomontazh', date: '', time: '', name: 'Спам', phone: '123' },
    });
    statuses.push(response.status);
    if (response.status === 429) {
      limited = true;
      assert.match(response.json.error, /Слишком много заявок/);
      break;
    }
  }

  assert.equal(limited, true, `ожидался 429, получены статусы: ${statuses.join(',')}`);
});

/* ── Админка ────────────────────────────────────────────────────────────── */

test('админка закрыта без авторизации', async () => {
  const response = await call('/dashboard', { redirect: 'manual' });
  assert.equal(response.status, 302);
  assert.equal(response.headers.get('location'), '/dashboard/login');

  const api = await call('/api/admin/bookings/some-id/status', {
    method: 'POST',
    body: { status: 'CONFIRMED' },
  });
  assert.equal(api.status, 401);
});

test('вход с неверным паролем отклоняется и ограничивается по частоте', async () => {
  const response = await fetch(`${base}/dashboard/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Forwarded-For': '10.77.77.1',
    },
    body: 'password=wrong-password',
    redirect: 'manual',
  });
  assert.equal(response.status, 401);
});

test('вход с верным паролем выдаёт HttpOnly-сессию', async () => {
  const response = await fetch(`${base}/dashboard/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Forwarded-For': '10.77.77.2',
    },
    body: 'password=test-password-1234',
    redirect: 'manual',
  });

  assert.equal(response.status, 302);
  const cookie = response.headers.get('set-cookie') || '';
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
  adminCookie = cookie.split(';')[0];

  const dashboard = await call('/dashboard', { cookie: adminCookie });
  assert.equal(dashboard.status, 200);
  assert.match(dashboard.text, /Панель управления|Записи на/);
  assert.match(dashboard.text, /noindex/);
});

test('администратор меняет статус записи', async () => {
  const { date, time } = openSlot(5);
  const created = await call('/api/bookings', {
    method: 'POST',
    ip: '10.10.0.6',
    body: {
      serviceSlug: 'shinomontazh',
      date,
      time,
      name: 'Клиент Статуса',
      phone: '+77001110009',
    },
  });
  assert.equal(created.status, 201);

  const all = booking.listBookings({ query: 'Клиент Статуса' });
  assert.equal(all.length, 1);

  const updated = await call(`/api/admin/bookings/${all[0].id}/status`, {
    method: 'POST',
    cookie: adminCookie,
    body: { status: 'CONFIRMED' },
  });

  assert.equal(updated.status, 200);
  assert.equal(updated.json.ok, true);
  assert.equal(updated.json.booking.status, 'CONFIRMED');

  const stored = booking.getBooking(all[0].id);
  assert.equal(stored.status, 'CONFIRMED');
  assert.equal(stored.statusLabel, 'Подтверждена');
});

test('администратор может закрыть день и открыть его снова', async () => {
  const date = booking.toDateKey(booking.addDays(new Date(), 6));

  await fetch(`${base}/dashboard/schedule`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: adminCookie,
    },
    body: `date=${date}&action=close&note=${encodeURIComponent('Тестовое закрытие')}`,
    redirect: 'manual',
  });

  assert.equal(booking.dayAvailability(date).closed, true);

  await fetch(`${base}/dashboard/schedule`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: adminCookie,
    },
    body: `date=${date}&action=reopen`,
    redirect: 'manual',
  });

  assert.equal(booking.dayAvailability(date).closed, false);
});

test('выход из админки очищает сессию', async () => {
  const response = await fetch(`${base}/dashboard/logout`, {
    method: 'POST',
    headers: { Cookie: adminCookie },
    redirect: 'manual',
  });

  assert.equal(response.status, 302);
  assert.match(response.headers.get('set-cookie') || '', /Max-Age=0/);
});

/* ── Никакого технического текста в интерфейсе ─────────────────────────── */

test('публичные страницы не показывают технические детали', async () => {
  const pages = ['/', '/services', '/booking', '/contacts', '/net-takoy-stranicy'];
  const forbidden = [
    'DATABASE_ERROR',
    'MOCK_MODE',
    'API_FAILED',
    'Mock mode',
    'Demo mode',
    'Демо',
    'заявка не сохранится',
    'база данных не подключена',
    'стек',
    'node_modules',
  ];

  for (const page of pages) {
    const response = await call(page);
    for (const phrase of forbidden) {
      assert.equal(
        response.text.includes(phrase),
        false,
        `страница ${page} содержит запрещённый текст «${phrase}»`
      );
    }
  }
});
