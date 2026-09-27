'use strict';

/**
 * Часовой пояс сервиса.
 *
 * Сервис работает в Актау (UTC+5). На хостингах процесс часто запускается
 * в UTC, а Vercel запрещает переопределять системную переменную TZ через API.
 * Поэтому пояс переключается здесь — до первого обращения к Date, иначе
 * Node закэширует пояс при инициализации и слоты записи сместятся на 5 часов.
 *
 * Переопределяется переменной SITE_TZ, если сервис когда-нибудь переедет.
 */
if (!process.env.TZ || process.env.TZ === 'UTC') {
  process.env.TZ = process.env.SITE_TZ || 'Asia/Aqtau';
}

/**
 * YASIRA MOTORS — HTTP-сервер.
 *
 * Без фреймворков и внешних зависимостей: маршрутизация, статика,
 * API и админка реализованы на node:http. Это осознанный выбор —
 * на хостинге нечего собирать, нечему ломаться при обновлении пакетов,
 * а весь код прозрачен.
 */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');

const config = require('./src/config');
const store = require('./src/lib/store');
const bookingLib = require('./src/lib/booking');
const validate = require('./src/lib/validate');
const ratelimit = require('./src/lib/ratelimit');
const session = require('./src/lib/session');
const notify = require('./src/lib/notify');
const context = require('./src/lib/context');
const seo = require('./src/lib/seo');
const { SERVICES, getService } = require('./src/content/services');

const { renderHome } = require('./src/views/home');
const { renderServices } = require('./src/views/services');
const { renderServiceDetail } = require('./src/views/serviceDetail');
const { renderBooking, renderBookingSuccess } = require('./src/views/booking');
const { renderContacts } = require('./src/views/contacts');
const { renderLogin, renderDashboard } = require('./src/views/dashboard');
const { renderNotFound, renderServerError } = require('./src/views/notfound');

/* ──────────────────────────────── константы ─────────────────────────────── */

const MAX_BODY_BYTES = 64 * 1024;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

/** Кэширование статики: картинки — долго, код — до перезапуска. */
function cacheControl(ext) {
  if (['.png', '.jpg', '.jpeg', '.webp', '.svg', '.ico', '.woff2'].includes(ext)) {
    return 'public, max-age=604800, stale-while-revalidate=86400';
  }
  return 'public, max-age=3600';
}

/* ──────────────────────────── вспомогательные ───────────────────────────── */

/** Определяет IP клиента (учитывает прокси хостинга). */
function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

