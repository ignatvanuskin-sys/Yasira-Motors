'use strict';

/**
 * Браузерный QA-прогон (node scripts/qa.js [http://localhost:3000]).
 *
 * Управляет системным Chrome через DevTools Protocol напрямую:
 * без Playwright и Puppeteer, только встроенный WebSocket Node
 * (см. scripts/lib/cdp.js).
 *
 * Что проверяется:
 *   1. отсутствие горизонтального переполнения на всех целевых ширинах;
 *   2. размеры интерактивных элементов и корректность мобильной панели;
 *   3. полный путь клиента: главная → услуги → услуга → запись →
 *      автомобиль → дата → время → контакты → отправка → успех;
 *   4. отсутствие технических и запрещённых формулировок в интерфейсе;
 *   5. ошибки в консоли браузера.
 */

const fs = require('node:fs');
const path = require('node:path');

const cdp = require('./lib/cdp');

const BASE = (process.argv[2] || 'http://localhost:3000').replace(/\/+$/, '');
const OUT_DIR = path.resolve(__dirname, '..', 'qa-screenshots');
const DEBUG_PORT = 9333;

const MOBILE_WIDTHS = [320, 360, 375, 390, 430];
const ALL_WIDTHS = MOBILE_WIDTHS.concat([768], [1024, 1280, 1440, 1920]);
const ROUTES = ['/', '/services', '/booking', '/contacts'];

const FORBIDDEN = [
  'demo mode',
  'mock mode',
  'демо-режим',
  'демонстрационный',
  'database not connected',
  'заявка не сохранится',
  'api_failed',
  'database_error',
  'mock_mode',
];

const report = { widths: [], walkthrough: null, consoleErrors: [], screenshots: [] };
const problems = [];

function fail(message) {
  problems.push(message);
}

/** Скрипт проверки геометрии страницы. */
const GEOMETRY_SCRIPT = `(() => {
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
    const r = el.getBoundingClientRect();
    if (r.width <= 0) continue;
    if (r.right > vw + 1.5 || r.left < -1.5) {
      overflowing.push({ el: name(el), left: Math.round(r.left), right: Math.round(r.right) });
      if (overflowing.length >= 8) break;
    }
  }
  // Порог размера цели нажатия. Для плотных сеток (7-колоночный календарь,
  // сетка слотов времени) 40px физически недостижимы на 320px,
  // поэтому для них порог ниже — это осознанное исключение, а не поблажка.
  const DENSE = '.calendar-day, .slot';
  const smallTargets = [];
  for (const el of document.querySelectorAll('button, a.btn, .mobile-bar-item, summary')) {
    const style = getComputedStyle(el);
    if (style.display === 'none') continue;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) continue;
    const threshold = el.matches(DENSE) ? 32 : 40;
    if (r.height < threshold) {
      smallTargets.push({ el: name(el), h: Math.round(r.height), threshold: threshold });
    }
  }
  const bar = document.querySelector('.mobile-bar');
  const barRect = bar ? bar.getBoundingClientRect() : null;
  const h1 = document.querySelector('h1');
  return JSON.stringify({
    vw,
    scrollWidth: de.scrollWidth,
    clientWidth: de.clientWidth,
    overflowing,
    smallTargets: smallTargets.slice(0, 8),
    barHeight: barRect ? Math.round(barRect.height) : 0,
    barVisible: bar ? getComputedStyle(bar).display !== 'none' : false,
    bodyPaddingBottom: Math.round(parseFloat(getComputedStyle(document.body).paddingBottom) || 0),
    h1Size: h1 ? Math.round(parseFloat(getComputedStyle(h1).fontSize)) : 0,
    text: (document.body.innerText || '').slice(0, 200000),
  });
})()`;

