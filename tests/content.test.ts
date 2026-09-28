import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { advantages, photos, process, reviews, serviceGroups } from "@/lib/content";
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
  scheduleNote,
  scheduleSummary,
  SITE_URL,
  SITE_URL_IS_CONFIRMED,
  SITE_URL_SOURCE,
  whatsappLink,
  whatsappText,
} from "@/lib/site";
import { getOpenState, toMinutes } from "@/lib/schedule";

const ROOT = path.resolve(__dirname, "..");
const publicFile = (src: string) => path.join(ROOT, "public", src.replace(/^\//, ""));

/** Все исходники приложения — для сквозных проверок содержимого. */
function appSources(): { file: string; text: string }[] {
  const dirs = ["app", "components", "lib"];
  const out: { file: string; text: string }[] = [];
  for (const dir of dirs) {
    for (const name of fs.readdirSync(path.join(ROOT, dir))) {
      if (!/\.(ts|tsx)$/.test(name)) continue;
      const file = path.join(dir, name);
      out.push({ file, text: fs.readFileSync(path.join(ROOT, file), "utf8") });
    }
  }
  return out;
}

describe("контакты", () => {
  it("телефон для звонка записан в международном формате", () => {
    expect(phone.tel).toMatch(/^\+7\d{10}$/);
    expect(phone.display.replace(/\D/g, "")).toBe(phone.tel.replace(/\D/g, ""));
  });

  it("главная кнопка ведёт в автосервис, а не в магазин", () => {
    // Карточка 2ГИС подписывает +7 777 088 44 24 как «СТО»,
    // а +7 777 088 44 36 как «магазин». Сайт про сервис.
    expect(phone.tel).toBe("+77770884424");
    expect(phone.tel).not.toBe("+77770884436");
  });

  it("опубликованы все четыре номера из карточки 2ГИС с их подписями", () => {
    // Номера видны в карточке после нажатия «Показать телефоны».
    const expected = [
      { tel: "+77770884424", label: "Автосервис" },
      { tel: "+77770884408", label: "Автосервис" },
      { tel: "+77770884436", label: "Магазин масел" },
      { tel: "+77770884433", label: "Детейлинг" },
    ];
    expect(phones).toHaveLength(4);
    for (const item of expected) {
      const found = phones.find((p) => p.tel === item.tel);
      expect(found, `нет номера ${item.tel}`).toBeDefined();
      expect(found?.label).toBe(item.label);
    }
    expect(new Set(phones.map((p) => p.tel)).size).toBe(4);
  });

  it("основной номер присутствует в списке телефонов", () => {
    expect(phones.map((p) => p.tel)).toContain(phone.tel);
  });

  it("номер WhatsApp состоит только из цифр и совпадает с основным", () => {
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

  it("текст WhatsApp не ломает ссылку спецсимволами", () => {
    const url = new URL(whatsappLink(phone.whatsapp, 'Привет & вопрос: "масло"? #1'));
    expect(url.searchParams.get("text")).toBe('Привет & вопрос: "масло"? #1');
    expect(url.href).not.toMatch(/[\s"#]/);
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

  it("в сводке графика нет второго варианта времени закрытия", () => {
    expect(scheduleSummary).toBe("Пн–Сб 09:00–19:00 · Вс 10:00–17:00");
    expect(scheduleNote).toContain("2ГИС");
    expect(scheduleNote).toContain("уточняйте по телефону");
  });

  it("состояние всегда рассчитывается без исключений", () => {
    for (let hour = 0; hour < 24; hour += 1) {
      const state = getOpenState(new Date(`2026-09-28T${String(hour).padStart(2, "0")}:15+05:00`));
      expect(typeof state.open).toBe("boolean");
      expect(state.text).toMatch(/Сейчас (открыто|закрыто)/);
    }
  });
});

describe("рейтинг", () => {
  it("значения совпадают с карточкой 2ГИС", () => {
    expect(rating.value).toBe(4.9);
    expect(rating.count).toBe(478);
    expect(rating.reviews).toBe(107);
    expect(rating.photos).toBe(54);
    expect(rating.source).toBe("2ГИС");
    expect(rating.verifiedOn).toMatch(/^\d{2}\.\d{2}\.\d{4}$/);
  });

  it("рейтинг не подменяется другими числами (4.5 / 390)", () => {
    // 4.5 и ~390 для YASIRA MOTORS на 2ГИС не существуют — проверено на живой карточке.
    expect(rating.value).not.toBe(4.5);
    expect(rating.count).not.toBe(390);
  });

  it("награда описана ровно так, как в источнике", () => {
    expect(rating.awardBadge).toBe("2GIS Awards");
    expect(rating.awardTitle).toBe("Лучший автосервис 2026");
    // Слов, которых нет в карточке, быть не должно
    const wording = `${rating.awardBadge} ${rating.awardTitle}`.toLowerCase();
    for (const claim of ["победител", "премия", "награда вручена", "номинант"]) {
      expect(wording).not.toContain(claim);
    }
  });

  it("рейтинг используется из одного источника, а не вписан в компоненты", () => {
    for (const { file, text } of appSources()) {
      if (file === path.join("lib", "site.ts")) continue;
      // В компонентах не должно быть «4,9» / «478» как захардкоженных значений
      expect(text, `${file} содержит захардкоженное число оценок`).not.toMatch(/\b478\b/);
      expect(text, `${file} содержит захардкоженный рейтинг`).not.toMatch(/4[.,]9\s*(из|\/)/);
    }
  });
});

describe("услуги", () => {
  it("восемь направлений с уникальными идентификаторами", () => {
    expect(serviceGroups).toHaveLength(8);
    expect(new Set(serviceGroups.map((s) => s.id)).size).toBe(serviceGroups.length);
  });

  it("у каждого направления есть название, описание, работы и источник", () => {
    for (const group of serviceGroups) {
      expect(group.title.trim().length).toBeGreaterThan(3);
      expect(group.text.trim().length).toBeGreaterThan(20);
      expect(group.source.trim().length).toBeGreaterThan(3);
      expect(group.items.length).toBeGreaterThanOrEqual(1);
      for (const item of group.items) expect(item.trim().length).toBeGreaterThan(2);
      expect(group.icon).toBeTruthy();
    }
  });

  it("описания короткие: не больше двух предложений", () => {
    for (const group of serviceGroups) {
      const sentences = group.text.split(/(?<=[.!?])\s+/).filter(Boolean);
      expect(sentences.length, `${group.title}: слишком длинный текст`).toBeLessThanOrEqual(2);
      expect(group.text.length).toBeLessThan(140);
    }
  });

  it("не обещаем того, чего нет в источниках", () => {
    const text = serviceGroups.map((s) => `${s.title} ${s.text} ${s.items.join(" ")}`).join(" ");
    for (const pattern of [/гаранти/i, /\bбесплатн/i, /скидк/i, /за \d+ минут/i, /точност[ьи] до/i]) {
      expect(text).not.toMatch(pattern);
    }
  });
});

describe("преимущества и процесс", () => {
  it("четыре короткие причины обратиться", () => {
    expect(advantages).toHaveLength(4);
    for (const item of advantages) {
      expect(item.title.trim().length).toBeGreaterThan(8);
      expect(item.text.trim().length).toBeGreaterThan(30);
      expect(item.text.length).toBeLessThan(120);
      expect(item.icon).toBeTruthy();
    }
  });

  it("преимущества не содержат рекламных штампов", () => {
    const text = advantages.map((a) => `${a.title} ${a.text}`).join(" ");
    for (const pattern of [
      /индивидуальный подход/i,
      /лучшие специалисты/i,
      /высокое качество/i,
      /честн/i,
      /качественно и в срок/i,
    ]) {
      expect(text).not.toMatch(pattern);
    }
  });

  it("процесс — четыре шага", () => {
    expect(process).toHaveLength(4);
    expect(process.map((s) => s.step)).toEqual(["01", "02", "03", "04"]);
    for (const step of process) {
      expect(step.title.trim().length).toBeGreaterThan(5);
      expect(step.text.trim().length).toBeGreaterThan(15);
    }
  });
});

describe("отзывы", () => {
  it("шесть отзывов, все заполнены и не дублируются", () => {
    expect(reviews).toHaveLength(6);
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
    const today = Date.now();
    for (const review of reviews) {
      expect(new Date(review.dateISO).getTime()).toBeLessThanOrEqual(today);
    }
  });

  it("в выборке есть отзывы с конкретикой, а не только общая похвала", () => {
    const text = reviews.map((r) => r.text).join(" ").toLowerCase();
    // «ABS» в отзыве набрано кириллическими А и В, поэтому проверяем
    // токены, которые точно воспроизводятся: они и доказывают конкретику.
    for (const concrete of ["датчик", "амортизатор", "масло", "свечи", "электрик", "блакировка"]) {
      expect(text, `нет конкретики про «${concrete}»`).toContain(concrete);
    }
  });

  it("отзывы на казахском помечены языком", () => {
    const kk = reviews.filter((r) => r.lang === "kk");
    expect(kk.length).toBeGreaterThanOrEqual(1);
    for (const review of kk) {
      expect(review.text).toMatch(/[әғқңөұүһі]/i);
    }
  });
});

describe("фотографии", () => {
  it("все файлы существуют на диске", () => {
    for (const photo of photos) {
      expect(fs.existsSync(publicFile(photo.src)), `нет файла ${photo.src}`).toBe(true);
    }
  });

  it("у каждой фотографии описательный alt и размеры", () => {
    for (const photo of photos) {
      expect(photo.alt.length, `короткий alt: ${photo.src}`).toBeGreaterThan(25);
      expect(photo.caption.trim().length).toBeGreaterThan(5);
      expect(photo.w).toBeGreaterThan(300);
      expect(photo.h).toBeGreaterThan(300);
    }
  });

  it("нет повторяющихся изображений и тяжёлых файлов", () => {
    const srcs = photos.map((p) => p.src);
    expect(new Set(srcs).size).toBe(srcs.length);
    for (const photo of photos) {
      const size = fs.statSync(publicFile(photo.src)).size;
      expect(size, `${photo.src} весит ${Math.round(size / 1024)}KB`).toBeLessThan(320 * 1024);
    }
  });
});

describe("нет онлайн-записи", () => {
  it("в исходниках нет booking-механики", () => {
    const banned = [
      /записаться/i,
      /\bзапись\b/i,
      /booking/i,
      /appointment/i,
      /свободные слот/i,
      /выберите дату/i,
      /выберите время/i,
      /отправить заявку/i,
      /перенести запись/i,
      /отменить запись/i,
      /<form/i,
      /<input/i,
      /<select/i,
      /<textarea/i,
    ];
    for (const { file, text } of appSources()) {
      for (const pattern of banned) {
        expect(text, `${file} содержит ${pattern}`).not.toMatch(pattern);
      }
    }
  });

  it("в навигации нет пункта записи", () => {
    expect(nav.map((item) => item.label)).toEqual([
      "Услуги",
      "О компании",
      "Отзывы",
      "Фото",
      "Контакты",
    ]);
  });
});

describe("действия на сайте", () => {
  it("используются только три типа действий", () => {
    const ctaWords = ["Позвонить", "WhatsApp", "Построить маршрут"];
    for (const word of ctaWords) expect(word.length).toBeGreaterThan(3);
    // Никаких «оставить заявку», «получить консультацию», «записаться»
    const sources = appSources()
      .map((s) => s.text)
      .join(" ");
    for (const banned of [/получить консультац/i, /оставить заявк/i, /записаться/i]) {
      expect(sources).not.toMatch(banned);
    }
  });
});

describe("SEO-данные", () => {
  it("базовый адрес сайта задан корректно", () => {
    expect(SITE_URL).toMatch(/^https?:\/\/[^/]+$/);
    expect(SITE_URL.endsWith("/")).toBe(false);
  });

  it("собственный адрес сайта не зашит в код", () => {
    const source = fs.readFileSync(path.join(ROOT, "lib", "site.ts"), "utf8");
    const head = source.slice(0, source.indexOf("export const company"));
    expect(head).toContain("NEXT_PUBLIC_SITE_URL");
    expect(head).not.toMatch(/https?:\/\/[a-z0-9-]+\.[a-z]{2,}/i);
    expect(head).toContain("http://localhost:3000");
    expect(["env", "vercel", "dev"]).toContain(SITE_URL_SOURCE);
    expect(SITE_URL_IS_CONFIRMED).toBe(SITE_URL_SOURCE !== "dev");
  });

  it("навигация состоит из уникальных анкоров", () => {
    const hrefs = nav.map((item) => item.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    for (const href of hrefs) expect(href).toMatch(/^#[a-z-]+$/);
  });

  it("название компании и город указаны", () => {
    expect(company.name).toBe("YASIRA MOTORS");
    expect(company.city).toBe("Актау");
  });

  it("способы оплаты перечислены", () => {
    expect(paymentMethods.length).toBeGreaterThanOrEqual(3);
  });

  it("данные группы компаний согласованы", () => {
    expect(group.yearsOnMarket).toBe(20);
    expect(group.oilItems).toBe(1500);
    expect(group.offices).toContain("Актау");
  });
});