/** Безопасные заголовки ответа. */
function securityHeaders(res, nonce) {
  const csp = [
    "default-src 'self'",
    `script-src 'self'${nonce ? ` 'nonce-${nonce}'` : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "form-action 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
  ].join('; ');

  res.setHeader('Content-Security-Policy', csp);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  if (config.nodeEnv === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
}

/** Читает тело запроса с ограничением размера. */
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(Object.assign(new Error('payload too large'), { code: 'PAYLOAD_TOO_LARGE' }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

/** Разбирает тело: JSON или form-urlencoded. */
function parseBody(raw, contentType) {
  if (!raw) return {};
  if (String(contentType || '').includes('application/json')) {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  const params = new URLSearchParams(raw);
  const out = {};
  for (const [key, value] of params) out[key] = value;
  return out;
}

function sendHtml(res, status, html, extraHeaders) {
  // String() нужен, потому что шаблоны возвращают помеченный фрагмент.
  const body = Buffer.from(String(html), 'utf8');
  res.writeHead(
    status,
    Object.assign(
      {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Length': body.length,
        'Cache-Control': status === 200 ? 'no-cache' : 'no-store',
      },
      extraHeaders || {}
    )
  );
  res.end(body);
}

function sendJson(res, status, payload) {
  const body = Buffer.from(JSON.stringify(payload), 'utf8');
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': body.length,
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function sendText(res, status, text, contentType) {
  const body = Buffer.from(text, 'utf8');
  res.writeHead(status, {
    'Content-Type': contentType || 'text/plain; charset=utf-8',
    'Content-Length': body.length,
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

/** Достаёт сущность для отображения услуги в подборе. */
function serviceForClient(service) {
  return {
    slug: service.slug,
    title: service.title,
    summary: service.summary,
    category: service.category,
    durationText: service.durationText,
    priceLabel: service.priceFrom
      ? `от ${new Intl.NumberFormat('ru-RU').format(service.priceFrom)} ₸`
      : 'Стоимость — по запросу',
    url: `/services/${service.slug}`,
  };
}

/* ────────────────────────────────── статика ─────────────────────────────── */

function serveStatic(req, res, pathname) {
  const relative = decodeURIComponent(pathname).replace(/^\/+/, '');
  const target = path.resolve(config.publicDir, relative);

  // Защита от выхода за пределы public/
  if (!target.startsWith(config.publicDir + path.sep) && target !== config.publicDir) {
    return false;
  }

  let stat;
  try {
    stat = fs.statSync(target);
  } catch {
    return false;
  }
  if (!stat.isFile()) return false;

  const ext = path.extname(target).toLowerCase();
  const etag = `W/"${stat.size}-${Number(stat.mtimeMs).toString(36)}"`;

  if (req.headers['if-none-match'] === etag) {
    res.writeHead(304, { ETag: etag, 'Cache-Control': cacheControl(ext) });
    res.end();
    return true;
  }

  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Content-Length': stat.size,
    'Cache-Control': cacheControl(ext),
    ETag: etag,
    'Last-Modified': stat.mtime.toUTCString(),
  });
  fs.createReadStream(target).pipe(res);
  return true;
}

/* ──────────────────────────────── маршруты ──────────────────────────────── */

/** Главная и простые страницы. */
function handlePage(res, html) {
  sendHtml(res, 200, html);
}

/** API: свободные слоты на дату. */
function apiSlots(res, url) {
  const date = url.searchParams.get('date') || '';
  if (!bookingLib.isValidDateKey(date)) {
    sendJson(res, 400, { ok: false, error: 'Некорректная дата.' });
    return;
  }
  const result = bookingLib.availableSlots(date);
  sendJson(res, 200, {
    ok: result.ok,
    date,
    reason: result.reason,
    open: result.open || null,
    close: result.close || null,
    slots: (result.slots || []).map((slot) => ({ time: slot.time })),
  });
}

/** API: календарь доступных дат. */
function apiCalendar(res, url) {
  const days = Math.min(60, Math.max(7, parseInt(url.searchParams.get('days') || '28', 10) || 28));
  sendJson(res, 200, { ok: true, days: bookingLib.calendar(new Date(), days) });
}

/** API: данные услуги для подбора. */
function apiService(res, slug) {
  const service = getService(slug);
  if (!service) {
    sendJson(res, 404, { ok: false, error: 'Услуга не найдена.' });
    return;
  }
  const related = SERVICES.filter(
    (s) => s.slug !== service.slug && s.category === service.category
  ).slice(0, 2);
  sendJson(res, 200, {
    ok: true,
    service: serviceForClient(service),
    related: related.map(serviceForClient),
  });
}

/** API: создание записи. */
async function apiCreateBooking(req, res) {
  const ip = clientIp(req);
  const limit = ratelimit.hit(`booking:${ip}`, { limit: 8, windowMs: 10 * 60 * 1000 });
  if (!limit.allowed) {
    sendJson(res, 429, {
      ok: false,
      error:
        'Слишком много заявок с этого устройства. Попробуйте позже или позвоните нам по телефону.',
    });
    return;
  }

  let body;
  try {
    body = parseBody(await readBody(req), req.headers['content-type']);
  } catch (err) {
    if (err.code === 'PAYLOAD_TOO_LARGE') {
      sendJson(res, 413, { ok: false, error: 'Слишком большой объём данных в заявке.' });
      return;
    }
    sendJson(res, 400, { ok: false, error: 'Не удалось прочитать данные заявки.' });
    return;
  }

  const validation = validate.validateBookingPayload(body);
  if (!validation.ok) {
    sendJson(res, 422, {
      ok: false,
      error: 'Проверьте заполнение полей — часть данных указана неверно.',
      errors: validation.errors,
    });
    return;
  }

  try {
    const result = await bookingLib.createBooking(validation.value, notify.notifyNewBooking);
    sendJson(res, 201, {
      ok: true,
      duplicate: result.duplicate,
      booking: {
        publicId: result.booking.publicId,
        serviceTitle: result.booking.serviceTitle,
        date: result.booking.date,
        time: result.booking.time,
        fullDate: result.booking.fullDate,
        statusLabel: result.booking.statusLabel,
      },
    });
  } catch (err) {
    if (err instanceof bookingLib.BookingError) {
      sendJson(res, err.httpStatus, { ok: false, code: err.code, error: err.userMessage });
      return;
    }
    console.error('[api] Ошибка создания записи:', err);
    sendJson(res, 500, {
      ok: false,
      error:
        'Не удалось отправить заявку. Попробуйте ещё раз или свяжитесь с нами по телефону.',
    });
  }
}

/* ────────────────────────────────── админка ─────────────────────────────── */

function requireAdmin(req, res) {
  const admin = session.adminFromRequest(req);
  if (!admin) {
    sendHtml(res, 302, renderLogin(), { Location: '/dashboard/login' });
    return null;
  }
  return admin;
}

function dashboardData(url) {
  const tab = url.searchParams.get('tab') || 'today';
  const now = new Date();
  const today = bookingLib.toDateKey(now);
  let date = url.searchParams.get('date') || today;
  if (!bookingLib.isValidDateKey(date)) date = today;

  const statusParam = url.searchParams.get('status') || '';
  const query = (url.searchParams.get('q') || '').slice(0, 60);
  const filter = {
    status: statusParam && bookingLib.STATUS[statusParam] ? [statusParam] : [],
    query,
  };

  let bookings;
  if (tab === 'calendar') {
    bookings = bookingLib.listBookings({ from: date, to: date, ...filter });
  } else if (tab === 'services' || tab === 'slots') {
    bookings = bookingLib.listBookings({});
  } else {
    bookings = bookingLib.listBookings({ from: today, to: today, ...filter });
  }

  return {
    tab,
    date,
    filter,
    bookings,
    summary: bookingLib.summary(now),
    schedule: store
      .read()
      .scheduleOverrides.slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 40),
  };
}

/* ───────────────────────────────── маршрутизация ────────────────────────── */

async function route(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname.replace(/\/+$/, '') || '/';
  const method = req.method || 'GET';

  /* Статика (кроме /api и /dashboard — их обрабатываем ниже). */
  if (method === 'GET' || method === 'HEAD') {
    if (serveStatic(req, res, url.pathname)) return;
  }

  /* ── API ── */
  if (pathname === '/api/slots' && method === 'GET') return apiSlots(res, url);
  if (pathname === '/api/calendar' && method === 'GET') return apiCalendar(res, url);
  if (pathname.startsWith('/api/services/') && method === 'GET') {
    return apiService(res, decodeURIComponent(pathname.replace('/api/services/', '')));
  }
  if (pathname === '/api/bookings' && method === 'POST') return apiCreateBooking(req, res);

  if (pathname.startsWith('/api/admin/bookings/') && pathname.endsWith('/status') && method === 'POST') {
    if (!session.adminFromRequest(req)) {
      return sendJson(res, 401, { ok: false, error: 'Нужно войти в панель заново.' });
    }
    const id = pathname.replace('/api/admin/bookings/', '').replace('/status', '');
    try {
      const body = parseBody(await readBody(req), req.headers['content-type']);
      const updated = await bookingLib.updateStatus(
        decodeURIComponent(id),
        String(body.status || '')
      );
      return sendJson(res, 200, { ok: true, booking: { id: updated.id, status: updated.status } });
    } catch (err) {
      if (err instanceof bookingLib.BookingError) {
        return sendJson(res, err.httpStatus, { ok: false, error: err.userMessage });
      }
      console.error('[api] Ошибка смены статуса:', err);
      return sendJson(res, 500, { ok: false, error: 'Не удалось изменить статус записи.' });
    }
  }

  /* ── Админка ── */
  if (pathname === '/dashboard/login') {
    if (method === 'GET') return handlePage(res, renderLogin());

    if (method === 'POST') {
      const ip = clientIp(req);
      const limit = ratelimit.hit(`login:${ip}`, { limit: 6, windowMs: 15 * 60 * 1000 });
      if (!limit.allowed) {
        return sendHtml(res, 429, renderLogin({
          error: `Слишком много попыток входа. Повторите через ${Math.ceil(
            limit.retryAfterSec / 60
          )} мин.`,
        }));
      }
      const body = parseBody(await readBody(req), req.headers['content-type']);
      if (!session.verifyPassword(body.password)) {
        return sendHtml(res, 401, renderLogin({ error: 'Неверный пароль.' }));
      }
      ratelimit.reset(`login:${ip}`);
      return sendHtml(res, 302, '', {
        Location: '/dashboard',
        'Set-Cookie': session.sessionCookie(session.issue('admin')),
      });
    }
  }

  if (pathname === '/dashboard/logout' && method === 'POST') {
    return sendHtml(res, 302, '', {
      Location: '/dashboard/login',
      'Set-Cookie': session.clearCookie(),
    });
  }

  if (pathname === '/dashboard') {
    if (!session.adminFromRequest(req)) {
      return sendHtml(res, 302, '', { Location: '/dashboard/login' });
    }
    let message = '';
    if (url.searchParams.get('saved') === '1') message = 'Изменения сохранены.';
    return handlePage(res, renderDashboard(Object.assign(dashboardData(url), { message })));
  }

  if (pathname === '/dashboard/schedule' && method === 'POST') {
    if (!session.adminFromRequest(req)) {
      return sendHtml(res, 302, '', { Location: '/dashboard/login' });
    }
    const body = parseBody(await readBody(req), req.headers['content-type']);
    const date = validate.clean(body.date, 10);
    const action = validate.clean(body.action, 20);

    if (bookingLib.isValidDateKey(date)) {
      await store.withLock(() => {
        const db = store.read();
        db.scheduleOverrides = db.scheduleOverrides.filter((o) => o.date !== date);
        if (action === 'save') {
          db.scheduleOverrides.push({
            date,
            open: validate.clean(body.open, 5) || '09:00',
            close: validate.clean(body.close, 5) || '20:00',
            capacity: Math.min(20, Math.max(1, parseInt(body.capacity, 10) || config.booking.capacity)),
            note: validate.clean(body.note, 120),
          });
        } else if (action === 'close') {
          db.scheduleOverrides.push({
            date,
            closed: true,
            note: validate.clean(body.note, 120) || 'Сервис не работает',
          });
        }
        // action === 'reopen' — просто удалили переопределение выше
      });
    }
    return sendHtml(res, 302, '', { Location: `/dashboard?tab=slots&date=${encodeURIComponent(date)}&saved=1` });
  }

  /* ── Публичные страницы ── */
  if (method === 'GET' || method === 'HEAD') {
    if (pathname === '/') return handlePage(res, renderHome());
    if (pathname === '/services') return handlePage(res, renderServices());

    if (pathname.startsWith('/services/')) {
      const slug = decodeURIComponent(pathname.replace('/services/', ''));
      const service = getService(slug);
      if (service) return handlePage(res, renderServiceDetail(service));
      return sendHtml(res, 404, renderNotFound('/services/' + slug));
    }

    if (pathname === '/booking') {
      const preselect = url.searchParams.get('service') || '';
      const service = preselect ? getService(preselect) : null;
      return handlePage(res, renderBooking({ preselectedService: service ? service.slug : '' }));
    }

    if (pathname === '/booking/success') {
      const code = (url.searchParams.get('code') || '').slice(0, 20);
      const booking = code ? bookingLib.getBooking(code) : null;
      return handlePage(
        res,
        renderBookingSuccess({ booking: booking || {}, notFound: !booking })
      );
    }

    if (pathname === '/contacts') return handlePage(res, renderContacts());

    if (pathname === '/sitemap.xml') {
      return sendText(res, 200, buildSitemap(), 'application/xml; charset=utf-8');
    }

    if (pathname === '/robots.txt') {
      const lines = [
        'User-agent: *',
        'Allow: /',
        'Disallow: /dashboard',
        'Disallow: /booking/success',
        'Disallow: /api/',
        '',
        `Host: ${config.siteUrl}`,
        `Sitemap: ${config.siteUrl}/sitemap.xml`,
        '',
      ];
      return sendText(res, 200, lines.join('\n'));
    }

    if (pathname === '/healthz') {
      return sendJson(res, 200, { ok: true, status: 'healthy' });
    }

    return sendHtml(res, 404, renderNotFound(pathname));
  }

  return sendJson(res, 405, { ok: false, error: 'Метод не поддерживается.' });
}

/** Карта сайта. */
function buildSitemap() {
  const today = bookingLib.toDateKey(new Date());
  const entries = seo.sitemapEntries(SERVICES);
  const urls = entries
    .map(
      (entry) =>
        `  <url>\n    <loc>${seo.url(entry.loc)}</loc>\n    <lastmod>${today}</lastmod>\n` +
        `    <changefreq>${entry.changefreq}</changefreq>\n    <priority>${entry.priority}</priority>\n  </url>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/* ────────────────────────────────── сервер ──────────────────────────────── */

const server = http.createServer((req, res) => {
  const nonce = context.newNonce();

  context.run({ nonce, startedAt: Date.now() }, () => {
    securityHeaders(res, nonce);

    const done = () => {
      const ms = Date.now() - context.current().startedAt;
      if (config.nodeEnv !== 'test') {
        console.log(`${req.method} ${req.url} → ${res.statusCode} ${ms}ms`);
      }
    };

    res.on('finish', done);

    Promise.resolve()
      .then(() => route(req, res))
      .catch((err) => {
        console.error('[server] Необработанная ошибка:', err);
        if (!res.headersSent) {
          sendHtml(res, 500, renderServerError());
        } else {
          res.end();
        }
      });
  });
});

/* Перезапуск не должен оставлять блокировку хранилища. */
process.on('SIGTERM', () => shutdown());
process.on('SIGINT', () => shutdown());

function shutdown() {
  try {
    fs.rmSync(`${config.dataFile}.lock`, { force: true });
  } catch {
    /* блокировки нет — это нормально */
  }
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 3000).unref();
}

/* Слушаем порт только при прямом запуске: при импорте (тесты, serverless)
   сервер не должен занимать порт сам. */
if (require.main === module) {
  store.load();
  server.listen(config.port, () => {
    console.log(`YASIRA MOTORS — сервер запущен: http://localhost:${config.port}`);
    console.log(`Режим: ${config.nodeEnv}`);
    console.log(
      `Уведомления Telegram: ${config.telegram.enabled ? 'включены' : 'отключены (нет TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID)'}`
    );
    if (!config.admin.password) {
      console.warn(
        'ВНИМАНИЕ: ADMIN_PASSWORD не задан — вход в /dashboard невозможен. Задайте пароль в .env.'
      );
    }
  });
}

module.exports = server;
module.exports.createServer = () => server;
