'use strict';

/**
 * Конфигурация сайта.
 *
 * Все значения по умолчанию — ПОДТВЕРЖДЁННЫЕ данные о бизнесе из карточки
 * 2ГИС (фирма 70000001029237438), карточки Яндекс Карт и сайта yasira.kz.
 * Неподтверждённые данные здесь не хранятся: списка обслуживаемых марок,
 * например, нет ни на одной площадке, поэтому его на сайте тоже нет.
 *
 * Любое значение переопределяется переменной окружения.
 */

const path = require('node:path');
const fs = require('node:fs');

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
 * Разбор графика работы: "1-6|09:00|19:00;7|10:00|17:00".
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
    kind: 'Автосервис',
    tagline: 'Квалифицированное сервисное обслуживание',
    city: 'Актау',
    address: str('BUSINESS_ADDRESS', 'Актау, 25-й микрорайон, 52/2'),
    addressShort: '25-й микрорайон, 52/2',
    addressExtra: '1 этаж',
    lat: num('BUSINESS_LAT', 43.654702),
    lon: num('BUSINESS_LON', 51.184709),

    /* Главный номер — единственный, который показывается в шапке и на первом
       экране. Остальные живут в контактах: три равнозначных номера в шапке
       заставляют выбирать вместо того, чтобы звонить. */
    phone: str('BUSINESS_PHONE', '+7 777 088 44 36'),
    phoneList: [
      { number: str('BUSINESS_PHONE', '+7 777 088 44 36'), role: 'магазин и общие вопросы' },
      { number: str('BUSINESS_PHONE_2', '+7 777 088 44 24'), role: 'СТО' },
      { number: str('BUSINESS_PHONE_3', '+7 777 088 44 08'), role: 'СТО' },
      { number: str('BUSINESS_PHONE_4', '+7 777 088 44 33'), role: 'детейлинг' },
    ],
    whatsapp: str('BUSINESS_WHATSAPP', '77770884436'),
    email: str('BUSINESS_EMAIL', 'info@yasira.kz'),
    emailSales: str('BUSINESS_EMAIL_SALES', 'magazine@yasira.kz'),
    instagram: str('BUSINESS_INSTAGRAM', 'https://instagram.com/yasira_motors'),
    twoGis: str('BUSINESS_2GIS', 'https://2gis.kz/aktau/firm/70000001029237438'),
    yandex: str('BUSINESS_YANDEX', 'https://yandex.kz/maps/org/yasira_motors/24185658536/'),
    site: 'https://yasira.kz/',

    /* График. Источники расходятся по закрытию: 2ГИС — 19:00, Яндекс Карты
       и справочник auto2.info — 20:00. Взят 2ГИС как наиболее
       поддерживаемый источник: там же живут отзывы и карточка фирмы.
       ЗНАЧЕНИЕ ТРЕБУЕТ ПОДТВЕРЖДЕНИЯ У ВЛАДЕЛЬЦА (README §Уточнить). */
    hours: parseHours(str('BUSINESS_HOURS', '1-6|09:00|19:00;7|10:00|17:00')),
    hoursText: str('BUSINESS_HOURS_TEXT', 'Пн–Сб 09:00–19:00 · Вс 10:00–17:00'),

    /* Рейтинги двух площадок. Оба подтверждены 28.09.2026. */
    rating: num('BUSINESS_RATING', 4.9),
    ratingsCount: num('BUSINESS_RATINGS_COUNT', 478),
    reviewsCount: num('BUSINESS_REVIEWS_COUNT', 107),
    yandexRating: num('BUSINESS_YANDEX_RATING', 5),
    yandexRatingsCount: num('BUSINESS_YANDEX_RATINGS_COUNT', 141),
    photosCount: num('BUSINESS_PHOTOS_COUNT', 54),
    awards: str('BUSINESS_AWARDS', '2GIS Awards 2026 · Лучший автосервис'),

    payments: ['Оплата картой', 'Наличный расчёт', 'Оплата через банк'],
    transit: { stop: 'Ясира', walk: '2 мин · 200 м' },
    parkingCount: 3,

    /* Подтверждено сайтом yasira.kz (о группе компаний) */
    groupYears: num('BUSINESS_GROUP_YEARS', 20),
    oilsCount: num('BUSINESS_OILS_COUNT', 1500),

    twoGisFirmId: str('BUSINESS_2GIS_FIRM_ID', '70000001029237438'),
    twoGisCity: str('BUSINESS_2GIS_CITY', 'aktau'),
  },

  publicDir: path.join(ROOT, 'public'),
};

