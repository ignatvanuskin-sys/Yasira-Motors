(async () => {
  const key = 'gYu1s9N1wP';
  const out = {};
  async function grab(album, pageSize) {
    let page = 1, all = [];
    for (let i = 0; i < 6; i++) {
      const u = 'https://api.photo.2gis.com/3.0/objects/70000001029237438/albums/' + album + '/media?key=' + key + '&page_size=' + pageSize + '&page=' + page + '&locale=ru_KZ';
      const r = await fetch(u, { credentials: 'include' });
      const j = await r.json();
      const items = j.items || [];
      all.push(...items);
      if (items.length < pageSize) break;
      page++;
    }
    return all;
  }
  const albums = ['outside', 'interior', 'services', 'entrance'];
  const map = {};
  for (const a of albums) {
    const items = await grab(a, 50);
    map[a] = items.length;
    items.forEach(it => {
      out[it.id] = {
        album: a,
        url: it.photo.url,
        w: it.photo.width,
        h: it.photo.height,
        src: it.copyright && it.copyright.code,
        author: it.copyright ? it.copyright.title : null
      };
    });
  }
  const all = await grab('all', 50);
  out.__counts = { perAlbum: map, total: all.length };
  all.forEach(it => {
    if (!out[it.id]) out[it.id] = { album: 'all-other', url: it.photo.url, w: it.photo.width, h: it.photo.height, src: it.copyright && it.copyright.code, author: it.copyright ? it.copyright.title : null };
  });
  return out;
})()