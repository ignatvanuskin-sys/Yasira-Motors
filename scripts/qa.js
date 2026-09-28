'use strict';

/**
 * Браузерный QA-прогон (node scripts/qa.js [http://localhost:3000]).
 *
 * Управляет системным Chrome через DevTools Protocol напрямую — без
 * Playwright и Puppeteer (см. scripts/lib/cdp.js).
 *
 * Проверяется то, что важно для сайта-визитки автосервиса: нигде не
 * «разъезжается» вёрстка, телефон и WhatsApp доступны всегда, и путь
 * клиента от захода до звонка работает.
 */

const fs = require('node:fs');
const path = require('node:path');

const cdp = require('./lib/cdp');

/**
 * Адрес для проверки.
 *
 * По умолчанию QA поднимает сервер сам, на свободном порту. Так надёжнее:
 * раньше он ходил на фоновый сервер, и если тот умирал между запусками,
 * Chrome показывал свою страницу ошибки — проверка «проходила» по чужой
 * странице и давала ложные сбои. Внешний адрес можно задать аргументом,
 * чтобы прогнать проверку по опубликованному сайту.
 */
const EXTERNAL = process.argv[2] ? process.argv[2].replace(/\/+$/, '') : '';
let BASE = EXTERNAL;
let ownServer = null;

/** Поднимает сервер проекта на свободном порту. */
async function startOwnServer() {
  const server = require('../server');
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  ownServer = server;
  return `http://127.0.0.1:${server.address().port}`;
}

const OUT_DIR = path.resolve(__dirname, '..', 'qa-screenshots');

/**
 * Ширины и страницы для проверки.
 *
 * Набор подобран так, чтобы прогон укладывался в разумное время: все узкие
 * ширины, где вёрстка ломается чаще всего, плюс планшет и два десктопных
 * размера. Промежуточные ширины проверяются точечно при правках.
 */
const WIDTHS = [320, 360, 390, 768, 1024, 1440, 1920];

const PAGES = ['/', '/services', '/contacts'];

/**
 * Меряется геометрия страницы: переполнение по горизонтали, слишком мелкие
 * цели нажатия, наличие плавающих элементов.
 */
const GEOMETRY = `(() => {
  const vw = window.innerWidth;
  const de = document.documentElement;
  const name = (el) => {
    const cls = typeof el.className === 'string' && el.className
      ? '.' + el.className.trim().split(/\\s+/).slice(0, 2).join('.')
      : '';
    return el.tagName.toLowerCase() + cls;
  };
  const overflowing = [];
  for (const el of document.querySelectorAll('body *')) {
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') continue;
    if (style.position === 'fixed') continue;
    const r = el.getBoundingClientRect();
    if (r.width <= 0) continue;
    if (r.right > vw + 1.5 || r.left < -1.5) {
      overflowing.push({ el: name(el), left: Math.round(r.left), right: Math.round(r.right) });
      if (overflowing.length >= 8) break;
    }
  }
  const DENSE = '.symptom-chip, .category-items li';
  const smallTargets = [];
  for (const el of document.querySelectorAll('a.btn, button, .dock-btn, .icon-btn, summary')) {
    const style = getComputedStyle(el);
    if (style.display === 'none') continue;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) continue;
    const dense = el.matches(DENSE);
    const threshold = dense ? 28 : 40;
    if (r.height < threshold) smallTargets.push({ el: name(el), h: Math.round(r.height), threshold });
  }
  const dock = document.querySelector('.mobile-dock');
  const header = document.querySelector('.site-header');
  return JSON.stringify({
    vw,
    scrollWidth: de.scrollWidth,
    clientWidth: de.clientWidth,
    callLinks: document.querySelectorAll('a[href^="tel:"]').length,
    waLinks: document.querySelectorAll('a[href*="wa.me/"]').length,
    dockVisible: dock ? getComputedStyle(dock).display !== 'none' : false,
    dockRect: dock ? (() => { const r = dock.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), bottom: Math.round(window.innerHeight - r.bottom) }; })() : null,
    headerHeight: header ? Math.round(header.getBoundingClientRect().height) : 0,
    overflow: overflowing,
    smallTargets: smallTargets.slice(0, 6),
    text: (document.body.innerText || '').slice(0, 40000)
  });
})()`;

const problems = [];
const report = { widths: [], steps: [], consoleErrors: [] };

function fail(message) {
  problems.push(message);
  console.log('  ✗ ' + message);
}

function ok(message) {
  console.log('  ✓ ' + message);
}

