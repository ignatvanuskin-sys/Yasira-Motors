'use strict';

/**
 * Контент: согласованность услуг, категорий и честность данных.
 *
 * Главное, что здесь проверяется — на сайте нет выдуманных фактов и
 * «висящих» ссылок: каждая категория ведёт на существующую услугу, каждая
 * услуга попала в категорию, у каждой услуги указан источник.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { SERVICES, getService } = require('../src/content/services');
const { CATEGORIES, getCategory, categoryForService } = require('../src/content/categories');
const { CATEGORY_SERVICES } = require('../src/views/services');
const { FAQ } = require('../src/content/faq');
const { REVIEWS, REVIEW_SOURCE } = require('../src/content/reviews');
const { GALLERY } = require('../src/content/gallery');
const seo = require('../src/lib/seo');

test('каждая категория содержит хотя бы одну услугу', () => {
  for (const category of CATEGORIES) {
    const slugs = CATEGORY_SERVICES[category.slug];
    assert.ok(Array.isArray(slugs) && slugs.length, `категория ${category.slug}`);
  }
});

test('все услуги в категориях существуют', () => {
  for (const [categorySlug, slugs] of Object.entries(CATEGORY_SERVICES)) {
    for (const slug of slugs) {
      assert.ok(getService(slug), `${categorySlug} ссылается на несуществующую услугу ${slug}`);
    }
  }
});

test('каждая услуга попала ровно в одну категорию', () => {
  const seen = new Map();
  for (const slugs of Object.values(CATEGORY_SERVICES)) {
    for (const slug of slugs) seen.set(slug, (seen.get(slug) || 0) + 1);
  }
  for (const service of SERVICES) {
    assert.equal(seen.get(service.slug), 1, `услуга ${service.slug} должна быть в одной категории`);
  }
});

test('ведущая услуга категории существует и входит в неё', () => {
  for (const category of CATEGORIES) {
    assert.ok(getService(category.lead), `категория ${category.slug}: ведущая услуга ${category.lead}`);
    assert.ok(
      CATEGORY_SERVICES[category.slug].includes(category.lead),
      `категория ${category.slug}: ведущая услуга должна входить в список`
    );
  }
});

test('у каждой услуги указан источник и есть описание работ', () => {
  for (const service of SERVICES) {
    assert.ok(service.source && service.source.length > 5, `${service.slug}: источник`);
    assert.ok(service.summary && service.summary.length > 20, `${service.slug}: краткое описание`);
    assert.ok(service.description && service.description.length > 40, `${service.slug}: описание`);
    assert.ok(Array.isArray(service.included) && service.included.length, `${service.slug}: состав работ`);
    assert.ok(Array.isArray(service.symptoms) && service.symptoms.length, `${service.slug}: признаки`);
  }
});

test('цена нигде не заявлена числом: подтверждённого прайса нет', () => {
  for (const service of SERVICES) {
    assert.ok(
      service.priceFrom === null || service.priceFrom === undefined,
      `${service.slug}: priceFrom должен оставаться пустым без подтверждённого прайса`
    );
  }
});

test('категория услуги определяется обратным поиском', () => {
  assert.equal(categoryForService('remont-akpp').slug, 'korobki');
  assert.equal(categoryForService('shinomontazh').slug, 'shinomontazh');
  assert.equal(categoryForService('net-takoy-uslugi'), null);
});

test('категорию можно найти по адресу', () => {
  assert.equal(getCategory('diagnostika').title, 'Диагностика');
  assert.equal(getCategory('net-takoy'), null);
});

test('FAQ не обещает онлайн-запись, которой больше нет', () => {
  const text = FAQ.map((item) => `${item.q} ${item.a}`).join(' ').toLowerCase();
  assert.equal(/онлайн-запис|свободные слоты|выберите время/.test(text), false);
});

test('FAQ состоит из вопросов перед звонком, а не про форму', () => {
  assert.ok(FAQ.length >= 5 && FAQ.length <= 8, `вопросов: ${FAQ.length}`);
  for (const item of FAQ) {
    assert.ok(item.q.endsWith('?'), `вопрос должен быть вопросом: ${item.q}`);
    assert.ok(item.a.length > 40, `ответ слишком короткий: ${item.q}`);
  }
});

test('отзывы реальные: с автором, датой и источником', () => {
  assert.ok(REVIEWS.length >= 4);
  for (const review of REVIEWS) {
    assert.ok(review.author && review.author.length > 2, 'автор');
    assert.ok(review.date && /\d{4}/.test(review.date), `дата: ${review.date}`);
    assert.ok(review.rating >= 1 && review.rating <= 5, 'оценка');
    assert.ok(REVIEW_SOURCE.url.startsWith('https://'), 'ссылка на источник');
  }
});

test('фотографии — файлы в public/img с описанием', () => {
  assert.ok(GALLERY.length >= 4);
  for (const photo of GALLERY) {
    assert.ok(photo.file && /\.(jpg|jpeg|png|webp|avif)$/i.test(photo.file), `файл: ${photo.file}`);
    assert.ok(photo.alt && photo.alt.length > 15, `alt для ${photo.file}`);
  }
});

test('карта сайта не содержит удалённых страниц', () => {
  const xml = seo.sitemap();
  assert.equal(xml.includes('/booking'), false);
  assert.equal(xml.includes('/dashboard'), false);
  assert.ok(xml.includes('/services/'));
  assert.ok(xml.includes('<loc>'));
});

test('robots.txt ссылается на карту сайта', () => {
  const txt = seo.robots();
  assert.ok(txt.includes('Sitemap:'));
  assert.ok(txt.includes('User-agent: *'));
});

test('разметка организации содержит подтверждённые данные', () => {
  const schema = seo.organizationSchema();
  assert.equal(schema['@type'], 'AutoRepair');
  assert.equal(schema.telephone, require('../src/config').business.phone);
  assert.ok(schema.geo.latitude && schema.geo.longitude);
  assert.ok(schema.openingHoursSpecification.length >= 2);
});
