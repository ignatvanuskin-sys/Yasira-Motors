'use strict';

/**
 * Часовой пояс сервиса.
 *
 * Сервис работает в Актау (UTC+5). На хостингах процесс часто запускается
 * в UTC, а Vercel запрещает переопределять системную переменную TZ через API.
 * Поэтому пояс переключается здесь — до первого обращения к Date, иначе Node
 * закэширует пояс при инициализации и «открыто до 19:00» будет считаться
 * неверно.
 */
if (!process.env.TZ || process.env.TZ === 'UTC') {
  process.env.TZ = process.env.SITE_TZ || 'Asia/Aqtau';
}

/**
 * YASIRA MOTORS — HTTP-сервер.
 *
 * Сайт статический по своей природе: страницы рендерятся на сервере, форм
 * и базы нет. Из динамики — только определение «открыто ли сейчас» по
 * графику работы. Поэтому здесь нет ни API, ни хранилища, ни авторизации:
 * меньше поверхности — меньше того, что может сломаться на хостинге.
 *
 * Без фреймворков и зависимостей: маршрутизация и статика на node:http.
 */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');

const config = require('./src/config');
const context = require('./src/lib/context');
const seo = require('./src/lib/seo');
const { renderHome } = require('./src/views/home');
const { renderServices } = require('./src/views/services');
const { renderServiceDetail } = require('./src/views/serviceDetail');
const { renderContacts } = require('./src/views/contacts');
const { renderNotFound, renderError } = require('./src/views/notfound');

const PUBLIC_DIR = config.publicDir;
const MAX_STATIC_AGE = 60 * 60 * 24 * 30;

const MIME = {
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

/** Заголовки безопасности. */
function securityHeaders(nonce) {
  return {
    'Content-Security-Policy': [
      "default-src 'self'",
      `script-src 'self'${nonce ? ` 'nonce-${nonce}'` : ''}`,
      "style-src 'self'",
      "img-src 'self' data:",
      "font-src 'self'",
      "connect-src 'self'",
      "form-action 'none'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      /* Встраиваемая карта 2ГИС: без frame-src действует default-src 'self',
         и карта молча не загрузилась бы. */
      'frame-src https://widgets.2gis.com',
    ].join('; '),
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'DENY',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
  };
}

/** Ищет файл статики, защищаясь от выхода за пределы public/. */
function resolveStatic(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (decoded.includes('\0')) return null;

  const relative = decoded.replace(/^\/+/, '');
  const target = path.join(PUBLIC_DIR, relative);
  const root = path.resolve(PUBLIC_DIR);
  const resolved = path.resolve(target);

  // Выход за пределы каталога статики — отказ
  if (resolved !== root && !resolved.startsWith(root + path.sep)) return null;

  try {
    const stat = fs.statSync(resolved);
    if (!stat.isFile()) return null;
    return { file: resolved, stat };
  } catch {
    return null;
  }
}

function sendHtml(res, status, html, extraHeaders) {
  const body = Buffer.from(String(html), 'utf8');
  res.writeHead(status, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': body.length,
    ...securityHeaders(context.nonce()),
    ...(extraHeaders || {}),
  });
  res.end(body);
}

function sendText(res, status, text, type) {
  const body = Buffer.from(String(text), 'utf8');
  res.writeHead(status, {
    'Content-Type': type || 'text/plain; charset=utf-8',
    'Content-Length': body.length,
    ...(type === 'text/plain; charset=utf-8' ? {} : {}),
  });
  res.end(body);
}

function sendStatic(res, found) {
  const type = MIME[path.extname(found.file).toLowerCase()] || 'application/octet-stream';
  const body = fs.readFileSync(found.file);
  res.writeHead(200, {
    'Content-Type': type,
    'Content-Length': body.length,
    'Cache-Control': found.file.includes(`${path.sep}fonts${path.sep}`)
      ? `public, max-age=${MAX_STATIC_AGE}, immutable`
      : 'public, max-age=86400',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(body);
}

/** @param {http.IncomingMessage} req @param {http.ServerResponse} res */
async function handle(req, res) {
  const started = Date.now();
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname.replace(/\/+$/, '') || '/';

  res.on('finish', () => {
    console.log(`${req.method} ${url.pathname} → ${res.statusCode} (${Date.now() - started} ms)`);
  });

  try {
    // Только чтение: сайт ничего не принимает
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { Allow: 'GET, HEAD', 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Метод не поддерживается');
      return;
    }

    if (pathname === '/healthz') {
      sendText(res, 200, 'ok');
      return;
    }
    if (pathname === '/robots.txt') {
      sendText(res, 200, seo.robots(), 'text/plain; charset=utf-8');
      return;
    }
    if (pathname === '/sitemap.xml') {
      sendText(res, 200, seo.sitemap(), 'application/xml; charset=utf-8');
      return;
    }

    const found = resolveStatic(pathname);
    if (found) {
      sendStatic(res, found);
      return;
    }

    if (pathname === '/') {
      sendHtml(res, 200, renderHome());
      return;
    }
    if (pathname === '/services') {
      sendHtml(res, 200, renderServices());
      return;
    }
    if (pathname === '/contacts') {
      sendHtml(res, 200, renderContacts());
      return;
    }
    if (pathname.startsWith('/services/')) {
      const slug = pathname.slice('/services/'.length);
      const page = renderServiceDetail(slug);
      if (page) {
        sendHtml(res, 200, page);
        return;
      }
    }

    sendHtml(res, 404, renderNotFound(pathname));
  } catch (err) {
    console.error('[server] Необработанная ошибка:', err);
    try {
      sendHtml(res, 500, renderError());
    } catch {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Не удалось обработать запрос');
    }
  }
}

const server = http.createServer((req, res) => {
  const nonce = context.newNonce();
  context.run({ nonce }, () => handle(req, res));
});

/**
 * ЭКСПОРТ. На serverless-платформах (Vercel) модуль подключается как
 * обработчик — слушать порт в этом случае нельзя, порт назначает платформа.
 */
module.exports = server;
module.exports.createServer = () => server;

if (require.main === module) {
  server.listen(config.port, () => {
    const b = config.business;
    const status = config.openStatus();
    console.log(`${b.name}: сервер на http://localhost:${config.port}`);
    console.log(`Сейчас: ${status.label}, ${status.detail} (пояс ${process.env.TZ})`);
  });
}
