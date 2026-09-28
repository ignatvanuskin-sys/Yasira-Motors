import { address, company, email, links, phone, schedule, SITE_URL } from "@/lib/site";
import { serviceGroups } from "@/lib/content";

/** schedule[] идёт с понедельника — Schema.org требует английские имена дней. */
const SCHEMA_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

/**
 * Разметка Schema.org для автосервиса.
 *
 * Осознанно НЕ добавляем aggregateRating: оценки собраны на сторонней площадке
 * (2ГИС), а перенос чужих отзывов в разметку собственного бизнеса нарушает
 * требования Google к структурированным данным. Рейтинг показывается в
 * интерфейсе со ссылкой на источник.
 */
export function structuredData() {
  return {
    "@context": "https://schema.org",
    "@type": ["AutoRepair", "LocalBusiness"],
    "@id": `${SITE_URL}/#autoservice`,
    name: company.name,
    alternateName: company.legalShortName,
    description:
      "Автосервис в Актау: компьютерная диагностика, техническое обслуживание и замена масла, ремонт двигателя, АКПП, МКПП, ходовой части, автоэлектрика, развал-схождение, шиномонтаж, магазин масел и автохимии.",
    url: SITE_URL,
    image: `${SITE_URL}/og.jpg`,
    telephone: phone.tel,
    email: email.general,
    slogan: company.tagline,
    currenciesAccepted: "KZT",
    paymentAccepted: "Оплата картой, Наличный расчёт, Оплата через банк",
    address: {
      "@type": "PostalAddress",
      streetAddress: address.microDistrict,
      addressLocality: address.city,
      addressRegion: company.region,
      addressCountry: company.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: address.lat,
      longitude: address.lng,
    },
    areaServed: { "@type": "City", name: address.city },
    openingHoursSpecification: schedule.map((day, index) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: `https://schema.org/${SCHEMA_DAYS[index]}`,
      opens: day.open,
      closes: day.close,
    })),
    sameAs: [links.instagram, links.twogis, links.groupSite],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Услуги автосервиса",
      itemListElement: serviceGroups.map((group) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: group.title,
          description: group.text,
        },
      })),
    },
  };
}
