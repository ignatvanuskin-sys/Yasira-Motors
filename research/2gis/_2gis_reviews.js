(async () => {
  const base = 'https://public-api.reviews.2gis.com/2.0/branches/70000001029237438/reviews';
  const fields = 'meta.providers,meta.branch_rating,meta.branch_reviews_count,meta.total_count,reviews.hiding_reason,reviews.is_verified';
  const key = '6e7e1929-4ea9-4a5d-8c05-d601860389bd';
  let url = base + '?limit=50&is_advertiser=false&fields=' + fields + '&without_my_first_review=false&rated=true&sort_by=date_created&key=' + key;
  const all = [];
  let meta = null;
  for (let i = 0; i < 12; i++) {
    const r = await fetch(url, { credentials: 'include' });
    const j = await r.json();
    if (!meta) meta = j.meta;
    const revs = j.reviews || [];
    all.push(...revs);
    if (!j.meta || !j.meta.next_link || revs.length === 0) break;
    url = j.meta.next_link;
    await new Promise(res => setTimeout(res, 250));
  }
  return {
    fetched: all.length,
    meta: meta,
    reviews: all.map(r => ({
      id: r.id,
      rating: r.rating,
      date: r.date_created,
      edited: r.date_edited,
      user: r.user ? r.user.name : null,
      user_reviews: r.user ? r.user.reviews_count : null,
      user_verified: r.user ? r.user.is_verified : null,
      verified: r.is_verified,
      text: r.text,
      provider: r.provider,
      likes: r.likes_count,
      photos: (r.photos || []).length,
      answer: r.official_answer ? r.official_answer.text : null
    }))
  };
})()