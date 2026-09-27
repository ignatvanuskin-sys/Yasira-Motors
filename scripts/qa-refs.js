'use strict';

/**
 * Снимки сайтов-референсов для разбора (node scripts/qa-refs.js).
 *
 * Полностраничный кадр на десктопе — чтобы понять структуру и ритм секций,
 * и кадр первого экрана на телефоне — чтобы понять мобильную композицию.
 * Это инструмент анализа, в деплой не входит (.vercelignore исключает scripts/).
 */

const fs = require('node:fs');
const path = require('node:path');

const cdp = require('./lib/cdp');

const OUT_DIR = path.resolve(__dirname, '..', 'qa-screenshots', 'refs');
const PORT = 9401;

const SITES = [
  { name: 'arqa-wine', url: 'https://arqa-wine.vercel.app/' },
  { name: 'kerey', url: 'https://kerey.vercel.app/' },
  { name: 'mb-technic', url: 'https://mb-technic.vercel.app/' },
  { name: 'luxcar', url: 'https://luxcar-pi.vercel.app/' },
];

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const session = await cdp.launch({ port: PORT, width: 1440, height: 900 });
  const { page } = session;

  for (const site of SITES) {
    try {
      await cdp.navigate(page, site.url);
      // Даём анимациям появления и шрифтам уложиться
      await cdp.sleep(1500);

      const meta = await cdp.evaluate(
        page,
        `(() => {
          const q = (sel) => Array.from(document.querySelectorAll(sel));
          return JSON.stringify({
            title: document.title.slice(0, 90),
            height: document.documentElement.scrollHeight,
            h1: q('h1').map((e) => e.innerText.trim().slice(0, 90)),
            h2: q('h2').map((e) => e.innerText.trim().slice(0, 70)).slice(0, 14),
            sections: q('section').length,
            hasNav: !!document.querySelector('nav, header'),
            fonts: Array.from(new Set(q('h1, h2, body').map((e) => getComputedStyle(e).fontFamily.split(',')[0]))).slice(0, 4),
            bg: getComputedStyle(document.body).backgroundColor,
            color: getComputedStyle(document.body).color
          });
        })()`
      );
      console.log('=== ' + site.name + ' ===');
      console.log(meta);

      await cdp.screenshot(page, path.join(OUT_DIR, site.name + '-desktop.jpg'), {
        full: true,
        quality: 78,
      });

      await cdp.setViewport(page, 390, 844);
      await cdp.sleep(900);
      await cdp.evaluate(page, 'window.scrollTo(0, 0)');
      await cdp.sleep(400);
      await cdp.screenshot(page, path.join(OUT_DIR, site.name + '-mobile.jpg'), {
        full: false,
        quality: 80,
      });
      await cdp.setViewport(page, 1440, 900);
    } catch (err) {
      console.log('=== ' + site.name + ' === ОШИБКА: ' + err.message);
    }
  }

  await session.close();
  console.log('\nСнимки: ' + OUT_DIR);
})().catch((err) => {
  console.error('Не удалось снять референсы:', err.message);
  process.exit(2);
});
