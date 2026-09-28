/**
 * Единый источник правды о бизнесе.
 *
 * ВСЕ данные ниже подтверждены источниками — ничего не выдумано:
 *  • 2ГИС, карточка фирмы 70000001029237438 (адрес, телефоны, рубрики, график,
 *    рейтинг, оценки, фото, награда, способы оплаты) — проверено 28.09.2026
 *  • yasira.kz (группа компаний Yasira: 20 лет на рынке, >1500 наименований
 *    масел и смазок, география, направления)
 *  • публичные отзывы клиентов в 2ГИС (автомойка, детейлинг, кафе для клиентов)
 *
 * Если данные меняются — правится только этот файл.
 */

/**
 * Базовый адрес сайта для canonical, Open Graph, sitemap и robots.
 *
 * Приоритет:
 *  1. NEXT_PUBLIC_SITE_URL — задаётся вручную, когда подключён рабочий домен.
 *     Достаточно одного этого значения и redeploy;
 *  2. VERCEL_PROJECT_PRODUCTION_URL — Vercel подставляет сам, поэтому сразу
 *     после деплоя canonical совпадает с реально работающим адресом;
 *  3. localhost — только для локальной сборки.
 *
 * Рабочий домен НЕ прописан в коде: любой захардкоженный адрес однажды станет
 * неправдой (сначала несуществующий домен, потом устаревший vercel-адрес).
 * Если переменных окружения нет, сборка помечает адрес как неподтверждённый —
 * аудит валит такую сборку на продакшене (см. scripts/audit.js).
 */
const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
const vercelProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();

export const SITE_URL_SOURCE: "env" | "vercel" | "dev" = configuredUrl
  ? "env"
  : vercelProductionUrl
    ? "vercel"
    : "dev";

export const SITE_URL = (
  configuredUrl
    ? configuredUrl
    : vercelProductionUrl
      ? `https://${vercelProductionUrl}`
      : "http://localhost:3000"
).replace(/\/+$/, "");

/** true, если адрес пришёл из окружения (а не из локальной заглушки). */
export const SITE_URL_IS_CONFIRMED = SITE_URL_SOURCE !== "dev";

export const company = {
  name: "YASIRA MOTORS",
  legalShortName: "Yasira Motors",
  tagline: "Квалифицированное сервисное обслуживание",
  kind: "Автосервис",
  city: "Актау",
  region: "Мангистауская область",
  country: "KZ",
  countryName: "Казахстан",
  descriptionShort: "Автосервис в Актау: обслуживание и ремонт легковых автомобилей",
} as const;

export const address = {
  microDistrict: "25-й микрорайон, 52/2",
  floor: "1 этаж",
  city: "Актау",
  full: "Актау, 25-й микрорайон, 52/2, 1 этаж",
  lat: 43.654702,
  lng: 51.184709,
  buildingFloors: 2,
  parkingSpots: 3,
  landmark: "Остановка «Ясира» — около 2 минут пешком (200 м)",
} as const;

/**
 * Основной номер для кнопки «Позвонить».
 *
 * В карточке 2ГИС номера подписаны: +7 777 088 44 36 — «магазин»,
 * +7 777 088 44 24 и +7 777 088 44 08 — «СТО», +7 777 088 44 33 — «детейлинг».
 * Сайт про автосервис, поэтому главная кнопка ведёт в сервис, а не в магазин.
 * WhatsApp есть у этого же номера.
 *
 * OWNER CONFIRMATION REQUIRED: если звонки должны идти на другой номер —
 * это одна строка ниже.
 */
export const phone = {
  display: "+7 777 088 44 24",
  tel: "+77770884424",
  whatsapp: "77770884424",
} as const;

/**
 * Все номера компании с подписями так, как их даёт карточка 2ГИС
 * (контакты открываются кнопкой «Показать телефоны»).
 */
export const phones = [
  { label: "Автосервис", display: "+7 777 088 44 24", tel: "+77770884424" },
  { label: "Автосервис", display: "+7 777 088 44 08", tel: "+77770884408" },
  { label: "Магазин масел", display: "+7 777 088 44 36", tel: "+77770884436" },
  { label: "Детейлинг", display: "+7 777 088 44 33", tel: "+77770884433" },
] as const;

export const email = {
  general: "info@yasira.kz",
  sales: "magazine@yasira.kz",
} as const;

export const links = {
  twogis: "https://2gis.kz/aktau/firm/70000001029237438",
  twogisReviews: "https://2gis.kz/aktau/firm/70000001029237438/tab/reviews",
  twogisGallery: "https://2gis.kz/aktau/gallery/firm/70000001029237438",
  twogisRoute:
    "https://2gis.kz/aktau/directions/points/%7C51.184709%2C43.654702%3B70000001029237438",
  twogisMapWidget:
    "https://widgets.2gis.com/widget?type=firmsonmap&options=%7B%22pos%22%3A%7B%22lat%22%3A43.654702%2C%22lon%22%3A51.184709%2C%22zoom%22%3A16%7D%2C%22opt%22%3A%7B%22city%22%3A%22aktau%22%7D%2C%22org%22%3A%2270000001029237438%22%7D",
  instagram: "https://instagram.com/yasira_motors",
  groupSite: "https://yasira.kz/",
} as const;

