'use strict';

/**
 * Разбор сайта-референса: структура секций и устройство формы записи.
 * Запуск: node scripts/qa-extract.js https://kerey.vercel.app/
 */

const cdp = require('./lib/cdp');

const URL = process.argv[2] || 'https://kerey.vercel.app/';
const PORT = 9405;

const SCRIPT = `(() => {
  const txt = (el) => (el ? (el.innerText || '').replace(/\\s+/g, ' ').trim() : '');
  const sections = [];
  const roots = Array.from(document.querySelectorAll('main > *, body > section, section'));
  const seen = new Set();
  roots.forEach((el, i) => {
    if (seen.has(el)) return;
    seen.add(el);
    const h = el.querySelector('h1, h2');
    sections.push({
      i: i,
      tag: el.tagName.toLowerCase(),
      id: el.id || '',
      cls: String(el.className || '').split(/\\s+/).slice(0, 3).join('.'),
      eyebrow: txt(el.querySelector('[class*="eyebrow"], [class*="kicker"], [class*="label"], small')),
      heading: txt(h).slice(0, 80),
      paragraphs: el.querySelectorAll('p').length,
      buttons: Array.from(el.querySelectorAll('button, a[class*="btn"], a[class*="button"]'))
        .map(txt).filter(Boolean).slice(0, 5),
      forms: el.querySelectorAll('form').length,
      inputs: el.querySelectorAll('input, select, textarea').length,
      images: el.querySelectorAll('img').length,
      height: Math.round(el.getBoundingClientRect().height)
    });
  });

  // Устройство формы записи
  const form = document.querySelector('form');
  const formInfo = form ? {
    cls: String(form.className || ''),
    fields: Array.from(form.querySelectorAll('input, select, textarea')).map((f) => ({
      tag: f.tagName.toLowerCase(),
      type: f.type || '',
      name: f.name || '',
      required: f.required,
      placeholder: f.placeholder || '',
      label: txt(f.labels && f.labels[0] ? f.labels[0] : (f.id ? document.querySelector('label[for="' + f.id + '"]') : null)),
      options: f.tagName === 'SELECT' ? Array.from(f.options).map((o) => o.text).slice(0, 10) : undefined
    })),
    submit: txt(form.querySelector('button[type="submit"], button:last-of-type')),
    steps: document.querySelectorAll('[class*="step"]').length,
    text: txt(form).slice(0, 400)
  } : null;

  // Все формы на странице
  const forms = Array.from(document.querySelectorAll('form')).map((f) => ({
    inputs: f.querySelectorAll('input, select, textarea').length,
    submit: txt(f.querySelector('button[type="submit"], button'))
  }));

  return JSON.stringify({
    title: document.title,
    nav: Array.from(document.querySelectorAll('header a, nav a')).map(txt).filter(Boolean).slice(0, 12),
    sectionCount: sections.length,
    sections: sections,
    formInfo: formInfo,
    forms: forms
  }, null, 1);
})()`;

(async () => {
  const session = await cdp.launch({ port: PORT, width: 1440, height: 900 });
  const { page } = session;
  await cdp.navigate(page, URL);
  await cdp.sleep(2000);
  const out = await cdp.evaluate(page, SCRIPT);
  console.log(out);
  await session.close();
})().catch((err) => {
  console.error('ERR', err.message);
  process.exit(1);
});
