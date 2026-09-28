"use strict";

/**
 * QA-прогон собранного сайта: локальный статический сервер + headless Chrome.
 *
 *   node scripts/qa.js              — проверки и скриншоты по всем разрешениям
 *   node scripts/qa.js --shots-only — только скриншоты
 *
 * Проверяем то, что реально ломает коммерческий сайт: горизонтальный скролл,
 * обрезанный текст, битые картинки, размеры кнопок, ссылки на звонок и
 * WhatsApp, загрузку карты и ошибки в консоли.
 */

const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const cdp = require("./lib/cdp");

const ROOT = path.resolve(__dirname, "..", "out");
const SHOTS = path.resolve(__dirname, "..", "qa-screenshots");
const SHOTS_ONLY = process.argv.includes("--shots-only");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

function createServer() {
  return http.createServer((req, res) => {
    const url = new URL(req.url, "http://127.0.0.1");
    let filePath = path.join(ROOT, decodeURIComponent(url.pathname));

    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403).end("forbidden");
      return;
    }
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }
    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { "content-type": "text/html; charset=utf-8" });
      res.end("<h1>404</h1>");
      return;
    }

    res.writeHead(200, {
      "content-type": MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      "cache-control": "no-store",
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

const VIEWPORTS = [
  { label: "desktop-1440", width: 1440, height: 900, shots: true },
  { label: "desktop-1280", width: 1280, height: 800, shots: false },
  { label: "desktop-1024", width: 1024, height: 768, shots: true },
  { label: "mobile-390", width: 390, height: 844, shots: true },
  { label: "mobile-375", width: 375, height: 812, shots: true },
  { label: "mobile-360", width: 360, height: 800, shots: false },
];

const SECTIONS = [
  ["#top", "hero"],
  ["#services", "services"],
  ["#why", "why"],
  ["#reviews", "reviews"],
  ["#process", "process"],
  ["#gallery", "gallery"],
  ["#contacts", "contacts"],
  ["#cta", "cta"],
  ["footer", "footer"],
];

/**
 * Прокручивает страницу целиком, чтобы сработали reveal-анимации и lazy-load.
 * Плавный скролл отключаем: иначе снимок делается до окончания анимации.
 */
const SCROLL_PASS = `
  (async () => {
    document.documentElement.style.scrollBehavior = 'auto';
    const step = Math.round(window.innerHeight * 0.7);
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 90));
    }
    window.scrollTo(0, document.documentElement.scrollHeight);
    await new Promise((r) => setTimeout(r, 500));
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 500));
    return true;
  })()
`;

const CHECKS = `
  (() => {
    const issues = [];
    const doc = document.documentElement;
    const vw = window.innerWidth;

    // 1. Горизонтальный скролл
    if (doc.scrollWidth > vw + 1) {
      const offenders = [];
      document.querySelectorAll("body *").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && (r.right > vw + 1 || r.left < -1)) {
          const cs = getComputedStyle(el);
          if (cs.position === "fixed" && cs.visibility === "hidden") return;
          offenders.push({
            tag: el.tagName.toLowerCase(),
            cls: (el.className && String(el.className).slice(0, 90)) || "",
            left: Math.round(r.left),
            right: Math.round(r.right),
          });
        }
      });
      issues.push({
        id: "h-scroll",
        detail: "scrollWidth=" + doc.scrollWidth + " viewport=" + vw,
        offenders: offenders.slice(0, 8),
      });
    }

    // 2. Обрезанный текст: содержимое шире контейнера при скрытом переполнении
    const clipped = [];
    document.querySelectorAll("h1, h2, h3, p, span, dd, dt, a, button, li").forEach((el) => {
      const cs = getComputedStyle(el);
      if (cs.overflowX !== "hidden" && cs.overflow !== "hidden") return;
      if (el.querySelector("img")) return;
      // sr-only (визуально скрытые подписи, скип-ссылка) — не обрезка текста
      if (el.clientWidth <= 8 || el.clientHeight <= 8) return;
      if (el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 2) {
        clipped.push({
          text: (el.textContent || "").trim().slice(0, 40),
          scroll: el.scrollWidth,
          client: el.clientWidth,
        });
      }
    });
    if (clipped.length) {
      issues.push({ id: "clipped-text", detail: JSON.stringify(clipped.slice(0, 6)) });
    }

    // 3. Битые изображения
    const broken = [];
    document.querySelectorAll("img").forEach((img) => {
      if (!img.complete || img.naturalWidth === 0) broken.push(img.getAttribute("src"));
    });
    if (broken.length) issues.push({ id: "broken-images", detail: broken.join(", ") });

    // 4. Изображения без alt
    const noAlt = [...document.querySelectorAll("img")].filter((i) => !i.getAttribute("alt"));
    if (noAlt.length) issues.push({ id: "img-no-alt", detail: "без alt: " + noAlt.length });

    // 5. Габариты кнопок действия (мин. 44px)
    const small = [];
    document.querySelectorAll("a[href^='tel:'], a[href*='wa.me']").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.height > 0 && r.height < 44) {
        small.push({ text: (el.textContent || "").trim().slice(0, 40), h: Math.round(r.height) });
      }
    });
    if (small.length) issues.push({ id: "small-targets", detail: JSON.stringify(small) });

    // 6. Ключевые элементы и структура
    const h1 = document.querySelector("h1");
    const headings = [...document.querySelectorAll("h1,h2,h3")].map((h) => h.tagName);
    const tel = document.querySelector("a[href^='tel:']");
    const wa = document.querySelector("a[href*='wa.me']");
    const map = document.querySelector("iframe[title*='карте']");
    const sectionCount = document.querySelectorAll("section").length;
    const bodyText = document.body.innerText;

    if (!h1 || !/YASIRA/i.test(h1.textContent || "")) {
      issues.push({ id: "h1-invalid", detail: h1 ? h1.textContent.slice(0, 80) : "нет <h1>" });
    }
    if (document.querySelectorAll("h1").length !== 1) {
      issues.push({ id: "h1-count", detail: "h1 на странице: " + document.querySelectorAll("h1").length });
    }
    if (sectionCount < 6) {
      issues.push({ id: "page-not-rendered", detail: "секций на странице: " + sectionCount });
    }
    if (!tel) issues.push({ id: "no-tel-link", detail: "нет ссылки tel:" });
    if (!wa) issues.push({ id: "no-whatsapp-link", detail: "нет ссылки wa.me" });
    if (!bodyText.includes("25-й микрорайон")) {
      issues.push({ id: "address-text", detail: "в тексте страницы нет «25-й микрорайон»" });
    }
    if (!bodyText.includes("4,9")) {
      issues.push({ id: "rating-text", detail: "в тексте страницы нет рейтинга" });
    }

    // 7. Форм записи быть не должно — только звонок и WhatsApp
    const forms = document.querySelectorAll("form, input, textarea, select").length;
    if (forms > 0) issues.push({ id: "no-forms", detail: "найдены формы/поля ввода: " + forms });

    return {
      issues,
      meta: {
        title: document.title,
        h1: h1 ? h1.textContent.replace(/\\s+/g, " ").trim() : null,
        h1count: document.querySelectorAll("h1").length,
        h2count: document.querySelectorAll("h2").length,
        headingsOrder: headings.join(" "),
        tel: tel ? tel.getAttribute("href") : null,
        whatsapp: wa ? wa.getAttribute("href").slice(0, 60) : null,
        mapLoaded: !!map,
        imgCount: document.querySelectorAll("img").length,
        forms: forms,
        sections: [...document.querySelectorAll("section")].map((s) => s.id || "(no id)").join(","),
        pageHeight: doc.scrollHeight,
      },
    };
  })()
`;

/** Ставим наблюдателей до первой отрисовки — иначе LCP/CLS не собрать. */
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

/** Метрики загрузки и переноса данных. */
const PERF_READ = `
  (() => {
    const perf = window.__perf || { lcp: 0, cls: 0 };
    const nav = performance.getEntriesByType('navigation')[0] || {};
    const res = performance.getEntriesByType('resource');
    let transfer = 0;
    for (const r of res) transfer += r.transferSize || 0;
    return {
      lcpMs: Math.round(perf.lcp),
      cls: Math.round(perf.cls * 1000) / 1000,
      domContentLoadedMs: Math.round(nav.domContentLoadedEventEnd || 0),
      loadMs: Math.round(nav.loadEventEnd || 0),
      requests: res.length,
      transferKB: Math.round((transfer + (nav.transferSize || 0)) / 1024),
    };
  })()
`;

const TOUCH_CHECK = `
  (async () => {
    const btn = document.querySelector("header button[aria-controls='mobile-menu']");
    if (!btn) return { error: "нет кнопки меню" };
    btn.click();
    await new Promise((r) => setTimeout(r, 250));

    const nav = document.getElementById("mobile-menu");
    const opened = !!nav && !nav.hasAttribute("hidden");
    const links = nav ? [...nav.querySelectorAll("a")] : [];
    const heights = links.map((a) => Math.round(a.getBoundingClientRect().height));

    const closeBtn = document.querySelector("header button[aria-controls='mobile-menu']");
    if (closeBtn) closeBtn.click();
    await new Promise((r) => setTimeout(r, 200));

    return { opened, count: links.length, heights };
  })()
`;

async function main() {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;
  console.log(`Статический сервер: ${base}`);

  const browser = await cdp.launch({ port: 9333, width: 1440, height: 900 });
  const report = { base, viewports: [], consoleErrors: [] };

  try {
    await browser.page.send("Runtime.enable");
    await browser.page.send("Log.enable");
    await browser.page.send("Page.addScriptToEvaluateOnNewDocument", { source: PERF_HOOK });
    browser.page.on("Runtime.exceptionThrown", (params) => {
      report.consoleErrors.push(
        params.exceptionDetails?.exception?.description || "unknown exception",
      );
    });

    for (const vp of VIEWPORTS) {
      await cdp.setViewport(browser.page, vp.width, vp.height);
      await cdp.navigate(browser.page, `${base}/`);
      await cdp.evaluate(browser.page, SCROLL_PASS);
      await cdp.evaluate(browser.page, `document.fonts.ready.then(() => true)`);

      const entry = { ...vp, issues: [], meta: null };

      if (!SHOTS_ONLY) {
        const result = await cdp.evaluate(browser.page, CHECKS);
        entry.issues = result.issues;
        entry.meta = result.meta;
      }

      if (!SHOTS_ONLY) entry.perf = await cdp.evaluate(browser.page, PERF_READ);

      if (vp.width < 900 && !SHOTS_ONLY) {
        entry.menu = await cdp.evaluate(browser.page, TOUCH_CHECK);
      }

      if (vp.shots) {
        for (const [selector, name] of SECTIONS) {
          const ok = await cdp.evaluate(
            browser.page,
            `(() => {
               const el = document.querySelector(${JSON.stringify(selector)});
               if (!el) return false;
               document.documentElement.style.scrollBehavior = 'auto';
               if (${JSON.stringify(selector)} === "#top") {
                 window.scrollTo({ top: 0, behavior: 'auto' });
               } else if (${JSON.stringify(selector)} === "footer") {
                 window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'auto' });
               } else {
                 window.scrollTo({
                   top: window.scrollY + el.getBoundingClientRect().top - 76,
                   behavior: 'auto',
                 });
               }
               return true;
             })()`,
          );
          if (!ok) {
            entry.issues.push({ id: "missing-section", detail: selector });
            continue;
          }
          await cdp.sleep(320);
          await cdp.screenshot(browser.page, path.join(SHOTS, `${vp.label}-${name}.jpg`), {
            full: false,
            quality: 80,
          });
        }
      }

      report.viewports.push(entry);
      const state = SHOTS_ONLY
        ? "снимки"
        : entry.issues.length
          ? `проблем: ${entry.issues.length}`
          : "OK";
      console.log(`  ${vp.label.padEnd(14)} ${state}`);
    }

    fs.mkdirSync(SHOTS, { recursive: true });
    fs.writeFileSync(path.join(SHOTS, "report.json"), JSON.stringify(report, null, 2));

    console.log("\n=== МЕТА (1440) ===");
    console.log(JSON.stringify(report.viewports[0].meta, null, 2));

    console.log("\n=== ПРОБЛЕМЫ ===");
    let total = 0;
    for (const vp of report.viewports) {
      for (const issue of vp.issues) {
        total += 1;
        console.log(`[${vp.label}] ${issue.id}: ${issue.detail || JSON.stringify(issue)}`);
      }
      if (vp.perf) {
        const p = vp.perf;
        const clsState = p.cls > 0.1 ? " (ВЫШЕ НОРМЫ 0.1)" : "";
        const lcpState = p.lcpMs > 2500 ? " (ВЫШЕ НОРМЫ 2.5s)" : "";
        console.log(
          `[${vp.label}] LCP ${p.lcpMs}ms${lcpState}, CLS ${p.cls}${clsState}, ` +
            `DOMContentLoaded ${p.domContentLoadedMs}ms, load ${p.loadMs}ms, ` +
            `запросов ${p.requests}, передано ${p.transferKB}KB`,
        );
      }
      if (vp.menu && vp.menu.heights) {
        const small = vp.menu.heights.filter((h) => h < 44);
        console.log(
          `[${vp.label}] мобильное меню: ссылок ${vp.menu.count}, открылось: ${vp.menu.opened}, меньше 44px: ${small.length}`,
        );
      }
    }
    if (report.consoleErrors.length) {
      total += report.consoleErrors.length;
      console.log("Ошибки в консоли:", JSON.stringify(report.consoleErrors, null, 2));
    }
    console.log(total ? `\nВсего замечаний: ${total}` : "\nЗамечаний нет.");
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error("QA упал:", err);
  process.exit(1);
});
