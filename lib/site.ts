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

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://yasira-motors.kz").replace(
  /\/+$/,
  "",
);

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

/** Основной номер — тот, что указан первым в карточке 2ГИС. */
export const phone = {
  display: "+7 777 088 44 36",
  tel: "+77770884436",
  whatsapp: "77770884436",
} as const;

export const phones = [
  { label: "Магазин масел и автохимии", display: "+7 777 088 44 36", tel: "+77770884436" },
  { label: "Автосервис", display: "+7 777 088 44 24", tel: "+77770884424" },
  { label: "Автосервис", display: "+7 777 088 44 08", tel: "+77770884408" },
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

export const whatsappText = "Здравствуйте! Пишу с сайта YASIRA MOTORS.";

export const whatsappLink = (number: string = phone.whatsapp, text = whatsappText) =>
  `https://wa.me/${number}?text=${encodeURIComponent(text)}`;

/** Рейтинг и оценки — 2ГИС, проверено 28.09.2026. */
export const rating = {
  value: 4.9,
  count: 478,
  photos: 54,
  award: "2GIS Awards 2026 — «Лучший автосервис»",
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
