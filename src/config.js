'use strict';

/**
 * Конфигурация приложения.
 *
 * Все значения по умолчанию — это ПОДТВЕРЖДЁННЫЕ данные о бизнесе,
 * собранные из 2GIS (карточка фирмы 70000001029237438) и официального
 * сайта yasira.kz. Неподтверждённые данные здесь не хранятся.
 *
 * Любое значение можно переопределить через переменные окружения / .env.
 * Это сделано специально: рейтинг, отзывы, часы работы и цены меняются,
 * и владелец должен иметь возможность обновить их без правки кода.
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

/** Простейший парсер .env (без зависимостей). */
function loadDotEnv(file) {
  if (!fs.existsSync(file)) return;
  const raw = fs.readFileSync(file, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadDotEnv(path.join(ROOT, '.env'));

/** @param {string} key @param {string|undefined} fallback */
function str(key, fallback) {
  const v = process.env[key];
  return v === undefined || v === '' ? fallback : v;
}

/** @param {string} key @param {number} fallback */
function num(key, fallback) {
  const v = process.env[key];
  // Пустая строка должна падать в fallback, а не превращаться в 0.
  if (v === undefined || v.trim() === '') return fallback;
  const parsed = Number(v);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Разбор графика работы: "1-6|09:00|20:00;7|10:00|17:00".
 * @returns {Array<{days:number[],open:string,close:string}>}
 */
function parseHours(raw) {
  const blocks = [];
  for (const chunk of String(raw).split(';')) {
    const part = chunk.trim();
    if (!part) continue;
    const [daysPart, open, close] = part.split('|').map((s) => (s || '').trim());
    if (!daysPart || !open || !close) continue;
    const days = [];
    for (const range of daysPart.split(',')) {
      const [a, b] = range.split('-').map((n) => parseInt(n, 10));
      if (!Number.isFinite(a)) continue;
      const end = Number.isFinite(b) ? b : a;
      for (let d = a; d <= end; d += 1) if (d >= 1 && d <= 7) days.push(d);
    }
    if (days.length) blocks.push({ days, open, close });
  }
  return blocks;
}

const config = {
  root: ROOT,
  nodeEnv: str('NODE_ENV', 'production'),
  port: num('PORT', 3000),
  siteUrl: str('SITE_URL', 'https://yasira-motors.kz').replace(/\/+$/, ''),

  business: {
    name: 'YASIRA MOTORS',
    legalName: 'YASIRA MOTORS',
    tagline: 'Квалифицированное сервисное обслуживание',
    city: 'Актау',
    address: str('BUSINESS_ADDRESS', 'Актау, 25-й микрорайон, 52/2'),
    addressShort: '25-й микрорайон, 52/2',
    addressExtra: '1 этаж',
    lat: num('BUSINESS_LAT', 43.654702),
    lon: num('BUSINESS_LON', 51.184709),
    phone: str('BUSINESS_PHONE', '+7 777 088 44 36'),
    phone2: str('BUSINESS_PHONE_2', '+7 777 088 44 24'),
    phone3: str('BUSINESS_PHONE_3', '+7 777 088 44 08'),
    /* Номера с назначением — так подписаны телефоны в карточке 2ГИС.
       По подписи клиент понимает, куда звонить, вместо трёх одинаковых цифр. */
    phoneList: [
      { number: str('BUSINESS_PHONE', '+7 777 088 44 36'), role: 'магазин' },
      { number: str('BUSINESS_PHONE_2', '+7 777 088 44 24'), role: 'СТО' },
      { number: str('BUSINESS_PHONE_3', '+7 777 088 44 08'), role: 'СТО' },
      { number: str('BUSINESS_PHONE_4', '+7 777 088 44 33'), role: 'детейлинг' },
    ],
    whatsapp: str('BUSINESS_WHATSAPP', '77770884436'),
    email: str('BUSINESS_EMAIL', 'info@yasira.kz'),
    emailSales: str('BUSINESS_EMAIL_SALES', 'magazine@yasira.kz'),
    instagram: str('BUSINESS_INSTAGRAM', 'https://instagram.com/yasira_motors'),
    twoGis: str('BUSINESS_2GIS', 'https://2gis.kz/aktau/firm/70000001029237438'),
    site: 'https://yasira.kz/',
    /* Сверено с карточкой 2ГИС 28.09.2026: Пн–Сб 09:00–19:00, Вс 10:00–17:00.
       Ранее стояло 09:00–20:00 по стороннему справочнику — это было неверно. */
    hours: parseHours(str('BUSINESS_HOURS', '1-6|09:00|19:00;7|10:00|17:00')),
    hoursText: str('BUSINESS_HOURS_TEXT', 'Пн–Сб 09:00–19:00 · Вс 10:00–17:00'),
    /* Подтверждено карточкой 2GIS на 28.09.2026 */
    rating: num('BUSINESS_RATING', 4.9),
    ratingsCount: num('BUSINESS_RATINGS_COUNT', 478),
    reviewsCount: num('BUSINESS_REVIEWS_COUNT', 107),
    photosCount: num('BUSINESS_PHOTOS_COUNT', 54),
    awards: str('BUSINESS_AWARDS', '2GIS Awards 2026 · Лучший автосервис'),
    payments: ['Оплата картой', 'Наличный расчёт', 'Оплата через банк'],
    /* Подтверждено блоком «Транспорт» карточки 2GIS */
    transit: { stop: 'Ясира', walk: '2 мин · 200 м' },
    parkingCount: 3,

    /* Встраиваемая карта 2ГИС: показывает карточку самого сервиса
       с фотографиями и часами работы, а не абстрактную метку. */
    twoGisFirmId: str('BUSINESS_2GIS_FIRM_ID', '70000001029237438'),
    twoGisCity: str('BUSINESS_2GIS_CITY', 'aktau'),
  },

  booking: {
    slotMinutes: num('BOOKING_SLOT_MINUTES', 60),
    capacity: Math.max(1, num('BOOKING_CAPACITY', 1)),
    horizonDays: num('BOOKING_HORIZON_DAYS', 30),
    leadMinutes: num('BOOKING_LEAD_MINUTES', 60),
  },

  admin: {
    password: str('ADMIN_PASSWORD', ''),
    sessionSecret: str('SESSION_SECRET', ''),
    sessionTtlMs: 1000 * 60 * 60 * 8,
  },

  telegram: {
    token: str('TELEGRAM_BOT_TOKEN', ''),
    chatId: str('TELEGRAM_CHAT_ID', ''),
  },

  dataFile: path.resolve(ROOT, str('DATA_FILE', './data/db.json')),
  publicDir: path.join(ROOT, 'public'),
};

/** Настроены ли уведомления в Telegram. */
config.telegram.enabled = Boolean(config.telegram.token && config.telegram.chatId);

/**
 * График работы на конкретный день недели.
 * @param {number} isoDay 1 = Пн … 7 = Вс
 * @returns {{open:string,close:string}|null}
 */
config.hoursForDay = function hoursForDay(isoDay) {
  for (const block of config.business.hours) {
    if (block.days.includes(isoDay)) return { open: block.open, close: block.close };
  }
  return null;
};

module.exports = config;
