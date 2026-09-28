(async () => {
  // 1) click "Загрузить ещё" until it disappears
  let clicks = 0;
  for (let i = 0; i < 40; i++) {
    const btn = [...document.querySelectorAll('div,span,button,a')].find(e => (e.innerText || '').trim() === 'Загрузить ещё');
    if (!btn) break;
    try { btn.click(); clicks++; } catch (e) {}
    await new Promise(r => setTimeout(r, 1300));
  }
  await new Promise(r => setTimeout(r, 800));
  // 2) expand all "Читать целиком"
  const exps = [...document.querySelectorAll('div,span,button')].filter(e => (e.innerText || '').trim() === 'Читать целиком');
  for (const e of exps) { try { e.click(); } catch (er) {} }
  await new Promise(r => setTimeout(r, 1000));
  // 3) extract
  const cards = [...document.querySelectorAll('._1rowqpjv')];
  const data = cards.map(c => {
    const nameEl = c.querySelector('span[title]');
    const t = c.innerText || '';
    return {
      name: nameEl ? nameEl.getAttribute('title') : null,
      verified: /Отзыв подтверждён/.test(t),
      visits: (t.match(/(\d+)\s+посещени/) || [])[1] || null,
      frequent: /Частый гость/.test(t),
      chosen: /Отзыв выбран компанией/.test(t),
      edited: /изменён/.test(t),
      txt: t.replace(/\n+/g, ' | ').slice(0, 700)
    };
  });
  return { clickLoadMore: clicks, expanded: exps.length, count: data.length, data: data };
})()