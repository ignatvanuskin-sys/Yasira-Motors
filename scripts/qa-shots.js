'use strict';

/**
 * Скриншоты для визуальной проверки (node scripts/qa-shots.js).
 *
 * Снимаются отдельные экраны, а не полная страница: полностраничный кадр
 * сжимается до нечитаемого, и по нему нельзя судить о вёрстке.
 *
 * Сервер поднимается самим скриптом на свободном порту — так же, как в
 * scripts/qa.js, чтобы не зависеть от фонового процесса.
 */

const fs = require('node:fs');
const path = require('node:path');

const cdp = require('./lib/cdp');

const EXTERNAL = process.argv[2] ? process.argv[2].replace(/\/+$/, '') : '';
const OUT_DIR = path.resolve(__dirname, '..', 'qa-screenshots');
let BASE = EXTERNAL;

/** Что снимаем на десктопе: [маршрут, селектор секции или null, имя файла] */
const DESKTOP = [
  ['/', null, 'shot-desktop-hero'],
  ['/', '#about', 'shot-desktop-trust'],
  ['/', '#services', 'shot-desktop-services'],
  ['/', '.symptoms-section', 'shot-desktop-symptoms'],
  ['/', '#reviews', 'shot-desktop-reviews'],
  ['/', '#contacts', 'shot-desktop-contacts'],
  ['/', null, 'shot-desktop-final', '.final-cta'],
  ['/services', null, 'shot-desktop-catalog'],
  ['/services/remont-akpp', null, 'shot-desktop-service'],
  ['/contacts', null, 'shot-desktop-contacts-page'],
];

/** Что снимаем на телефоне */
const MOBILE = [
  ['/', null, 'shot-mobile-hero'],
  ['/', '#services', 'shot-mobile-services'],
  ['/', '.symptoms-section', 'shot-mobile-symptoms'],
  ['/', '#reviews', 'shot-mobile-reviews'],
  ['/', '#contacts', 'shot-mobile-contacts'],
  ['/services', null, 'shot-mobile-catalog'],
  ['/contacts', null, 'shot-mobile-contacts-page'],
];

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  if (!BASE) {
    const server = require('../server');
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    BASE = `http://127.0.0.1:${server.address().port}`;
    process.on('exit', () => server.close());
  }

  const session = await cdp.launch({
    port: 9500 + Math.floor(Math.random() * 300),
    width: 1440,
    height: 900,
  });
  const { page } = session;

  /** Переход на страницу и прокрутка к нужному месту. */
  async function go(route, selector) {
    await cdp.navigate(page, BASE + route);
    await cdp.evaluate(
      page,
      `(() => {
        document.documentElement.style.scrollBehavior = 'auto';
        const el = ${selector ? `document.querySelector(${JSON.stringify(selector)})` : 'null'};
        window.scrollTo(0, el ? el.getBoundingClientRect().top + window.pageYOffset - 70 : 0);
        return true;
      })()`
    );
    // Ждём, пока прокрутка реально встанет на место
    for (let i = 0; i < 12; i += 1) {
      await cdp.sleep(120);
      const stable = await cdp.evaluate(
        page,
        `(() => { const y = window.pageYOffset; return y === (window.__lastY ?? y) ? true : ((window.__lastY = y), false); })()`
      );
      if (stable) break;
    }
    // Раскрываем блоки с анимацией появления: снимаем вёрстку, а не анимацию
    await cdp.evaluate(
      page,
      `(() => {
        document.querySelectorAll('.category-card, .trust-card, .step, .review-card, .gallery-item, .rating-card')
          .forEach((el) => {
            if (getComputedStyle(el).opacity === '0') {
              el.style.opacity = '1';
              el.style.transform = 'none';
            }
          });
        return true;
      })()`
    );
    await cdp.sleep(200);
  }

  const shots = [];

  console.log('Десктоп 1440×900:');
  await cdp.setViewport(page, 1440, 900);
  for (const [route, selector, name, extra] of DESKTOP) {
    await go(route, selector || extra || null);
    const file = await cdp.screenshot(page, path.join(OUT_DIR, `${name}.jpg`), { full: false });
    shots.push(path.basename(file));
    console.log('  ✓ ' + name);
  }

  console.log('Телефон 390×844:');
  await cdp.setViewport(page, 390, 844);
  for (const [route, selector, name] of MOBILE) {
    await go(route, selector);
    const file = await cdp.screenshot(page, path.join(OUT_DIR, `${name}.jpg`), { full: false });
    shots.push(path.basename(file));
    console.log('  ✓ ' + name);
  }

  await session.close();
  console.log(`\nСнято кадров: ${shots.length} → qa-screenshots/`);
})().catch((err) => {
  console.error('Скриншоты не сняты:', err.message);
  process.exit(1);
});
