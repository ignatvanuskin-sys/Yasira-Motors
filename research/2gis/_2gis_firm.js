(async () => {
  const out = {};
  try {
    const cu = 'https://catalog.api.2gis.ru/3.0/items/byid?id=70000001029237438&key=c7f1a769-c8a5-4636-b14d-d8c987808a12&fields=items.schedule,items.contact_groups,items.address,items.description,items.rubrics,items.parking,items.external_content,items.attribute_groups,items.reviews,items.name,items.full_name,items.point,items.locale,items.org,items.region_id,items.ads,items.purpose_name';
    const r = await fetch(cu, { credentials: 'include' });
    out.catalogStatus = r.status;
    out.catalog = await r.json();
  } catch (e) { out.catalogErr = String(e); }
  try {
    const pu = 'https://api.photo.2gis.com/3.0/objects/70000001029237438/albums/all/media?key=gYu1s9N1wP&page_size=50&locale=ru_KZ&preview_size=328x170%2C232x232';
    const r2 = await fetch(pu, { credentials: 'include' });
    out.photoStatus = r2.status;
    out.photos = await r2.json();
  } catch (e) { out.photoErr = String(e); }
  return out;
})()