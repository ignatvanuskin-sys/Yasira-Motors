"use strict";

/**
 * Продакшн-аудит собранного сайта.
 *
 *   node scripts/audit.js                    — локально (out/ + заголовки vercel.json)
 *   node scripts/audit.js https://домен      — по задеплоенному сайту
 *
 * Группы проверок:
 *   1. файлы сборки и обязательные ассеты
 *   2. заголовки безопасности и кэширования
 *   3. SEO и метаданные
 *   4. структурированные данные (Schema.org)
 *   5. доступность — axe-core (WCAG 2.0/2.1/2.2 AA + best practice)
 *   6. клавиатура и фокус
 *   7. анкор-навигация (не прячется ли контент под шапкой)
 *   8. внешние ссылки
 *   9. производительность под троттлингом (Slow 4G + 4× CPU)
 */

const fs = require("node:fs");
const path = require("node:path");
const cdp = require("./lib/cdp");
const { createStaticServer, listen } = require("./lib/static-server");

const ROOT = path.resolve(__dirname, "..", "out");
const REPORTS = path.resolve(__dirname, "..", "qa-reports");
const EXTERNAL = process.argv.slice(2).find((arg) => /^https?:\/\//.test(arg));
const axeSource = require("axe-core").source;

/** Наблюдатели LCP/CLS ставятся до первой отрисовки. */
const PERF_HOOK = `
  window.__perf = { lcp: 0, cls: 0 };
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (e.startTime > window.__perf.lcp) window.__perf.lcp = e.startTime;
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (e) {}
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (!e.hadRecentInput) window.__perf.cls += e.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  } catch (e) {}
`;

const AXE_OPTIONS = {
  resultTypes: ["violations"],
  runOnly: {
    type: "tag",
    values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"],
  },
};

const groups = [];
let currentGroup = null;

function record(severity, id, message, details) {
  currentGroup.findings.push({ severity, id, message, details });
}

async function runGroup(name, fn) {
  currentGroup = { name, findings: [] };
  groups.push(currentGroup);
  try {
    await fn();
  } catch (error) {
    record("error", "group-crashed", String(error && error.message ? error.message : error));
  }
  const errors = currentGroup.findings.filter((f) => f.severity === "error").length;
  const warns = currentGroup.findings.filter((f) => f.severity === "warning").length;
  const state = errors ? `ошибок: ${errors}` : warns ? `предупреждений: ${warns}` : "OK";
  console.log(`  ${name.padEnd(34)} ${state}`);
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function main() {
  let server = null;
  let base = EXTERNAL;

  if (EXTERNAL) {
    base = EXTERNAL.replace(/\/+$/, "");
    console.log(`Аудит задеплоенного сайта: ${base}\n`);
  } else {
    server = createStaticServer(ROOT);
    base = `http://127.0.0.1:${await listen(server)}`;
    console.log(`Аудит локальной сборки: ${base}\n`);
  }

  fs.mkdirSync(REPORTS, { recursive: true });

  const browser = await cdp.launch({ port: 9444, width: 1440, height: 900 });
  const page = browser.page;
  const consoleErrors = [];

  try {
    await page.send("Runtime.enable");
    await page.send("Log.enable");
    page.on("Runtime.exceptionThrown", (params) => {
      consoleErrors.push(params.exceptionDetails?.exception?.description || "unknown");
    });
    await page.send("Page.addScriptToEvaluateOnNewDocument", { source: PERF_HOOK });

    const html = await fetchText(`${base}/`);

    /* ---------------------------- 1. Файлы сборки --------------------------- */
    await runGroup("Файлы сборки и ассеты", async () => {
      if (!EXTERNAL) {
        const required = [
          "index.html",
          "404.html",
          "robots.txt",
          "sitemap.xml",
          "manifest.webmanifest",
          "icon.svg",
          "apple-icon.png",
          "icon-192.png",
          "icon-512.png",
          "og.jpg",
        ];
        for (const file of required) {
          if (!fs.existsSync(path.join(ROOT, file))) {
            record("error", "missing-file", `нет файла out/${file}`);
          }
        }
        const opt = path.join(ROOT, "images", "opt");
        if (!fs.existsSync(opt) || fs.readdirSync(opt).length < 8) {
          record("error", "missing-photos", "меньше 8 оптимизированных фотографий");
        }
      }

      // out/404.html отдаётся напрямую только локальным сервером:
      // на Vercel этот файл используется как документ для 404, а не по своему пути.
      const urls = ["/", "/robots.txt", "/sitemap.xml", "/manifest.webmanifest", "/og.jpg"];
      if (!EXTERNAL) urls.push("/404.html");
      for (const url of urls) {
        const res = await fetch(`${base}${url}`, { method: "GET" });
        if (!res.ok) record("error", "http-status", `${url} вернул ${res.status}`);
      }

      const notFound = await fetch(`${base}/etoy-stranicy-tochno-net`);
      if (notFound.status !== 404) {
        record("error", "404-status", `несуществующий путь вернул ${notFound.status}, ожидался 404`);
      } else {
        const body = await notFound.text();
        if (!/Такой страницы нет/.test(body)) {
          record("error", "404-branded", "404 отдаётся без брендированной страницы");
        }
        if (!/noindex/i.test(body)) {
          record("warning", "404-noindex", "у страницы 404 нет noindex");
        }
      }

      const ogBuffer = Buffer.from(await (await fetch(`${base}/og.jpg`)).arrayBuffer());
      const sharp = require("sharp");
      const meta = await sharp(ogBuffer).metadata();
      if (meta.width !== 1200 || meta.height !== 630) {
        record("error", "og-size", `og.jpg ${meta.width}x${meta.height}, нужен 1200x630`);
      }
    });

    /* ------------------------ 2. Заголовки безопасности --------------------- */
    await runGroup("Заголовки безопасности", async () => {
      const res = await fetch(`${base}/`);
      const required = [
        "content-security-policy",
        "x-content-type-options",
        "referrer-policy",
        "x-frame-options",
        "permissions-policy",
        "strict-transport-security",
      ];
      for (const header of required) {
        const value = res.headers.get(header);
        if (!value) record("error", "missing-header", `нет заголовка ${header}`);
      }

      const csp = res.headers.get("content-security-policy") || "";
      for (const directive of ["default-src 'self'", "object-src 'none'", "frame-ancestors 'none'", "base-uri 'self'", "form-action 'none'"]) {
        if (!csp.includes(directive)) {
          record("error", "csp-directive", `в CSP нет «${directive}»`);
        }
      }
      if (csp.includes("script-src") && !csp.includes("script-src 'self'")) {
        record("warning", "csp-script", "script-src не ограничен 'self'");
      }

      const images = await fetch(`${base}/images/opt/workshop-lifts.webp`, { method: "HEAD" });
      const cache = images.headers.get("cache-control") || "";
      if (!/max-age=\d{4,}/.test(cache)) {
        record("warning", "image-cache", `слабый кэш изображений: «${cache || "нет заголовка"}»`);
      }
    });

    /* ------------------------------ 3. SEO --------------------------------- */
    await runGroup("SEO и метаданные", async () => {
      const title = match(html, /<title>([^<]*)<\/title>/);
      const description = match(html, /<meta name="description" content="([^"]*)"/);

      if (!title) record("error", "title", "нет <title>");
      else if (title.length < 30 || title.length > 70) {
        record("warning", "title-length", `title ${title.length} символов (рекомендуется 30–70)`);
      }

      if (!description) record("error", "description", "нет meta description");
      else if (description.length < 70 || description.length > 180) {
        record("warning", "description-length", `description ${description.length} символов (рекомендуется 70–180)`);
      }

      if (!/<html[^>]+lang="ru"/.test(html)) record("error", "lang", "нет lang=\"ru\" на <html>");
      if (!/<link rel="canonical" href="(https?:\/\/[^"]+)"/.test(html)) {
        record("error", "canonical", "нет абсолютного canonical");
      }
      for (const tag of ["og:title", "og:description", "og:image", "og:url", "og:type", "twitter:card"]) {
        if (!html.includes(`property="${tag}"`) && !html.includes(`name="${tag}"`)) {
          record("error", "og-tag", `нет ${tag}`);
        }
      }
      if (/name="robots"[^>]*noindex/i.test(html)) record("error", "noindex", "страница закрыта от индексации");
      if (/user-scalable=no|maximum-scale=1/.test(html)) {
        record("error", "zoom", "масштабирование запрещено (вредно для доступности)");
      }

      const robots = await fetchText(`${base}/robots.txt`);
      if (!/Sitemap:\s*https?:\/\//i.test(robots)) record("error", "robots-sitemap", "в robots.txt нет Sitemap");
      const sitemap = await fetchText(`${base}/sitemap.xml`);
      if (!/<urlset/.test(sitemap) || !/<loc>/.test(sitemap)) record("error", "sitemap", "sitemap.xml невалиден");
      const hostOf = (value) => (value || "").replace(/^https?:\/\//, "").replace(/\/+$/, "");
      const canonicalBase = match(html, /<link rel="canonical" href="(https?:\/\/[^"]+)"/);
      const canonicalHost = hostOf(canonicalBase);

      if (canonicalHost) {
        const sitemapHost = hostOf(match(sitemap, /<loc>(https?:\/\/[^<]+)<\/loc>/));
        if (sitemapHost && sitemapHost !== canonicalHost) {
          record("warning", "host-mismatch", `canonical ${canonicalHost} и sitemap ${sitemapHost} расходятся`);
        }
        if (EXTERNAL && hostOf(EXTERNAL) !== canonicalHost) {
          record(
            "warning",
            "canonical-host",
            `canonical указывает на ${canonicalHost}, а сайт открыт на ${hostOf(EXTERNAL)}`,
          );
        }
      }
    });

    /* ------------------- 4. Структурированные данные ------------------------ */
    await runGroup("Структурированные данные", async () => {
      const raw = match(html, /<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      if (!raw) {
        record("error", "no-jsonld", "нет разметки JSON-LD");
        return;
      }
      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        record("error", "jsonld-parse", "JSON-LD не парсится");
        return;
      }

      const types = Array.isArray(data["@type"]) ? data["@type"] : [data["@type"]];
      if (!types.includes("AutoRepair")) record("error", "jsonld-type", "нет типа AutoRepair");
      for (const field of ["name", "url", "telephone", "address", "geo", "openingHoursSpecification"]) {
        if (!data[field]) record("error", "jsonld-field", `нет обязательного поля ${field}`);
      }
      if (data.aggregateRating) {
        record("error", "jsonld-rating", "чужие отзывы перенесены в aggregateRating — риск санкций Google");
      }
      if (data.telephone && !/^\+\d{11,15}$/.test(data.telephone)) {
        record("warning", "jsonld-phone", `телефон не в формате E.164: ${data.telephone}`);
      }
      if (data.address?.addressCountry !== "KZ") record("error", "jsonld-country", "addressCountry должен быть KZ");
      const geo = data.geo || {};
      if (Math.abs(geo.latitude - 43.6547) > 0.01 || Math.abs(geo.longitude - 51.1847) > 0.01) {
        record("error", "jsonld-geo", "координаты не совпадают с карточкой 2ГИС");
      }

      const validDays = new Set(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]);
      const hours = data.openingHoursSpecification || [];
      if (hours.length !== 7) record("error", "jsonld-hours-count", `дней в графике: ${hours.length}, нужно 7`);
      const seenDays = new Set();
      for (const entry of hours) {
        const day = String(entry.dayOfWeek || "").split("/").pop();
        if (!validDays.has(day)) record("error", "jsonld-day", `некорректный dayOfWeek: ${entry.dayOfWeek}`);
        if (seenDays.has(day)) record("error", "jsonld-day-dup", `день повторяется: ${day}`);
        seenDays.add(day);
        if (!/^\d{2}:\d{2}$/.test(entry.opens || "") || !/^\d{2}:\d{2}$/.test(entry.closes || "")) {
          record("error", "jsonld-time", `некорректное время: ${entry.opens}–${entry.closes}`);
        }
      }

      const offers = data.hasOfferCatalog?.itemListElement || [];
      const jsonldServices = offers.map((o) => o.itemOffered?.name).filter(Boolean);
      const { services } = await importContent();
      const missing = services.map((s) => s.title).filter((t) => !jsonldServices.includes(t));
      if (missing.length) record("warning", "jsonld-services", `услуги не попали в разметку: ${missing.join(", ")}`);
    });

    /* --------------------- 5. Доступность (axe-core) ----------------------- */
    for (const viewport of [
      { label: "1440", width: 1440, height: 900 },
      { label: "390", width: 390, height: 844 },
    ]) {
      await runGroup(`Доступность axe-core (${viewport.label}px)`, async () => {
        await cdp.setViewport(page, viewport.width, viewport.height);
        await cdp.navigate(page, `${base}/`);
        await cdp.evaluate(page, `document.fonts.ready.then(() => true)`);
        await cdp.evaluate(page, axeSource);

        const violations = await cdp.evaluate(
          page,
          `(async () => {
             const result = await axe.run(document, ${JSON.stringify(AXE_OPTIONS)});
             return result.violations.map((v) => ({
               id: v.id,
               impact: v.impact,
               help: v.help,
               nodes: v.nodes.slice(0, 4).map((n) => ({
                 target: Array.isArray(n.target) ? n.target.join(" ") : String(n.target),
                 snippet: (n.html || "").slice(0, 140),
                 summary: (n.failureSummary || "").split("\\n")[0].slice(0, 200),
               })),
               count: v.nodes.length,
             }));
           })()`,
        );

        for (const violation of violations || []) {
          const severity = violation.impact === "critical" || violation.impact === "serious" ? "error" : "warning";
          record(
            severity,
            `axe:${violation.id}`,
            `${violation.help} (узлов: ${violation.count})`,
            violation.nodes,
          );
        }
      });
    }

    /* ------------------- 6. Клавиатура и фокус ----------------------------- */
    await runGroup("Клавиатура и фокус", async () => {
      await cdp.setViewport(page, 390, 844);
      await cdp.navigate(page, `${base}/`);

      const skipLink = await cdp.evaluate(
        page,
        `(() => {
           const el = document.querySelector('a[href="#services"]');
           if (!el) return { ok: false };
           el.focus();
           const cs = getComputedStyle(el);
           const visible = cs.position !== 'absolute' || cs.clipPath === 'none' || cs.width !== '1px';
           return { ok: true, visible, outline: cs.outlineWidth, text: (el.textContent || '').trim() };
         })()`,
      );
      if (!skipLink.ok) record("error", "skip-link", "нет ссылки «Перейти к услугам»");

      const menu = await cdp.evaluate(
        page,
        `(async () => {
           const trigger = document.querySelector("header button[aria-controls='mobile-menu']");
           trigger.focus();
           trigger.click();
           await new Promise((r) => setTimeout(r, 250));
           const nav = document.getElementById('mobile-menu');
           const opened = nav && !nav.hasAttribute('hidden');
           const firstLink = nav ? nav.querySelector('a') : null;
           if (firstLink) firstLink.focus();
           const focusedInside = nav ? nav.contains(document.activeElement) : false;
           window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
           await new Promise((r) => setTimeout(r, 300));
           const closed = !nav || nav.hasAttribute('hidden');
           return {
             opened,
             focusedInside,
             closed,
             focusReturned: document.activeElement === trigger,
             activeTag: document.activeElement ? document.activeElement.tagName : null,
           };
         })()`,
      );
      if (!menu.opened) record("error", "menu-open", "мобильное меню не открылось");
      if (!menu.closed) record("error", "menu-close", "меню не закрывается по Escape");
      if (!menu.focusReturned) {
        record("error", "menu-focus-return", "после закрытия меню фокус не вернулся на кнопку");
      }

      await cdp.setViewport(page, 1440, 900);
      await cdp.navigate(page, `${base}/`);
      const lightbox = await cdp.evaluate(
        page,
        `(async () => {
           const tile = document.querySelector('#gallery button');
           if (!tile) return { ok: false };
           tile.focus();
           tile.click();
           await new Promise((r) => setTimeout(r, 300));
           const dialog = document.querySelector('[role="dialog"]');
           return {
             ok: true,
             opened: !!dialog,
             focusInDialog: dialog ? dialog.contains(document.activeElement) : false,
             escapeCloses: (() => {
               window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
               return true;
             })(),
           };
         })()`,
      );
      await cdp.sleep(300);
      const afterEscape = await cdp.evaluate(
        page,
        `(() => ({
           closed: !document.querySelector('[role="dialog"]'),
           focusReturned: document.activeElement === document.querySelector('#gallery button'),
         }))()`,
      );
      if (!lightbox.opened) record("error", "lightbox-open", "лайтбокс не открылся");
      if (!lightbox.focusInDialog) record("error", "lightbox-focus", "фокус не переходит внутрь лайтбокса");
      if (!afterEscape.closed) record("error", "lightbox-escape", "лайтбокс не закрывается по Escape");
      if (!afterEscape.focusReturned) {
        record("error", "lightbox-focus-return", "после закрытия лайтбокса фокус не вернулся на превью");
      }

      const focusVisible = await cdp.evaluate(
        page,
        `(() => {
           const style = getComputedStyle(document.documentElement);
           const probe = document.createElement('a');
           probe.href = '#';
           document.body.appendChild(probe);
           probe.focus();
           const cs = getComputedStyle(probe);
           const hasOutline = parseFloat(cs.outlineWidth) > 0 || cs.boxShadow !== 'none';
           probe.remove();
           return { hasOutline, scrollPadding: style.scrollPaddingTop };
         })()`,
      );
      if (!focusVisible.hasOutline) record("error", "focus-visible", "нет видимой обводки фокуса");
      if (!focusVisible.scrollPadding || focusVisible.scrollPadding === "auto") {
        record("warning", "scroll-padding", "не задан scroll-padding-top — анкоры могут прятаться под шапкой");
      }
    });

    /* ----------------------- 7. Анкор-навигация --------------------------- */
    await runGroup("Анкор-навигация", async () => {
      await cdp.setViewport(page, 1440, 900);
      await cdp.navigate(page, `${base}/`);

      const result = await cdp.evaluate(
        page,
        `(async () => {
           document.documentElement.style.scrollBehavior = 'auto';
           const anchors = [...document.querySelectorAll('a[href^="#"]')];
           const report = [];
           const headerH = (document.querySelector('header') || {}).offsetHeight || 0;
           for (const a of anchors) {
             const id = a.getAttribute('href').slice(1);
             if (!id) continue;
             const target = document.getElementById(id);
             if (!target) { report.push({ id, missing: true }); continue; }
             window.scrollTo({ top: 0, behavior: 'auto' });
             await new Promise((r) => setTimeout(r, 60));
             location.hash = '';
             location.hash = '#' + id;
             await new Promise((r) => setTimeout(r, 120));
             const top = target.getBoundingClientRect().top;
             report.push({ id, top: Math.round(top), headerH, hidden: top < -2 });
           }
           const unique = [];
           const seen = new Set();
           for (const item of report) { const k = item.id + (item.missing ? '-missing' : ''); if (!seen.has(k)) { seen.add(k); unique.push(item); } }
           return unique;
         })()`,
      );

      for (const item of result || []) {
        if (item.missing) record("error", "anchor-missing", `нет секции для анкора #${item.id}`);
        else if (item.hidden) record("error", "anchor-hidden", `#${item.id} уезжает под шапку (top=${item.top})`);
        else if (item.top < 0 || item.top > 160) {
          record("warning", "anchor-offset", `#${item.id} встаёт на ${item.top}px от верха`);
        }
      }
    });

    /* ------------------------- 8. Внешние ссылки -------------------------- */
    await runGroup("Внешние ссылки и контакты", async () => {
      await cdp.navigate(page, `${base}/`);
      const links = await cdp.evaluate(
        page,
        `(() => {
           const out = { external: new Set(), tel: new Set(), mailto: new Set(), whatsapp: new Set() };
           for (const a of document.querySelectorAll('a[href]')) {
             const href = a.getAttribute('href');
             if (href.startsWith('tel:')) out.tel.add(href);
             else if (href.startsWith('mailto:')) out.mailto.add(href);
             else if (href.includes('wa.me')) out.whatsapp.add(href);
             else if (/^https?:/.test(href)) out.external.add(href);
           }
           return {
             external: [...out.external],
             tel: [...out.tel],
             mailto: [...out.mailto],
             whatsapp: [...out.whatsapp],
           };
         })()`,
      );

      for (const href of links.tel || []) {
        if (!/^tel:\+\d{11,15}$/.test(href)) record("error", "tel-format", `некорректная ссылка ${href}`);
      }
      for (const href of links.mailto || []) {
        if (!/^mailto:[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(href)) {
          record("error", "mailto-format", `некорректная ссылка ${href}`);
        }
      }
      for (const href of links.whatsapp || []) {
        const url = new URL(href);
        if (url.hostname !== "wa.me" || !/^\d{11}$/.test(url.pathname.slice(1))) {
          record("error", "wa-format", `некорректная ссылка ${href}`);
        }
        if (!url.searchParams.get("text")) {
          record("warning", "wa-text", `нет предзаполненного текста в ${href.slice(0, 50)}`);
        }
      }

      const own = base.replace(/^https?:\/\//, "");
      for (const href of links.external || []) {
        if (href.includes(own)) continue;
        try {
          const res = await fetch(href, { method: "GET", redirect: "follow" });
          if (res.status >= 400) record("error", "external-status", `${href} → ${res.status}`);
          else if (!EXTERNAL) console.log(`      ${res.status} ${href.slice(0, 72)}`);
        } catch (error) {
          record("warning", "external-fetch", `${href} не отвечает: ${error.message}`);
        }
      }
    });

    /* --------------------------- 9. Контент ------------------------------- */
    await runGroup("Контент и вёрстка", async () => {
      const { services, reviews, photos } = await importContent();

      const checks = await cdp.evaluate(
        page,
        `(() => {
           const text = document.body.innerText;
           const imgs = [...document.querySelectorAll('img')];
           return {
             phoneOnPage: text.includes('+7 777 088 44 36'),
             addressOnPage: text.includes('25-й микрорайон, 52/2'),
             ratingOnPage: text.includes('4,9'),
             awardOnPage: text.includes('Лучший автосервис'),
             forms: document.querySelectorAll('form, input, textarea, select').length,
             h1: document.querySelectorAll('h1').length,
             h2: document.querySelectorAll('h2').length,
             imgsWithoutAlt: imgs.filter((i) => !i.getAttribute('alt')).length,
             imgsWithoutSize: imgs.filter((i) => !i.getAttribute('width') && !i.getAttribute('height')).length,
             lazyImgs: imgs.filter((i) => i.getAttribute('loading') === 'lazy').length,
             headings: [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => Number(h.tagName[1])),
             emptyLinks: [...document.querySelectorAll('a')].filter((a) => !(a.textContent || '').trim() && !a.getAttribute('aria-label')).length,
             langAttr: document.documentElement.lang,
             titleAttrDup: new Set([...document.querySelectorAll('a[href]')].map((a) => a.textContent.trim())).size,
           };
         })()`,
      );

      if (!checks.phoneOnPage) record("error", "phone-text", "телефон не найден текстом на странице");
      if (!checks.addressOnPage) record("error", "address-text", "адрес не найден текстом на странице");
      if (!checks.ratingOnPage) record("error", "rating-text", "рейтинг не найден текстом");
      if (!checks.awardOnPage) record("error", "award-text", "награда не найдена текстом");
      if (checks.forms !== 0) record("error", "forms", `найдены поля ввода: ${checks.forms} (онлайн-записи быть не должно)`);
      if (checks.h1 !== 1) record("error", "h1-count", `h1 на странице: ${checks.h1}`);
      if (checks.imgsWithoutAlt) record("error", "img-alt", `изображений без alt: ${checks.imgsWithoutAlt}`);
      if (checks.imgsWithoutSize) {
        record("warning", "img-size", `изображений без width/height: ${checks.imgsWithoutSize}`);
      }
      if (checks.emptyLinks) record("error", "empty-links", `ссылок без текста и aria-label: ${checks.emptyLinks}`);
      if (checks.langAttr !== "ru") record("error", "lang-attr", `lang="${checks.langAttr}"`);

      // Порядок заголовков без пропусков уровней
      let previous = 0;
      for (const level of checks.headings) {
        if (previous && level > previous + 1) {
          record("warning", "heading-skip", `пропуск уровня: h${previous} → h${level}`);
          break;
        }
        previous = level;
      }

      if (reviews.length < 8) record("error", "reviews-count", `отзывов на сайте: ${reviews.length}`);
      if (services.length < 6) record("error", "services-count", `услуг: ${services.length}`);
      if (photos.length < 8) record("error", "photos-count", `фотографий: ${photos.length}`);
    });

    /* ---------------------- 10. Производительность ------------------------ */
    await runGroup("Производительность (Slow 4G, 4× CPU)", async () => {
      await page.send("Network.enable");
      await page.send("Network.emulateNetworkConditions", {
        offline: false,
        latency: 150,
        downloadThroughput: (1.6 * 1024 * 1024) / 8,
        uploadThroughput: (750 * 1024) / 8,
      });
      await page.send("Emulation.setCPUThrottlingRate", { rate: 4 });
      await cdp.setViewport(page, 390, 844);
      await cdp.navigate(page, `${base}/`);

      const perf = await cdp.evaluate(
        page,
        `(async () => {
           await new Promise((r) => setTimeout(r, 2500));
           const nav = performance.getEntriesByType('navigation')[0] || {};
           const paints = performance.getEntriesByType('paint');
           const fcp = paints.find((p) => p.name === 'first-contentful-paint');
           const perf = window.__perf || null;
           return {
             fcp: fcp ? Math.round(fcp.startTime) : null,
             lcp: perf && perf.lcp ? Math.round(perf.lcp) : null,
             cls: perf ? Math.round(perf.cls * 1000) / 1000 : null,
             domContentLoaded: Math.round(nav.domContentLoadedEventEnd || 0),
             load: Math.round(nav.loadEventEnd || 0),
             transferKB: Math.round((nav.transferSize || 0) / 1024),
           };
         })()`,
      );

      await page.send("Emulation.setCPUThrottlingRate", { rate: 1 });
      await page.send("Network.emulateNetworkConditions", {
        offline: false,
        latency: 0,
        downloadThroughput: -1,
        uploadThroughput: -1,
      });

      console.log(
        `      FCP ${perf.fcp}ms · LCP ${perf.lcp}ms · CLS ${perf.cls} · load ${perf.load}ms · HTML ${perf.transferKB}KB`,
      );
      // Отсутствие метрики — это тоже проблема: значит, замер не состоялся
      if (perf.lcp === null) record("error", "lcp-missing", "LCP не измерен — проверка не состоялась");
      else if (perf.lcp > 4000) record("error", "lcp", `LCP ${perf.lcp}ms на Slow 4G — выше 4s`);
      else if (perf.lcp > 2500) record("warning", "lcp", `LCP ${perf.lcp}ms на Slow 4G — выше 2.5s`);

      if (perf.cls === null) record("error", "cls-missing", "CLS не измерен — проверка не состоялась");
      else if (perf.cls > 0.1) record("error", "cls", `CLS ${perf.cls} — выше 0.1`);
      else if (perf.cls > 0.05) record("warning", "cls", `CLS ${perf.cls} — желательно ниже 0.05`);

      if (perf.fcp === null) record("warning", "fcp-missing", "FCP не измерен");
    });
  } finally {
    if (consoleErrors.length) {
      currentGroup = { name: "Ошибки в консоли", findings: [] };
      groups.push(currentGroup);
      for (const error of consoleErrors) record("error", "console", String(error).slice(0, 200));
    }
    await browser.close();
    if (server) server.close();
  }

  /* -------------------------- Итоговый отчёт ----------------------------- */
  const allFindings = groups.flatMap((g) => g.findings.map((f) => ({ group: g.name, ...f })));
  const errors = allFindings.filter((f) => f.severity === "error");
  const warnings = allFindings.filter((f) => f.severity === "warning");

  console.log("\n=== ЗАМЕЧАНИЯ ===");
  if (!allFindings.length) console.log("Замечаний нет.");
  for (const finding of allFindings) {
    console.log(`\n[${finding.severity === "error" ? "ОШИБКА" : "внимание"}] ${finding.group} · ${finding.id}`);
    console.log(`  ${finding.message}`);
    for (const detail of finding.details || []) {
      console.log(`  → ${detail.target || ""} ${detail.summary || detail.snippet || detail || ""}`.trim());
    }
  }

  fs.writeFileSync(
    path.join(REPORTS, "audit.json"),
    JSON.stringify({ base, generatedAt: new Date().toISOString(), groups, errors: errors.length, warnings: warnings.length }, null, 2),
  );

  console.log(
    `\nИТОГ: ошибок ${errors.length}, предупреждений ${warnings.length}. Отчёт: qa-reports/audit.json`,
  );
  console.log(errors.length ? "СТАТУС: НЕ ГОТОВО К ПРОДАКШЕНУ" : "СТАТУС: ГОТОВО К ПРОДАКШЕНУ");
  process.exitCode = errors.length ? 1 : 0;
}

function match(text, re) {
  const m = text.match(re);
  return m ? m[1] : null;
}

async function fetchText(url) {
  const res = await fetch(url);
  return res.text();
}

/** Вырезает блок `export const NAME = [...]` из исходника, чтобы не путать
 *  однотипные поля разных разделов (title есть и у услуг, и у преимуществ). */
function sliceBlock(source, name) {
  const start = source.indexOf(`export const ${name}`);
  if (start === -1) return "";
  const rest = source.slice(start);
  const next = rest.indexOf("\nexport const ", 1);
  return next === -1 ? rest : rest.slice(0, next);
}

async function importContent() {
  const content = fs.readFileSync(path.resolve(__dirname, "..", "lib", "content.ts"), "utf8");
  const servicesBlock = sliceBlock(content, "services");
  const reviewsBlock = sliceBlock(content, "reviews");
  const photosBlock = sliceBlock(content, "photos");

  const services = [...servicesBlock.matchAll(/title: "([^"]+)"/g)].map((m) => ({ title: m[1] }));
  const reviews = [...reviewsBlock.matchAll(/dateISO: "([^"]+)"/g)].map((m) => ({ dateISO: m[1] }));
  const photos = [...photosBlock.matchAll(/src: "(\/images\/opt\/[^"]+)"/g)].map((m) => ({ src: m[1] }));

  if (photos.length === 0) {
    const dir = path.join(ROOT, "images", "opt");
    return { services, reviews, photos: fs.existsSync(dir) ? fs.readdirSync(dir) : [] };
  }
  return { services, reviews, photos };
}

main().catch((error) => {
  console.error("Аудит упал:", error);
  process.exit(2);
});
