import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  REVIEWS_SHOWN,
  advantages,
  faq,
  photos,
  process,
  reviews,
  serviceGroups,
  symptoms,
  visibleReviews,
} from "@/lib/content";
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
/** Чтение исходника по пути относительно корня проекта. */
const readSource = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf8");

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

  it("график совпадает с подтверждённым владельцем", () => {
    // Владелец подтвердил: Пн–Сб 09:00–19:00, Вс 10:00–17:00.
    // Это же значение в карточке 2ГИС, второго варианта быть не должно.
    expect(scheduleSummary).toBe("Пн–Сб 09:00–19:00 · Вс 10:00–17:00");
    for (const day of schedule.slice(0, 6)) {
      expect(day.open).toBe("09:00");
      expect(day.close).toBe("19:00");
    }
    expect(schedule[6].open).toBe("10:00");
    expect(schedule[6].close).toBe("17:00");
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

describe("быстрый путь к обращению", () => {
  it("каждый симптом ведёт в WhatsApp с готовым сообщением", () => {
    expect(symptoms.length).toBeGreaterThanOrEqual(5);
    for (const symptom of symptoms) {
      const url = new URL(whatsappLink(phone.whatsapp, symptom.text));
      expect(url.hostname).toBe("wa.me");
      expect(url.pathname).toBe(`/${phone.whatsapp}`);
      const text = url.searchParams.get("text") ?? "";
      expect(text.length, `короткое сообщение для «${symptom.label}»`).toBeGreaterThan(50);
      expect(text).toContain("YASIRA MOTORS");
      // Сообщение — вопрос клиента, а не обещание сервиса
      expect(text).not.toMatch(/гаранти|точно определ|диагноз/i);
    }
  });

  it("подписи симптомов уникальны и не превращаются в запись", () => {
    const labels = symptoms.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
    for (const symptom of symptoms) {
      expect(`${symptom.label} ${symptom.text}`).not.toMatch(/запис/i);
      expect(symptom.label.trim().length).toBeGreaterThan(5);
    }
  });

  it("первый экран показывает, можно ли звонить сейчас", () => {
    const hero = readSource("components/Hero.tsx");
    expect(hero).toContain("OpenStatus");
    expect(hero).toContain('variant="label"');
  });

  it("финальный призыв даёт крупный кликабельный номер и статус работы", () => {
    const cta = readSource("components/FinalCta.tsx");
    expect(cta).toContain("tel:${phone.tel}");
    expect(cta).toContain("OpenStatus");
  });
});

describe("заголовочный шрифт", () => {
  it("заголовки набраны отдельным шрифтом, отличным от текстового", () => {
    const css = readSource("app/globals.css");
    expect(css).toContain("--font-display");
    expect(css).toMatch(/\.display\s*\{[\s\S]*?font-family:\s*var\(--font-display\)/);
  });

  it("шрифты хостятся у нас, а не тянутся со стороннего CDN", () => {
    const css = readSource("app/globals.css");
    expect(css).not.toContain("fonts.googleapis.com");
    expect(css).not.toContain("fonts.gstatic.com");
    for (const file of [
      "oswald-cyrillic-600.woff2",
      "oswald-latin-600.woff2",
      "manrope-cyrillic.woff2",
      "jetbrains-mono-cyrillic-500.woff2",
    ]) {
      expect(fs.existsSync(publicFile(`/fonts/${file}`)), `нет файла ${file}`).toBe(true);
    }
  });

  it("у заголовков есть запас строки для диакритики (буква Й)", () => {
    // При line-height ниже 1 у Oswald срезается краткая над «Й»
    const css = readSource("app/globals.css");
    const display = css.match(/\.display\s*\{([\s\S]*?)\}/)?.[1] ?? "";
    const lineHeight = Number(display.match(/line-height:\s*([\d.]+)/)?.[1] ?? "0");
    expect(lineHeight).toBeGreaterThanOrEqual(1);
  });
});

describe("тёмная карта", () => {
  it("CSP разрешает кадр карты и не расширяет права на скрипты", () => {
    const config = JSON.parse(readSource("vercel.json"));
    const csp = config.headers[0].headers.find(
      (h: { key: string }) => h.key === "Content-Security-Policy",
    ).value as string;

    // Без openstreetmap.org в frame-src карта молча не загрузится,
    // а без 2gis.kz отвалится ссылка на маршрут внутри карты
    expect(csp).toContain("frame-src");
    expect(csp).toContain("https://www.openstreetmap.org");
    expect(csp).toContain("https://*.2gis.com");
    // Карта не должна тянуть сторонние скрипты
    expect(csp).toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).not.toContain("script-src https:");
  });

  it("карта грузится только по нажатию и маршрут строится из координат", () => {
    // Комментарии объясняют старый механизм — проверяем только код
    const map = readSource("components/MapPanel.tsx").replace(/\/\*[\s\S]*?\*\//g, "");
    expect(map).toContain("openstreetmap.org/export/embed.html");
    expect(map).toContain("address.lat");
    expect(map).toContain("address.lng");
    // Своя метка ставится оверлеем, а не берётся из чужого оформления
    expect(map).toContain("MapPin");

    // До нажатия — фасад с адресом: чужие тайлы не тянутся при прокрутке
    expect(map).toContain("Показать карту");
    // Бесконечного «Загружаем карту…» быть не должно
    expect(map).not.toContain("Загружаем карту");
    // При ошибке остаётся текстовая ссылка, а не пустая рамка
    expect(map).toContain("onError");

    // Маршрут в трёх картах, без ключей и сторонних библиотек
    for (const provider of ["2gis", "google", "yandex"]) {
      expect(map).toContain(`provider: "${provider}"`);
    }
  });

  it("тёмная тема карты сделана фильтром, а не платным провайдером", () => {
    const css = readSource("app/globals.css");
    expect(css).toContain(".map-dark");
    expect(css).toMatch(/invert\(0?\.92\)/);
  });
});

describe("бегущая строка", () => {
  const source = () =>
    fs.readFileSync(path.join(ROOT, "components", "Marquee.tsx"), "utf8");

  it("декоративная: скрыта от скринридеров и собрана из основных направлений", () => {
    expect(source()).toContain('aria-hidden="true"');
    // Полный перечень направлений остаётся ниже, в блоке услуг
    expect(source()).toMatch(/serviceGroups\.slice\(0, MAIN_DIRECTIONS\)/);
  });

  it("остаётся полоской и при reduced-motion — по просьбе владельца сайта", () => {
    /*
      Остановленная и обрезанная полоска читается столбиком текста, поэтому
      движение здесь сохраняется намеренно. Исключение живёт под отдельным
      классом; лента рубрик под блоком услуг по-прежнему останавливается
      и раскладывается в строки.
    */
    expect(source()).toContain("marquee-ribbon");
    const css = fs.readFileSync(path.join(ROOT, "app", "globals.css"), "utf8");
    expect(css).toMatch(
      /prefers-reduced-motion[\s\S]*\.marquee-ribbon \.marquee-track\s*\{[^}]*animation: marquee/,
    );
  });

  it("содержит две одинаковые копии — иначе цикл был бы с разрывом", () => {
    expect(source()).toMatch(/\[0, 1\]\.map/);
    const css = fs.readFileSync(path.join(ROOT, "app", "globals.css"), "utf8");
    expect(css).toMatch(/@keyframes marquee/);
    expect(css).toContain("-50%");
  });

  it("контейнер обрезает содержимое, чтобы не появлялся горизонтальный скролл", () => {
    expect(source()).toContain("overflow-hidden");
  });
});

describe("поведение при reduced-motion", () => {
  const css = () => fs.readFileSync(path.join(ROOT, "app", "globals.css"), "utf8");

  it("выключает все бесконечные анимации, а не ускоряет их", () => {
    /*
      Утилиты Tailwind с animation-iteration-count: infinite нельзя оставлять
      общему правилу с duration 0.001ms — при бесконечном повторе элемент
      начинает прокручивать тысячи циклов в секунду. Список проверяем целиком,
      чтобы новая утилита не осталась за его пределами.
    */
    const list = css().match(/\.spotlight,[\s\S]*?\{\s*animation: none !important;/);
    expect(list).not.toBeNull();
    for (const selector of [
      ".spotlight",
      ".beam-path",
      ".marquee-group .marquee-track",
      ".animate-bounce",
      ".animate-ping",
      ".animate-pulse",
    ]) {
      expect(list![0]).toContain(selector);
    }
  });

  it("раскладывает остановленную ленту рубрик, а не оставляет её обрезанной", () => {
    const source = css();
    expect(source).toMatch(
      /prefers-reduced-motion[\s\S]*\.marquee-group \.marquee-track\s*\{[^}]*flex-wrap: wrap/,
    );
    // Вторая копия нужна только для цикла — в статике это дубль каждого слова
    expect(source).toMatch(
      /prefers-reduced-motion[\s\S]*\.marquee-group \.marquee-track > :nth-child\(n \+ 2\)\s*\{[^}]*display: none/,
    );
  });
});

describe("правки по аудиту", () => {
  const layout = () => fs.readFileSync(path.join(ROOT, "app", "layout.tsx"), "utf8");

  /** Исходники всех компонентов, включая fx/: их тексты тоже видит клиент. */
  const componentSources = () => {
    const dir = path.join(ROOT, "components");
    const files: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        for (const nested of fs.readdirSync(path.join(dir, entry.name))) {
          if (nested.endsWith(".tsx")) files.push(path.join(dir, entry.name, nested));
        }
      } else if (entry.name.endsWith(".tsx")) {
        files.push(path.join(dir, entry.name));
      }
    }
    return files.map((file) => ({ name: path.basename(file), text: fs.readFileSync(file, "utf8") }));
  };

  it("метаданные берут телефон из конфига, а не номер магазина", () => {
    /*
      Аудит: description и og/twitter показывали +7 777 088 44 36 — номер
      магазина масел, тогда как все CTA на странице ведут на 44 24.
    */
    // Комментарий, который объясняет старый дефект, номер содержит — вырезаем
    const source = layout().replace(/\/\*[\s\S]*?\*\//g, "");
    expect(source).toContain("phone.display");
    expect(source).not.toMatch(/777\s?088\s?44\s?36/);
  });

  it("в текстах для клиента нет служебных пояснений", () => {
    // Комментарии разработчика проверке не подлежат — вырезаем их.
    const banned = [
      /заявила в 2ГИС/i,
      /Стоковых изображений/i,
      /\bсверено\b/i,
      /не скрываем/i,
      /без изменений, с автором/i,
    ];
    for (const { name, text } of componentSources()) {
      const body = text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
      for (const pattern of banned) {
        expect(pattern.test(body), `${name}: ${pattern}`).toBe(false);
      }
    }
  });

  it("у секций нет нумерации, которой нет в реальности", () => {
    for (const { name, text } of componentSources()) {
      expect(text.includes('index="0'), name).toBe(false);
    }
  });

  it("развал-схождение относится к ходовой части, а не к диагностике", () => {
    const diagnostika = serviceGroups.find((group) => group.id === "diagnostika")!;
    const hodovaya = serviceGroups.find((group) => group.id === "hodovaya")!;
    expect(diagnostika.items.join(" ")).not.toMatch(/развал/i);
    expect(hodovaya.items.join(" ")).toMatch(/развал-схождение/i);
  });

  it("в трансмиссии названы обе коробки передач", () => {
    const transmissiya = serviceGroups.find((group) => group.id === "transmissiya")!;
    expect(transmissiya.text).toMatch(/АКПП/);
    expect(transmissiya.text).toMatch(/МКПП/);
  });
});

describe("аналитика и шляпка", () => {
  it("без идентификаторов счётчики не подключаются вообще", () => {
    const source = readSource("lib/analytics.ts");
    expect(source).toContain("NEXT_PUBLIC_YM_ID");
    expect(source).toContain("NEXT_PUBLIC_GA_ID");
    // Обёртка выходит сразу: ни скрипта, ни запроса
    expect(source).toMatch(/!hasAnalytics\) return;/);
    expect(readSource("components/Analytics.tsx")).toMatch(/if \(!hasAnalytics\) return;/);
  });

  it("события размечены атрибутами рядом с элементами, а не селекторами", () => {
    for (const file of [
      "components/SymptomChips.tsx",
      "components/Services.tsx",
      "components/MobileBar.tsx",
      "components/MapPanel.tsx",
      "components/CopyPhone.tsx",
    ]) {
      expect(readSource(file), file).toContain("data-track");
    }
    // Источник клика передаёт сам компонент, а не угадывает скрипт
    expect(readSource("components/Actions.tsx")).toContain("data-track-source");
  });

  it("CSP разрешает счётчики, но не открывает script-src на весь https", () => {
    const config = JSON.parse(readSource("vercel.json"));
    const csp = config.headers[0].headers.find(
      (h: { key: string }) => h.key === "Content-Security-Policy",
    ).value as string;
    expect(csp).toContain("https://mc.yandex.ru");
    expect(csp).toContain("https://www.googletagmanager.com");
    expect(csp).not.toContain("script-src https:");
  });

  it("статичные ассеты отдаются с долгим кешем", () => {
    const config = JSON.parse(readSource("vercel.json"));
    const entry = config.headers.find(
      (h: { source: string }) => h.source === "/_next/static/(.*)",
    );
    expect(entry?.headers[0].value).toContain("immutable");
  });

  it("активный раздел подсвечивается в навигации", () => {
    const header = readSource("components/Header.tsx");
    expect(header).toContain("aria-current");
    expect(header).toContain("IntersectionObserver");
  });
});

describe("частые вопросы", () => {
  it("шесть-восемь вопросов, ответы только из подтверждённых данных", () => {
    expect(faq.length).toBeGreaterThanOrEqual(6);
    expect(faq.length).toBeLessThanOrEqual(8);
    for (const item of faq) {
      expect(item.question.endsWith("?")).toBe(true);
      expect(item.answer.length).toBeGreaterThan(15);
      // Гарантий, цен и скидок владелец не подтверждал — обещать нельзя
      expect(item.answer).not.toMatch(/гаранти|₸|скидк|бесплатн/i);
    }
  });

  it("аккордеон нативный, а разметка FAQPage берёт те же данные", () => {
    const component = fs.readFileSync(path.join(ROOT, "components", "Faq.tsx"), "utf8");
    expect(component).toContain("<details");
    expect(component).toContain("<summary");
    const seo = fs.readFileSync(path.join(ROOT, "lib", "seo.ts"), "utf8");
    expect(seo).toContain("FAQPage");
    expect(seo).toContain("faq.map");
  });

  it("устаревший meta keywords убран", () => {
    const layout = fs
      .readFileSync(path.join(ROOT, "app", "layout.tsx"), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "");
    expect(layout).not.toContain("keywords");
  });
});

describe("мобильная выдача", () => {
  it("симптомов не больше девяти и у каждого готовое сообщение", () => {
    expect(symptoms.length).toBeLessThanOrEqual(9);
    for (const symptom of symptoms) {
      expect(symptom.text).toContain("Здравствуйте! Пишу с сайта YASIRA MOTORS.");
      expect(symptom.text.trimEnd().endsWith("Авто (марка, модель, год):")).toBe(true);
    }
  });

  it("отзывы идут свежие сверху, не больше шести, старые скрыты", () => {
    expect(visibleReviews.length).toBeLessThanOrEqual(REVIEWS_SHOWN);
    const dates = visibleReviews.map((review) => review.dateISO);
    expect([...dates].sort((a, b) => b.localeCompare(a))).toEqual(dates);
    for (const review of visibleReviews) {
      // Скрытый отзыв не должен попасть в выборку, а старый — тем более
      expect(review.hidden).toBeUndefined();
      expect(review.dateISO >= "2021-01-01").toBe(true);
    }
  });

  it("строка услуги — одна ссылка, без вложенных", () => {
    /*
      На телефоне по строке попасть проще, чем по кнопке рядом, а вложенные
      ссылки ломают и разметку, и озвучку скринридером.
    */
    const source = fs.readFileSync(path.join(ROOT, "components", "Services.tsx"), "utf8");
    // Границы списка: от его начала до ленты рубрик под ним
    const list = source.slice(source.indexOf("serviceGroups.map"), source.indexOf("<RubricMarquee"));
    expect(list).toContain("whatsappLink(phone.whatsapp");
    expect(list).not.toContain("`tel:");
    expect(list.match(/<a[\s>]/g)?.length).toBe(1);
  });

  it("«Что беспокоит?» стоит сразу после первого экрана", () => {
    const page = fs.readFileSync(path.join(ROOT, "app", "page.tsx"), "utf8");
    let cursor = -1;
    for (const marker of ["<Hero />", "<Marquee />", "<SymptomChips />", "<Services />"]) {
      const at = page.indexOf(marker);
      expect(at, marker).toBeGreaterThan(cursor);
      cursor = at;
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