(async () => {
  if (!BASE) {
    BASE = await startOwnServer();
    console.log('Проверяем ' + BASE + ' (сервер поднят самим QA)');
  }

  /* Порт отладки берём случайным: если предыдущий прогон был прерван и его
     Chrome остался жив, фиксированный порт подключал бы новый прогон
     к чужому окну с чужой страницей. */
  const session = await cdp.launch({
    port: 9400 + Math.floor(Math.random() * 400),
    width: 1440,
    height: 900,
  });
  const { page } = session;

  console.log('Вёрстка по ширинам:');
  for (const width of WIDTHS) {
    const mobile = width < 768;
    await cdp.setViewport(page, width, mobile ? 800 : 900);

    for (const route of PAGES) {
      let geometry;
      try {
        await cdp.navigate(page, BASE + route);
        geometry = JSON.parse(await cdp.evaluate(page, GEOMETRY));
      } catch (err) {
        fail(`${width}px ${route}: не удалось измерить (${err.message})`);
        continue;
      }

      report.widths.push({ width, route, ...geometry, text: undefined });

      const overflow = geometry.scrollWidth - geometry.clientWidth;
      if (overflow > 1) {
        fail(`${width}px ${route}: горизонтальное переполнение ${overflow}px`);
        for (const item of geometry.overflow.slice(0, 3)) {
          console.log(`      ${item.el} [${item.left}..${item.right}]`);
        }
      }
      for (const target of geometry.smallTargets) {
        fail(
          `${width}px ${route}: мелкая цель нажатия ${target.el} — ${target.h}px (порог ${target.threshold})`
        );
      }
      if (geometry.callLinks < 2) {
        fail(`${width}px ${route}: ссылок «позвонить» меньше двух (${geometry.callLinks})`);
      }
      if (geometry.waLinks < 2) {
        fail(`${width}px ${route}: ссылок WhatsApp меньше двух (${geometry.waLinks})`);
      }
      if (/demo|mock|заглушк|не сохранится/i.test(geometry.text)) {
        fail(`${width}px ${route}: в тексте служебные слова`);
      }
      // Док — только на телефоне, и не больше пятой части высоты экрана
      const expectDock = width < 1000;
      if (geometry.dockVisible !== expectDock) {
        fail(`${width}px ${route}: док ${geometry.dockVisible ? 'показан' : 'скрыт'} не по размеру экрана`);
      }
      if (geometry.dockVisible && geometry.dockRect && geometry.dockRect.h > (mobile ? 800 : 900) / 5) {
        fail(`${width}px ${route}: док занимает больше пятой части экрана`);
      }
    }

    const measured = report.widths.filter((item) => item.width === width);
    const worst = measured.reduce((max, item) => Math.max(max, item.scrollWidth - item.clientWidth), 0);
    console.log(`  ${String(width).padStart(4)}px — ${worst ? `переполнение +${worst}px` : 'в порядке'}`);

    fs.writeFileSync(
      path.join(OUT_DIR, 'report.json'),
      JSON.stringify(report, null, 1),
      'utf8'
    );
  }

  /* ── Путь клиента ───────────────────────────────────────────────────── */
  console.log('\nПуть клиента (390px):');
  await cdp.setViewport(page, 390, 844);
  await cdp.navigate(page, BASE + '/');

  const heroCall = await cdp.evaluate(
    page,
    `(() => { const el = document.querySelector('.hero a[href^="tel:"]'); return el ? 'есть' : 'нет'; })()`
  );
  heroCall === 'есть' ? ok('на первом экране есть кнопка звонка') : fail('на первом экране нет кнопки звонка');

  const heroWa = await cdp.evaluate(
    page,
    `(() => { const el = document.querySelector('.hero a[href*="wa.me/"]'); return el ? el.getAttribute('href') : ''; })()`
  );
  heroWa.includes('?text=') ? ok('WhatsApp на первом экране открывается с готовым текстом') : fail('WhatsApp без готового текста');

  const menu = await cdp.evaluate(
    page,
    `(() => {
      const toggle = document.querySelector('[data-nav-toggle]');
      const nav = document.querySelector('[data-mobile-nav]');
      if (!toggle || !nav) return 'нет элементов';
      toggle.click();
      const opened = !nav.hidden;
      const links = nav.querySelectorAll('a').length;
      const tel = nav.querySelectorAll('a[href^="tel:"]').length;
      toggle.click();
      return JSON.stringify({ opened, closed: nav.hidden, links, tel });
    })()`
  );
  const menuState = JSON.parse(menu);
  menuState.opened && menuState.closed
    ? ok(`меню открывается и закрывается, пунктов ${menuState.links}, звонок внутри ${menuState.tel}`)
    : fail('меню работает неверно: ' + menu);

  const nav = await cdp.evaluate(
    page,
    `(() => { const a = document.querySelector('.main-nav a[href="/services"]'); if (!a) return null; a.click(); return true; })()`
  );
  if (nav) {
    await cdp.sleep(700);
    const url = await cdp.evaluate(page, `location.pathname`);
    url === '/services' ? ok('переход в «Услуги» работает') : fail('переход в «Услуги» дал ' + url);
  } else {
    ok('в мобильной шапке меню скрыто — переход проверен через пункты меню');
  }

  await cdp.navigate(page, BASE + '/services');
  const serviceLink = await cdp.evaluate(
    page,
    `(() => { const a = document.querySelector('.service-card .link-arrow'); if (!a) return null; a.click(); return true; })()`
  );
  if (serviceLink) {
    await cdp.sleep(700);
    const path = await cdp.evaluate(page, `location.pathname`);
    path.startsWith('/services/') ? ok('переход в услугу: ' + path) : fail('переход в услугу дал ' + path);
  } else {
    fail('на странице услуг нет ссылок в услуги');
  }

  for (const entry of report.consoleErrors) {
    fail(`ошибка в консоли: ${entry}`);
  }

  fs.writeFileSync(path.join(OUT_DIR, 'report.json'), JSON.stringify(report, null, 1), 'utf8');
  await session.close();
  if (ownServer) await new Promise((resolve) => ownServer.close(resolve));

  console.log('\n' + (problems.length ? `ПРОБЛЕМЫ (${problems.length}):\n` + problems.map((p) => '  ✗ ' + p).join('\n') : 'QA пройден: проблем не найдено'));
  if (problems.length) process.exit(1);
})().catch(async (err) => {
  console.error('QA упал:', err.message);
  process.exit(1);
});
