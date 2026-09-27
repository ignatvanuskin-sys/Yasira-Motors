'use strict';

/** Что именно делает кнопка записи на референсе. */

const cdp = require('./lib/cdp');

const URL = process.argv[2] || 'https://kerey.vercel.app/';
const PORT = 9406;

const SCRIPT = `(() => {
  const txt = (el) => (el ? (el.innerText || '').replace(/\\s+/g, ' ').trim() : '');
  const out = {};

  out.bookingLinks = Array.from(document.querySelectorAll('a, button'))
    .filter((el) => /записаться|запись|booking/i.test(txt(el)))
    .map((el) => ({
      tag: el.tagName.toLowerCase(),
      text: txt(el).slice(0, 40),
      href: el.getAttribute('href') || '',
      target: el.getAttribute('target') || '',
      onclick: el.getAttribute('onclick') ? 'есть' : '',
      cls: String(el.className || '').slice(0, 60)
    }))
    .slice(0, 14);

  out.phones = Array.from(document.querySelectorAll('a[href^="tel:"], a[href^="https://wa"]'))
    .map((el) => ({ href: el.getAttribute('href'), text: txt(el).slice(0, 30) }))
    .slice(0, 6);

  // Есть ли модальные окна / скрытые контейнеры под форму
  out.dialogs = Array.from(document.querySelectorAll('dialog, [role="dialog"], [aria-modal]'))
    .map((el) => ({ tag: el.tagName.toLowerCase(), hidden: el.hidden, cls: String(el.className || '').slice(0, 70) }));

  // Скрипты и фреймворк
  out.scripts = Array.from(document.querySelectorAll('script[src]')).map((s) => s.getAttribute('src')).slice(0, 6);
  out.react = !!document.querySelector('#__next, [data-reactroot], #root, #app');
  out.rootHtmlLen = document.body.innerHTML.length;

  // Куда ведёт навигация
  out.navTargets = Array.from(document.querySelectorAll('header a, nav a'))
    .map((a) => ({ text: txt(a).slice(0, 26), href: a.getAttribute('href') || '' }))
    .filter((x) => x.href).slice(0, 14);

  // Блок «ЧЕТЫРЕ ШАГА» — его содержимое
  const how = document.querySelector('#how');
  if (how) out.howSteps = txt(how).slice(0, 700);

  return JSON.stringify(out, null, 1);
})()`;

(async () => {
  const session = await cdp.launch({ port: PORT, width: 1440, height: 900 });
  const { page } = session;
  await cdp.navigate(page, URL);
  await cdp.sleep(2000);
  console.log(await cdp.evaluate(page, SCRIPT));
  await session.close();
})().catch((err) => {
  console.error('ERR', err.message);
  process.exit(1);
});