/**
 * Строка про автомобиль — единственное, что человеку нужно дописать самому.
 *
 * Идёт последней: WhatsApp ставит курсор в конец подставленного текста,
 * поэтому марку печатают сразу, не целясь в поле. Спрашивают её всё равно
 * первым же ответным сообщением, а от модели зависят и наличие фильтров,
 * и объём работ — пусть будет известно сразу.
 */
const AUTO_LINE = "Авто (марка, модель, год):";

/** Приглашение к разговору и строка, которую клиент дописывает сам. */
export const whatsappText = `Здравствуйте! Пишу с сайта YASIRA MOTORS.\n\n${AUTO_LINE} `;

/** Тот же хвост про автомобиль для сообщений с уточнением — например, с симптомом. */
export const withAutoLine = (intro: string) => `${intro.trim()}\n\n${AUTO_LINE} `;

export const whatsappLink = (number: string = phone.whatsapp, text = whatsappText) =>
  `https://wa.me/${number}?text=${encodeURIComponent(text)}`;

/**
 * Единственный источник данных о рейтинге: ни один компонент не должен
 * содержать эти числа у себя. Обновление — правка только этого объекта.
 *
 * Проверено на живой карточке 2ГИС 28.09.2026: рейтинг 4.9 показывается
 * и в шапке карточки, и на вкладке отзывов, и в выдаче поиска; там же
 * «Всего 478 оценок», 107 отзывов и 54 фотографии.
 */
export const rating = {
  value: 4.9,
  count: 478,
  reviews: 107,
  photos: 54,
  source: "2ГИС",
  /** Дата сверки — показывается рядом с цифрами. */
  verifiedOn: "28.09.2026",
  /**
   * Формулировка ровно как в карточке 2ГИС (вкладка «Инфо»): строки
   * «2GIS Awards» и «Лучший автосервис 2026». Слов «победитель», «премия»,
   * «награда вручена» источник не содержит, поэтому их нет и на сайте.
   */
  awardBadge: "2GIS Awards",
  awardTitle: "Лучший автосервис 2026",
} as const;

export const paymentMethods = ["Оплата картой", "Наличный расчёт", "Оплата через банк"] as const;

/** Рубрики, заявленные компанией в 2ГИС. */
export const rubrics = [
  "Компьютерная диагностика автомобилей",
  "Развал-схождение",
  "Легковой автосервис",
  "Замена масла",
  "Ремонт ходовой части автомобиля",
  "Ремонт дизельных двигателей",
  "Шиномонтаж",
  "Ремонт стартеров и генераторов",
  "Ремонт АКПП",
  "Ремонт МКПП",
  "Автохимия",
] as const;

/** График работы — по карточке 2ГИС. */
export type DayHours = { label: string; short: string; open: string; close: string };

export const schedule: DayHours[] = [
  { label: "Понедельник", short: "Пн", open: "09:00", close: "19:00" },
  { label: "Вторник", short: "Вт", open: "09:00", close: "19:00" },
  { label: "Среда", short: "Ср", open: "09:00", close: "19:00" },
  { label: "Четверг", short: "Чт", open: "09:00", close: "19:00" },
  { label: "Пятница", short: "Пт", open: "09:00", close: "19:00" },
  { label: "Суббота", short: "Сб", open: "09:00", close: "19:00" },
  { label: "Воскресенье", short: "Вс", open: "10:00", close: "17:00" },
];

export const scheduleSummary = "Пн–Сб 09:00–19:00 · Вс 10:00–17:00";

/**
 * График подтверждён владельцем: автосервис работает Пн–Сб 09:00–19:00,
 * Вс 10:00–17:00. Совпадает с карточкой 2ГИС, поэтому расхождения
 * с вывеской магазина масел («9–20») больше нет: у магазина свой график.
 * Оговорки про «уточняйте по телефону» больше не нужны — данные подтверждены.
 */

/** Группа компаний Yasira — данные с официального сайта yasira.kz. */
export const group = {
  yearsOnMarket: 20,
  oilItems: 1500,
  cities: 50,
  offices: ["Актау", "Атырау", "Актобе", "Уральск"],
} as const;

export const nav = [
  { href: "#services", label: "Услуги" },
  { href: "#why", label: "О компании" },
  { href: "#reviews", label: "Отзывы" },
  { href: "#gallery", label: "Фото" },
  { href: "#contacts", label: "Контакты" },
] as const;
