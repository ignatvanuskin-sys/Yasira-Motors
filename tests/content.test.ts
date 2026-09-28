import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { advantages, facts, photos, process, reviews, services } from "@/lib/content";
import {
  address,
  company,
  email,
  group,
  links,
  nav,
  paymentMethods,
  phone,
  phones,
  rating,
  schedule,
  SITE_URL,
  whatsappLink,
  whatsappText,
} from "@/lib/site";
import { getOpenState, toMinutes } from "@/lib/schedule";

const ROOT = path.resolve(__dirname, "..");

const publicFile = (src: string) => path.join(ROOT, "public", src.replace(/^\//, ""));

describe("контакты", () => {
  it("телефон для звонка записан в международном формате", () => {
    expect(phone.tel).toMatch(/^\+7\d{10}$/);
    expect(phone.display.replace(/\D/g, "")).toBe(phone.tel.replace(/\D/g, ""));
  });

  it("все телефоны корректны и не дублируются", () => {
    const tels = phones.map((p) => p.tel);
    expect(new Set(tels).size).toBe(tels.length);
    for (const item of phones) {
      expect(item.tel).toMatch(/^\+7\d{10}$/);
      expect(item.display.replace(/\D/g, "")).toBe(item.tel.replace(/\D/g, ""));
      expect(item.label.trim().length).toBeGreaterThan(0);
    }
  });

  it("основной номер присутствует в списке телефонов", () => {
    expect(phones.map((p) => p.tel)).toContain(phone.tel);
  });

  it("номер WhatsApp состоит только из цифр", () => {
    expect(phone.whatsapp).toMatch(/^\d{11}$/);
    expect(phone.whatsapp).toBe(phone.tel.replace(/\D/g, ""));
  });

  it("ссылка WhatsApp корректна и содержит текст обращения", () => {
    const url = new URL(whatsappLink());
    expect(url.protocol).toBe("https:");
    expect(url.hostname).toBe("wa.me");
    expect(url.pathname).toBe(`/${phone.whatsapp}`);
    expect(url.searchParams.get("text")).toBe(whatsappText);
    expect(whatsappText.length).toBeGreaterThan(10);
  });

  it("ссылка WhatsApp собирается и для дополнительного номера", () => {
    const url = new URL(whatsappLink(phones[1].tel.replace(/\D/g, "")));
    expect(url.pathname).toBe(`/${phones[1].tel.replace(/\D/g, "")}`);
  });

  it("e-mail выглядит как адрес", () => {
    for (const value of [email.general, email.sales]) {
      expect(value).toMatch(/^[\w.+-]+@[\w-]+\.[a-z]{2,}$/i);
    }
  });

  it("ссылки на 2ГИС ведут на карточку компании", () => {
    for (const key of ["twogis", "twogisReviews", "twogisGallery"] as const) {
      expect(links[key]).toContain("2gis.kz");
      expect(decodeURIComponent(links[key])).toContain("70000001029237438");
    }
    expect(decodeURIComponent(links.twogisRoute)).toContain(String(address.lat));
    expect(decodeURIComponent(links.twogisRoute)).toContain(String(address.lng));
  });

  it("адрес и геометка заполнены", () => {
    expect(address.microDistrict).toMatch(/25-й микрорайон, 52\/2/);
    expect(address.lat).toBeCloseTo(43.6547, 3);
    expect(address.lng).toBeCloseTo(51.1847, 3);
    expect(Number.isInteger(address.parkingSpots)).toBe(true);
  });
});

describe("график работы", () => {
  it("содержит все семь дней", () => {
    expect(schedule).toHaveLength(7);
    expect(schedule.map((d) => d.short)).toEqual(["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]);
  });

  it("время записано в формате ЧЧ:ММ и открытие раньше закрытия", () => {
    for (const day of schedule) {
      expect(day.open).toMatch(/^\d{2}:\d{2}$/);
      expect(day.close).toMatch(/^\d{2}:\d{2}$/);
      expect(toMinutes(day.open)).toBeLessThan(toMinutes(day.close));
    }
  });

  it("состояние всегда рассчитывается без исключений", () => {
    for (let hour = 0; hour < 24; hour += 1) {
      const state = getOpenState(new Date(`2026-09-28T${String(hour).padStart(2, "0")}:15+05:00`));
      expect(typeof state.open).toBe("boolean");
      expect(state.text).toMatch(/Сейчас (открыто|закрыто)/);
    }
  });
});

describe("рейтинг и факты", () => {
  it("рейтинг в допустимых пределах", () => {
    expect(rating.value).toBeGreaterThan(0);
    expect(rating.value).toBeLessThanOrEqual(5);
    expect(rating.count).toBeGreaterThan(0);
    expect(rating.count).toBeGreaterThan(100);
  });

  it("награда и количество фото описаны словами", () => {
    expect(rating.award).toContain("2GIS Awards");
    expect(rating.photos).toBeGreaterThan(photos.length);
  });

  it("в полосе фактов нет расхождений с рейтингом", () => {
    const text = facts.map((f) => `${f.value} ${f.label} ${f.sub}`).join(" ");
    expect(text).toContain(String(rating.value));
    expect(text).toContain("2GIS Awards");
    expect(text).toContain("1500");
  });

  it("факты не пустые", () => {
    expect(facts.length).toBeGreaterThanOrEqual(3);
    for (const fact of facts) {
      expect(fact.value.trim().length).toBeGreaterThan(0);
      expect(fact.label.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("услуги", () => {
  it("восемь направлений с уникальными идентификаторами", () => {
    expect(services).toHaveLength(8);
    expect(new Set(services.map((s) => s.id)).size).toBe(services.length);
  });

  it("у каждой услуги есть заголовок, описание, иконка и источник", () => {
    for (const service of services) {
      expect(service.title.trim().length).toBeGreaterThan(3);
      expect(service.text.trim().length).toBeGreaterThan(20);
      expect(service.source.trim().length).toBeGreaterThan(3);
      expect(service.icon).toBeTruthy();
    }
  });

  it("описания услуг не обещают того, чего нет в источниках", () => {
    const banned = [/гаранти/i, /\bбесплатн/i, /скидк/i, /за \d+ минут/i, /\bдёшев/i, /\bдешев/i];
    for (const service of services) {
      for (const pattern of banned) {
        expect(service.text).not.toMatch(pattern);
      }
    }
  });
});

describe("преимущества и процесс", () => {
  it("четыре преимущества с подтверждающим источником", () => {
    expect(advantages).toHaveLength(4);
    for (const item of advantages) {
      expect(item.title.trim().length).toBeGreaterThan(10);
      expect(item.text.trim().length).toBeGreaterThan(60);
      expect(item.note.trim().length).toBeGreaterThan(3);
    }
  });

  it("преимущества не содержат неподтверждённых обещаний", () => {
    const text = advantages.map((a) => `${a.title} ${a.text}`).join(" ");
    expect(text).not.toMatch(/индивидуальный подход/i);
    expect(text).not.toMatch(/лучшие специалисты/i);
    expect(text).not.toMatch(/высокое качество/i);
  });

  it("процесс состоит из пяти пронумерованных шагов", () => {
    expect(process).toHaveLength(5);
    expect(process.map((s) => s.step)).toEqual(["01", "02", "03", "04", "05"]);
    for (const step of process) {
      expect(step.title.trim().length).toBeGreaterThan(5);
      expect(step.text.trim().length).toBeGreaterThan(20);
    }
  });
});

describe("отзывы", () => {
  it("все отзывы заполнены и не дублируются", () => {
    expect(reviews.length).toBeGreaterThanOrEqual(8);
    const keys = reviews.map((r) => `${r.author}|${r.dateISO}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("у каждого отзыва корректные дата, оценка и текст", () => {
    for (const review of reviews) {
      expect(review.author.trim().length).toBeGreaterThan(1);
      expect(review.dateISO).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(new Date(review.dateISO).getTime())).toBe(false);
      expect(review.rating).toBeGreaterThanOrEqual(1);
      expect(review.rating).toBeLessThanOrEqual(5);
      expect(review.text.trim().length).toBeGreaterThan(15);
    }
  });

  it("даты отзывов не из будущего", () => {
    const today = new Date();
    for (const review of reviews) {
      expect(new Date(review.dateISO).getTime()).toBeLessThanOrEqual(today.getTime());
    }
  });

  it("отзывы не переписаны: нет маркетинговых обещаний от лица клиента", () => {
    const banned = [/рекомендую всем/i, /лучший сервис в городе/i, /\bидеально\b/i];
    for (const review of reviews) {
      for (const pattern of banned) {
        expect(review.text).not.toMatch(pattern);
      }
    }
  });
});

describe("фотографии", () => {
  it("все файлы существуют на диске", () => {
    for (const photo of photos) {
      expect(fs.existsSync(publicFile(photo.src)), `нет файла ${photo.src}`).toBe(true);
    }
  });

  it("у каждой фотографии длинный описательный alt", () => {
    for (const photo of photos) {
      expect(photo.alt.length, `короткий alt: ${photo.src}`).toBeGreaterThan(25);
      expect(photo.caption.trim().length).toBeGreaterThan(5);
      expect(photo.span.trim().length).toBeGreaterThan(0);
    }
  });

  it("нет повторяющихся изображений", () => {
    const srcs = photos.map((p) => p.src);
    expect(new Set(srcs).size).toBe(srcs.length);
  });

  it("вес фотографий галереи в разумных пределах", () => {
    for (const photo of photos) {
      const size = fs.statSync(publicFile(photo.src)).size;
      expect(size, `${photo.src} весит ${Math.round(size / 1024)}KB`).toBeLessThan(320 * 1024);
    }
  });
});

describe("SEO-данные", () => {
  it("базовый адрес сайта задан корректно", () => {
    expect(SITE_URL).toMatch(/^https:\/\/[^/]+$/);
    expect(SITE_URL.endsWith("/")).toBe(false);
  });

  it("навигация состоит из уникальных анкоров", () => {
    expect(nav.length).toBeGreaterThanOrEqual(4);
    const hrefs = nav.map((item) => item.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    for (const href of hrefs) expect(href).toMatch(/^#[a-z-]+$/);
    for (const item of nav) expect(item.label.trim().length).toBeGreaterThan(2);
  });

  it("название компании и город указаны", () => {
    expect(company.name).toBe("YASIRA MOTORS");
    expect(company.city).toBe("Актау");
  });

  it("способы оплаты перечислены", () => {
    expect(paymentMethods.length).toBeGreaterThanOrEqual(3);
    for (const method of paymentMethods) expect(method.trim().length).toBeGreaterThan(3);
  });

  it("данные группы компаний согласованы", () => {
    expect(group.yearsOnMarket).toBe(20);
    expect(group.oilItems).toBe(1500);
    expect(group.offices).toContain("Актау");
    expect(group.cities).toBeGreaterThanOrEqual(10);
  });
});