/* ── График работы ────────────────────────────────────────────────────────── */

/**
 * График на конкретный день недели.
 * @param {number} isoDay 1 = Пн … 7 = Вс
 * @returns {{open:string,close:string}|null}
 */
config.hoursForDay = function hoursForDay(isoDay) {
  for (const block of config.business.hours) {
    if (block.days.includes(isoDay)) return { open: block.open, close: block.close };
  }
  return null;
};

/**
 * Открыт ли сервис прямо сейчас.
 *
 * Зачем: клиент, который читает сайт в 19:30, хочет знать не «график
 * вообще», а звонить ли ему сейчас. Поэтому сайт отвечает на этот вопрос
 * прямо в шапке.
 *
 * @param {Date} [now]
 * @returns {{open:boolean,label:string,detail:string}}
 */
config.openStatus = function openStatus(now) {
  const moment = now instanceof Date ? now : new Date();
  const isoDay = moment.getDay() === 0 ? 7 : moment.getDay();
  const today = config.hoursForDay(isoDay);
  const minutes = moment.getHours() * 60 + moment.getMinutes();

  const toMinutes = (value) => {
    const [h, m] = String(value).split(':').map((n) => parseInt(n, 10));
    return h * 60 + (Number.isFinite(m) ? m : 0);
  };

  if (today) {
    const open = toMinutes(today.open);
    const close = toMinutes(today.close);
    if (minutes >= open && minutes < close) {
      return { open: true, label: 'Открыто', detail: `до ${today.close}` };
    }
    if (minutes < open) {
      return { open: false, label: 'Закрыто', detail: `откроемся в ${today.open}` };
    }
  }

  // Ищем ближайший рабочий день в пределах недели
  for (let shift = 1; shift <= 7; shift += 1) {
    const nextDay = ((isoDay - 1 + shift) % 7) + 1;
    const schedule = config.hoursForDay(nextDay);
    if (schedule) {
      const when = shift === 1 ? 'завтра' : config.weekdayName(nextDay, true);
      return { open: false, label: 'Закрыто', detail: `${when} с ${schedule.open}` };
    }
  }
  return { open: false, label: 'Закрыто', detail: 'уточните по телефону' };
};

/**
 * Название дня недели.
 * @param {number} isoDay 1 = Пн
 * @param {boolean} [accusative] «в среду» вместо «среда»
 * @returns {string}
 */
config.weekdayName = function weekdayName(isoDay, accusative) {
  const base = ['понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье'];
  const acc = ['понедельник', 'вторник', 'среду', 'четверг', 'пятницу', 'субботу', 'воскресенье'];
  const list = accusative ? acc : base;
  return list[isoDay - 1] || '';
};

/* ── Ссылки на действия ──────────────────────────────────────────────────── */

/**
 * Ссылка «позвонить».
 * @param {string} phone
 * @returns {string}
 */
config.telHref = function telHref(phone) {
  return 'tel:' + String(phone).replace(/[^\d+]/g, '');
};

/**
 * Ссылка в WhatsApp с уже написанным сообщением.
 *
 * Смысл именно в готовом тексте: клиент нажимает — и разговор начат,
 * ему не нужно придумывать, что написать. Это главный сценарий сайта.
 *
 * @param {string} text
 * @returns {string}
 */
config.waLink = function waLink(text) {
  return 'https://wa.me/' + config.business.whatsapp + '?text=' + encodeURIComponent(text);
};

/** Готовые сообщения для разных точек сайта. */
config.waText = {
  general: 'Здравствуйте! Хочу узнать по ремонту автомобиля.',
  diagnose: 'Здравствуйте! Подскажите, с чего начать диагностику. Что происходит с машиной: ',
  parts: 'Здравствуйте! Хочу уточнить наличие масла и расходников.',
  /**
   * @param {string} service название услуги в языке клиента
   * @returns {string}
   */
  service: (service) =>
    `Здравствуйте! Интересует ${service}. Хотел бы уточнить по стоимости и возможности приехать.`,
};

module.exports = config;
