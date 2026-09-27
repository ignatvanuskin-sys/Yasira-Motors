'use strict';

/**
 * SEO: метаданные и структурированные данные Schema.org.
 *
 * В разметку попадают ТОЛЬКО подтверждённые данные. Мы не указываем
 * aggregateRating, если рейтинг не подтверждён источником, и не
 * публикуем priceRange — иначе разметка станет ложной.
 */

const config = require('../config');
const { REVIEWS, REVIEW_SOURCE } = require('../content/reviews');
const { FAQ } = require('../content/faq');

/** @param {string} path @returns {string} абсолютный URL */
function url(pathname = '/') {
  const clean = String(pathname).startsWith('/') ? pathname : `/${pathname}`;
  return `${config.siteUrl}${clean === '/' ? '' : clean}`;
}

/** Организация — используется на всех страницах. */
function organizationSchema() {
  const b = config.business;
  return {
    '@type': 'AutoRepair',
    '@id': `${config.siteUrl}/#organization`,
    name: b.name,
    description:
      'Автосервис в Актау: компьютерная диагностика, техническое обслуживание, ремонт двигателя, ходовой части, коробок передач, автоэлектрика, шиномонтаж.',
    url: config.siteUrl,
    telephone: b.phone,
    email: b.email,
    image: url('/img/directions2.jpg'),
    address: {
      '@type': 'PostalAddress',
      streetAddress: b.addressShort,
      addressLocality: b.city,
      addressRegion: 'Мангистауская область',
      addressCountry: 'KZ',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: b.lat,
      longitude: b.lon,
    },
    areaServed: {
      '@type': 'City',
      name: b.city,
    },
    /* Реальные способы оплаты из карточки 2GIS. */
    paymentAccepted: b.payments.join(', '),
    currenciesAccepted: 'KZT',
    /* Часы работы из подтверждённого графика. */
    openingHoursSpecification: openingHours(),
    sameAs: [b.twoGis, b.instagram, b.site].filter(Boolean),
    hasMap: b.twoGis,
  };
}

/** OpeningHoursSpecification из конфигурации графика. */
function openingHours() {
  const dayNames = {
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday',
    7: 'Sunday',
  };
  return config.business.hours.map((block) => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: block.days.map((d) => dayNames[d]).filter(Boolean),
    opens: block.open,
    closes: block.close,
  }));
}

/**
 * Разметка агрегированного рейтинга — только если он подтверждён
 * карточкой 2GIS (значение по умолчанию именно оттуда).
 */
function ratingSchema() {
  const b = config.business;
  if (!b.rating || !b.ratingsCount) return null;
  return {
    '@type': 'AggregateRating',
    ratingValue: b.rating,
    reviewCount: b.ratingsCount,
    bestRating: 5,
    worstRating: 1,
  };
}

/**
 * Полный @graph для страницы.
 * @param {{path:string, title:string, description:string, image?:string,
 *          type?:string, service?:object, faq?:Array<{q:string,a:string}>,
 *          breadcrumbs?:Array<{name:string,url:string}>}} page
 */
function pageSchema(page) {
  const graph = [];

  const org = organizationSchema();
  const rating = ratingSchema();
  if (rating) org.aggregateRating = rating;

  /* Отзывы — реальные, из карточки 2GIS; каждый со ссылкой на источник. */
  if (page.includeReviews) {
    org.review = REVIEWS.slice(0, 6).map((r) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.author },
      datePublished: r.date,
      reviewBody: r.text,
      reviewRating: {
        '@type': 'Rating',
        ratingValue: r.rating,
        bestRating: 5,
        worstRating: 1,
      },
      publisher: { '@type': 'Organization', name: REVIEW_SOURCE.name, url: REVIEW_SOURCE.url },
    }));
  }

  graph.push(org);

  graph.push({
    '@type': 'WebSite',
    '@id': `${config.siteUrl}/#website`,
    url: config.siteUrl,
    name: `${config.business.name} — автосервис в ${config.business.city}`,
    inLanguage: 'ru-KZ',
    publisher: { '@id': `${config.siteUrl}/#organization` },
  });

  graph.push({
    '@type': 'WebPage',
    '@id': `${url(page.path)}#webpage`,
    url: url(page.path),
    name: page.title,
    description: page.description,
    isPartOf: { '@id': `${config.siteUrl}/#website` },
    about: { '@id': `${config.siteUrl}/#organization` },
  });

  if (page.service) {
    graph.push({
      '@type': 'Service',
      name: page.service.title,
      description: page.service.summary,
      serviceType: page.service.title,
      provider: { '@id': `${config.siteUrl}/#organization` },
      areaServed: { '@type': 'City', name: config.business.city },
      url: url(page.path),
      /* offers публикуем только при подтверждённой цене */
      ...(page.service.priceFrom
        ? {
            offers: {
              '@type': 'Offer',
              priceCurrency: 'KZT',
              price: page.service.priceFrom,
              availability: 'https://schema.org/InStock',
            },
          }
        : {}),
    });
  }

  if (page.faq && page.faq.length) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: page.faq.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    });
  }

  if (page.breadcrumbs && page.breadcrumbs.length) {
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: page.breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: url(crumb.url),
      })),
    });
  }

  if (page.includeFaqPage) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: FAQ.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    });
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}

/** JSON-LD для вставки в <script type="application/ld+json">. */
function schemaScript(page) {
  const json = JSON.stringify(pageSchema(page));
  // Экранируем "<" — защита от закрытия тега внутри данных.
  return json.replace(/</g, '\\u003c');
}

/**
 * Список страниц для sitemap.xml.
 * @param {Array<{slug:string}>} services
 */
function sitemapEntries(services) {
  const staticPages = [
    { loc: '/', priority: '1.0', changefreq: 'weekly' },
    { loc: '/services', priority: '0.9', changefreq: 'weekly' },
    { loc: '/booking', priority: '0.9', changefreq: 'daily' },
    { loc: '/contacts', priority: '0.7', changefreq: 'monthly' },
  ];
  const servicePages = services.map((s) => ({
    loc: `/services/${s.slug}`,
    priority: '0.8',
    changefreq: 'monthly',
  }));
  return [...staticPages, ...servicePages];
}

module.exports = { url, organizationSchema, pageSchema, schemaScript, sitemapEntries, openingHours };
