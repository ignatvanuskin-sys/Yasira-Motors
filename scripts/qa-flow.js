'use strict';

/**
 * Пошаговый разбор чужого потока записи: открываем страницу и щёлкаем,
 * фиксируя состояние DOM на каждом шаге.
 * Запуск: node scripts/qa-flow.js https://kerey.vercel.app/booking
 */

const cdp = require('./lib/cdp');

const URL = process.argv[2] || 'https://kerey.vercel.app/booking';
const PORT = 9407;

const SNAP = `(() => {
  const txt = (el) => (el ? (el.innerText || '').replace(/\\s+/g, ' ').trim() : '');
  const fields = Array.from(document.querySelectorAll('input, select, textarea')).map((f) => ({
    tag: f.tagName.toLowerCase(), type: f.type || '', name: f.name || '',
    required: f.required, placeholder: f.placeholder || '',
    label: txt(f.labels && f.labels[0] ? f.labels[0] : null)
  }));
  const clickable = Array.from(document.querySelectorAll('button, [role="button"], label[class]'))
    .map((el) => txt(el).slice(0, 46)).filter(Boolean);
  return JSON.stringify({
    fields: fields,
    fieldCount: fields.length,
    h: document.querySelector('h1, h2') ? txt(document.querySelector('h1, h2')).slice(0, 60) : '',
    texts: Array.from(document.querySelectorAll('h1, h2, h3, legend, [class*="text-xs"], [class*="uppercase"]'))
      .map(txt).filter(Boolean).slice(0, 22),
    clickable: clickable.slice(0, 24),
    bodyLen: document.body.innerHTML.length
  }, null, 1);
})()`;

async function snap(page, label) {
  await cdp.sleep(700);
  console.log('\n########## ' + label + ' ##########');
  console.log(await cdp.evaluate(page, SNAP));
}

/** Клик по первому видимому элементу, содержащему текст. */
async function clickText(page, needle) {
  const ok = await cdp.evaluate(
    page,
    `(() => {
      const txt = (el) => (el.innerText || '').replace(/\\s+/g, ' ').trim();
      const el = Array.from(document.querySelectorAll('button, [role="button"], label, a'))
        .find((e) => txt(e).toLowerCase().includes(${JSON.stringify(needle.toLowerCase())}) && e.offsetParent !== null);
      if (!el) return false;
      el.click();
      return true;
    })()`
  );
  console.log(needle + ' → ' + (ok ? 'нажато' : 'НЕ найдено'));
  return ok;
}

(async () => {
  const session = await cdp.launch({ port: PORT, width: 1280, height: 950 });
  const { page } = session;
  await cdp.navigate(page, URL);
  await cdp.sleep(2500);

  await snap(page, 'ШАГ 1: как открылась страница');

  await clickText(page, 'ходов');
  await snap(page, 'ШАГ 2: после выбора услуги');

  await clickText(page, 'далее');
  await snap(page, 'ШАГ 3: после «далее»');

  await cdp.screenshot(page, 'qa-screenshots/refs/kerey-booking-1.jpg', { full: false });

  await session.close();
})().catch((err) => {
  console.error('ERR', err.message);
  process.exit(1);
});
