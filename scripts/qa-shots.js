'use strict';

/**
 * Скриншоты для визуальной проверки (node scripts/qa-shots.js).
 *
 * Снимает НЕ полную страницу, а отдельные экраны: полностраничный снимок
 * главной сжимается до нечитаемого, и по нему нельзя судить о вёрстке.
 * Здесь каждый кадр — размером с реальный экран пользователя.
 */

const fs = require('node:fs');
const path = require('node:path');

const cdp = require('./lib/cdp');
const config = require('../src/config');

const BASE = (process.argv[2] || 'http://localhost:3000').replace(/\/+$/, '');
const OUT_DIR = path.resolve(__dirname, '..', 'qa-screenshots');
const PORT = 9366;

async function main() {
  const session = await cdp.launch({ port: PORT, width: 1440, height: 900 });
  const { page } = session;
  const shots = [];

  async function viewport(width, height) {
    await cdp.setViewport(page, width, height);
  }

  async function go(route) {
    await cdp.navigate(page, BASE + route);
  }

  /**
   * Прокручивает к секции и снимает экран.
   *
   * Плавная прокрутка (scroll-behavior: smooth) делает снимок
   * недостоверным: кадр снимается в середине анимации. Поэтому поведение
   * переключается на мгновенное, а позиция проверяется по факту.
   */
  async function shootSection(route, selector, name) {
    await go(route);
    await cdp.evaluate(
      page,
      `(() => {
        document.documentElement.style.scrollBehavior = 'auto';
        const el = ${selector ? `document.querySelector('${selector}')` : 'null'};
        const top = el ? el.getBoundingClientRect().top + window.pageYOffset - 72 : 0;
        window.scrollTo(0, Math.max(0, top));
        return Math.round(window.pageYOffset);
      })()`
    );
    // Ждём, пока позиция стабилизируется (ленивые картинки, шрифты).
    let previous = -1;
    for (let attempt = 0; attempt < 12; attempt += 1) {
      await cdp.sleep(120);
      const current = await cdp.evaluate(page, 'Math.round(window.pageYOffset)', 1);
      if (current === previous) break;
      previous = current;
    }
    // Раскрываем блоки с анимацией появления: снимаем вёрстку, а не анимацию.
    await cdp.evaluate(
      page,
      `(() => {
        document.querySelectorAll('.service-card, .trust-item, .why-card, .step, .review-card, .gallery-item')
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

    const file = await cdp.screenshot(page, path.join(OUT_DIR, `${name}.jpg`), { full: false });
    shots.push(path.basename(file));
  }

  console.log('Снимки для десктопа (1440×900):');
  await viewport(1440, 900);
  const desktop = [
    ['/', null, 'shot-desktop-hero'],
    ['/', '#services', 'shot-desktop-services'],
    ['/', '#selector', 'shot-desktop-selector'],
    ['/', '#why', 'shot-desktop-why'],
    ['/', '#pricing', 'shot-desktop-pricing'],
    ['/', '#reviews', 'shot-desktop-reviews'],
    ['/', '#booking', 'shot-desktop-booking'],
    ['/', '#location', 'shot-desktop-location'],
    ['/', '#faq', 'shot-desktop-faq'],
    ['/services', null, 'shot-desktop-catalog'],
    ['/services/kompyuternaya-diagnostika', null, 'shot-desktop-service'],
    ['/booking', null, 'shot-desktop-wizard'],
    ['/contacts', null, 'shot-desktop-contacts'],
  ];
  for (const [route, selector, name] of desktop) {
    await shootSection(route, selector, name);
    console.log(`  ✓ ${name}`);
  }

  console.log('Снимки для телефона (390×844):');
  await viewport(390, 844);
  const mobile = [
    ['/', null, 'shot-mobile-hero'],
    ['/', '#services', 'shot-mobile-services'],
    ['/', '#selector', 'shot-mobile-selector'],
    ['/', '#pricing', 'shot-mobile-pricing'],
    ['/', '#reviews', 'shot-mobile-reviews'],
    ['/', '#booking', 'shot-mobile-booking-widget'],
    ['/', '#location', 'shot-mobile-location'],
    ['/', '#faq', 'shot-mobile-faq'],
    ['/services', null, 'shot-mobile-catalog'],
    ['/services/kompyuternaya-diagnostika', null, 'shot-mobile-service'],
    ['/booking', null, 'shot-mobile-wizard-step1'],
    ['/contacts', null, 'shot-mobile-contacts'],
  ];
  for (const [route, selector, name] of mobile) {
    await shootSection(route, selector, name);
    console.log(`  ✓ ${name}`);
  }

  /* Шаги мастера записи */
  console.log('Шаги записи (390×844):');
  await go('/booking?service=kompyuternaya-diagnostika');
  await cdp.evaluate(page, `document.querySelector('[data-next="2"]').click()`);
  await cdp.sleep(250);
  shots.push(path.basename(await cdp.screenshot(page, path.join(OUT_DIR, 'shot-mobile-wizard-vehicle.jpg'), { full: false })));
  console.log('  ✓ шаг «Автомобиль»');

  await cdp.evaluate(page, `document.querySelector('[data-next="3"]').click()`);
  for (let i = 0; i < 40; i += 1) {
    if (await cdp.evaluate(page, `document.querySelectorAll('.calendar-day[data-date]').length > 20`, 1)) break;
    await cdp.sleep(200);
  }
  await cdp.sleep(300);
  shots.push(path.basename(await cdp.screenshot(page, path.join(OUT_DIR, 'shot-mobile-wizard-calendar.jpg'), { full: false })));
  console.log('  ✓ шаг «Дата» (календарь)');

  await cdp.evaluate(page, `document.querySelector('.calendar-day[data-date]:not(:disabled)').click()`);
  for (let i = 0; i < 40; i += 1) {
    if (await cdp.evaluate(page, `document.querySelectorAll('.slot').length > 0`, 1)) break;
    await cdp.sleep(200);
  }
  await cdp.sleep(250);
  shots.push(path.basename(await cdp.screenshot(page, path.join(OUT_DIR, 'shot-mobile-wizard-slots.jpg'), { full: false })));
  console.log('  ✓ шаг «Время» (слоты)');

  /* Админка */
  console.log('Админка:');
  await cdp.setViewport(page, 1440, 900);
  await go('/dashboard/login');
  shots.push(path.basename(await cdp.screenshot(page, path.join(OUT_DIR, 'shot-admin-login.jpg'), { full: false })));
  console.log('  ✓ вход');

  if (config.admin.password) {
    await cdp.evaluate(
      page,
      `(() => {
        const input = document.querySelector('#password');
        input.value = ${JSON.stringify(config.admin.password)};
        input.form.submit();
        return true;
      })()`
    );
    await cdp.sleep(1200);
    shots.push(path.basename(await cdp.screenshot(page, path.join(OUT_DIR, 'shot-admin-dashboard.jpg'), { full: false })));
    console.log('  ✓ панель «Сегодня»');

    await go('/dashboard?tab=calendar');
    shots.push(path.basename(await cdp.screenshot(page, path.join(OUT_DIR, 'shot-admin-calendar.jpg'), { full: false })));
    console.log('  ✓ панель «Календарь»');

    await go('/dashboard?tab=slots');
    shots.push(path.basename(await cdp.screenshot(page, path.join(OUT_DIR, 'shot-admin-slots.jpg'), { full: false })));
    console.log('  ✓ панель «Расписание»');
  }

  await session.close();

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, 'shots.json'),
    JSON.stringify({ base: BASE, shots }, null, 2),
    'utf8'
  );
  console.log(`\nГотово: ${shots.length} снимков в ${OUT_DIR}`);
}

main().catch((err) => {
  console.error('Не удалось снять скриншоты:', err.message);
  process.exit(2);
});