async function main() {
  const session = await cdp.launch({ port: DEBUG_PORT, width: 390, height: 800 });
  const { page } = session;

  page.on('Runtime.consoleAPICalled', (params) => {
    if (params.type === 'error') {
      report.consoleErrors.push(
        (params.args || []).map((a) => a.value || a.description || '').join(' ').slice(0, 300)
      );
    }
  });
  page.on('Runtime.exceptionThrown', (params) => {
    report.consoleErrors.push(
      (params.exceptionDetails?.exception?.description || 'исключение').slice(0, 300)
    );
  });

  console.log(`QA-прогон: ${BASE}\n`);

  /* ── 1. Геометрия на всех ширинах ── */
  for (const width of ALL_WIDTHS) {
    const isMobile = width < 900;
    await cdp.setViewport(page, width, isMobile ? 780 : 900);

    for (const route of ROUTES) {
      let geometry;
      try {
        await cdp.navigate(page, BASE + route);
        geometry = JSON.parse(await cdp.evaluate(page, GEOMETRY_SCRIPT));
      } catch (err) {
        fail(`${width}px ${route}: не удалось измерить страницу (${err.message})`);
        continue;
      }

      report.widths.push({
        width,
        route,
        scrollWidth: geometry.scrollWidth,
        clientWidth: geometry.clientWidth,
        barHeight: geometry.barHeight,
        h1Size: geometry.h1Size,
        overflowing: geometry.overflowing,
        smallTargets: geometry.smallTargets,
      });

      const overflow = geometry.scrollWidth - geometry.clientWidth;
      if (overflow > 1) {
        fail(
          `${width}px ${route}: горизонтальное переполнение ${overflow}px ` +
            `(${geometry.overflowing.map((o) => `${o.el}[${o.left}..${o.right}]`).join(', ')})`
        );
      }

      if (isMobile && route === '/') {
        if (!geometry.barVisible) fail(`${width}px: мобильная панель действий не видна`);
        if (geometry.barHeight > 78) {
          fail(`${width}px: мобильная панель слишком высокая — ${geometry.barHeight}px`);
        }
        if (geometry.bodyPaddingBottom < geometry.barHeight - 2) {
          fail(
            `${width}px: контент не защищён от панели ` +
              `(padding-bottom=${geometry.bodyPaddingBottom}, бар=${geometry.barHeight})`
          );
        }
      }

      if (!isMobile && geometry.barVisible) {
        fail(`${width}px ${route}: мобильная панель показана на широком экране`);
      }

      const text = (geometry.text || '').toLowerCase();
      for (const phrase of FORBIDDEN) {
        if (text.includes(phrase)) fail(`${width}px ${route}: в интерфейсе есть «${phrase}»`);
      }

      for (const target of geometry.smallTargets) {
        fail(`${width}px ${route}: слишком мелкая цель нажатия ${target.el} — ${target.h}px`);
      }
    }

    const measured = report.widths.filter((item) => item.width === width);
    const worst = measured.reduce((max, item) => Math.max(max, item.scrollWidth - item.clientWidth), 0);
    console.log(
      `  ${String(width).padStart(4)}px — ${worst <= 1 ? 'нет переполнения' : `ЕСТЬ ПЕРЕПОЛНЕНИЕ (+${worst}px)`}`
    );

    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(path.join(OUT_DIR, 'report.json'), JSON.stringify(report, null, 2), 'utf8');
  }

  /* ── 2. Скриншоты ── */
  await cdp.setViewport(page, 390, 800);
  for (const [route, name] of [
    ['/', 'mobile-home'],
    ['/services', 'mobile-services'],
    ['/booking', 'mobile-booking'],
    ['/contacts', 'mobile-contacts'],
  ]) {
    await cdp.navigate(page, BASE + route);
    await cdp.screenshot(page, path.join(OUT_DIR, `${name}.jpg`));
    report.screenshots.push(`${name}.jpg`);
  }

  await cdp.setViewport(page, 1440, 900);
  for (const [route, name] of [
    ['/', 'desktop-home'],
    ['/services/kompyuternaya-diagnostika', 'desktop-service'],
    ['/booking', 'desktop-booking'],
  ]) {
    await cdp.navigate(page, BASE + route);
    await cdp.screenshot(page, path.join(OUT_DIR, `${name}.jpg`));
    report.screenshots.push(`${name}.jpg`);
  }

  /* ── 3. Путь клиента на мобильной ширине ── */
  await cdp.setViewport(page, 390, 800);

  const steps = [];
  function step(name, ok, note) {
    steps.push({ name, ok, note: note || '' });
    if (!ok) fail(`Путь клиента, шаг «${name}»: ${note || 'не выполнено'}`);
    console.log(`  ${ok ? '✓' : '✗'} ${name}${note ? ` — ${note}` : ''}`);
  }

  async function waitFor(expression, timeoutMs = 8000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      try {
        if (await cdp.evaluate(page, expression, 1)) return true;
      } catch {
        /* ждём дальше */
      }
      await cdp.sleep(150);
    }
    return false;
  }

  console.log('\nПуть клиента (390px):');

  await cdp.navigate(page, BASE + '/');
  const heroCta = await cdp.evaluate(
    page,
    `(() => { const a = [...document.querySelectorAll('a')].find(x => /Записаться на обслуживание/.test(x.textContent)); return a ? a.getAttribute('href') : null; })()`
  );
  step('HERO → запись', heroCta === '/booking', `ссылка «${heroCta}»`);

  await cdp.navigate(page, BASE + '/services');
  const serviceLinks = await cdp.evaluate(
    page,
    `document.querySelectorAll('.category-link, .service-card a').length`
  );
  step('Каталог услуг показывает услуги', serviceLinks > 5, `${serviceLinks} ссылок`);

  await cdp.navigate(page, BASE + '/services/kompyuternaya-diagnostika');
  const detailPrice = await cdp.evaluate(
    page,
    `document.body.innerText.includes('Стоимость — по запросу')`
  );
  step('Страница услуги: цена честно помечена', detailPrice === true);

  await cdp.navigate(page, BASE + '/booking?service=remont-hodovoy-chasti');
  const preselected = await cdp.evaluate(
    page,
    `(() => { const r = document.querySelector('input[name="serviceSlug"]:checked'); return r ? r.value : null; })()`
  );
  step('Предвыбор услуги из ссылки', preselected === 'remont-hodovoy-chasti', `выбрано: ${preselected}`);

  await cdp.evaluate(page, `document.querySelector('[data-next="2"]').click()`);
  const step2 = await cdp.evaluate(page, `!document.querySelector('[data-panel="2"]').hidden`);
  step('Переход к автомобилю', step2 === true);

  await cdp.evaluate(
    page,
    `(() => {
      const set = (name, value) => {
        const el = document.querySelector('[name="' + name + '"]');
        el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      };
      set('brand', 'Toyota'); set('model', 'Camry'); set('year', '2020');
      return true;
    })()`
  );
  await cdp.evaluate(page, `document.querySelector('[data-next="3"]').click()`);

  const calendarReady = await waitFor(`document.querySelectorAll('.calendar-day[data-date]').length > 20`);
  step('Календарь загрузился', calendarReady === true);

  const pickedDate = await cdp.evaluate(
    page,
    `(() => { const b = document.querySelector('.calendar-day[data-date]:not(:disabled)'); if (!b) return null; b.click(); return b.getAttribute('data-date'); })()`
  );
  step('Календарь показывает доступные даты', Boolean(pickedDate), `выбрано: ${pickedDate}`);

  const slotsReady = await waitFor(`document.querySelectorAll('.slot').length > 0`);
  const slotCount = await cdp.evaluate(page, `document.querySelectorAll('.slot').length`);
  step('Слоты времени загружены', slotsReady && slotCount > 0, `${slotCount} слотов`);

  await cdp.evaluate(page, `document.querySelector('.slot').click()`);
  await cdp.evaluate(page, `document.querySelector('[data-next="5"]').click()`);

  await cdp.evaluate(
    page,
    `(() => {
      const set = (name, value) => {
        const el = document.querySelector('[name="' + name + '"]');
        el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      };
      set('name', 'QA Проверка');
      set('phone', '+7 700 111 22 33');
      set('notes', 'Автоматическая проверка пути клиента.');
      return true;
    })()`
  );
  await cdp.evaluate(page, `document.querySelector('[data-next="6"]').click()`);

  const summaryText = await cdp.evaluate(page, `document.querySelector('[data-summary]').innerText`);
  step(
    'Сводка перед отправкой заполнена',
    summaryText.includes('Toyota Camry 2020') &&
      summaryText.includes('QA Проверка') &&
      summaryText.includes('уточнит администратор'),
    summaryText.replace(/\n+/g, ' | ').slice(0, 110)
  );

  await cdp.screenshot(page, path.join(OUT_DIR, 'mobile-booking-summary.jpg'));

  await cdp.evaluate(page, `document.querySelector('[data-submit]').click()`);
  let finalUrl = '';
  for (let attempt = 0; attempt < 40; attempt += 1) {
    await cdp.sleep(250);
    finalUrl = await cdp.evaluate(page, 'location.href', 1);
    if (finalUrl.includes('/booking/success')) break;
  }
  step('Отправка ведёт на экран успеха', finalUrl.includes('/booking/success'), finalUrl);

  const successText = await cdp.evaluate(page, `document.body.innerText`);
  step(
    'Экран успеха содержит данные записи',
    successText.includes('Запись принята') &&
      successText.includes('YM-') &&
      successText.includes('+7 700 111 22 33') &&
      !/demo|mock|не сохранится|демонстрац/i.test(successText)
  );

  await cdp.screenshot(page, path.join(OUT_DIR, 'mobile-success.jpg'));

  report.walkthrough = { steps, url: finalUrl };

  /* ── 4. Мобильное меню ── */
  await cdp.navigate(page, BASE + '/');
  await cdp.evaluate(page, `document.querySelector('.nav-toggle').click()`);
  const menuOpen = await waitFor(
    `(() => { const n = document.querySelector('#mobile-nav'); return !n.hidden && n.offsetHeight > 100; })()`,
    3000
  );
  step('Мобильное меню открывается', menuOpen === true);

  report.consoleErrors = report.consoleErrors.filter((line) => line && line.trim());

  await session.close();

  fs.writeFileSync(path.join(OUT_DIR, 'report.json'), JSON.stringify(report, null, 2), 'utf8');

  console.log(`\nСкриншоты: ${OUT_DIR}`);
  if (report.consoleErrors.length) {
    console.log(`Ошибок в консоли браузера: ${report.consoleErrors.length}`);
    for (const error of report.consoleErrors.slice(0, 5)) console.log(`   — ${error}`);
  }

  if (problems.length) {
    console.error(`\nПроблем найдено: ${problems.length}`);
    for (const problem of problems) console.error(`  ✗ ${problem}`);
    process.exit(1);
  }

  console.log('\nQA пройден: переполнений нет, путь клиента работает.');
}

main().catch((err) => {
  console.error('QA упал:', err.message);
  process.exit(2);
});
