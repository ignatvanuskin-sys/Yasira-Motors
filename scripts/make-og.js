"use strict";

/**
 * Сборка карточки для соцсетей: public/og.jpg, 1200×630.
 *
 * Запуск: npm run og
 *
 * Почему через headless Chrome, а не через sharp с SVG. В шаблоне три шрифта
 * проекта — Oswald, Manrope и JetBrains Mono, все с кириллицей. Растеризатор
 * SVG их не знает: он берёт только системные шрифты, и вместо фирменного
 * начертания получился бы подменённый. Браузер же подключает те же самые
 * .woff2, что и сайт, поэтому карточка выглядит ровно как страница.
 *
 * Раньше эта картинка лежала в репозитории без генератора — пересобрать её
 * было нечем. Теперь она воспроизводима: правится шаблон, запускается команда.
 *
 * Сервер поднимается на корне репозитория, а не на out/: шаблону нужны
 * и шрифты, и фотография из public/, и он сам лежит в scripts/.
 */

const fs = require("node:fs");
const path = require("node:path");

const cdp = require("./lib/cdp.js");
const { createStaticServer, listen } = require("./lib/static-server.js");

const ROOT = path.join(__dirname, "..");
const TEMPLATE = "/scripts/og-template.html";
const OUTPUT = path.join(ROOT, "public", "og.jpg");
const WIDTH = 1200;
const HEIGHT = 630;

(async () => {
  const server = createStaticServer(ROOT);
  await listen(server, 0);
  const origin = `http://127.0.0.1:${server.address().port}`;

  const { page, close } = await cdp.launch({ port: 9334 });
  try {
    await cdp.setViewport(page, WIDTH, HEIGHT);
    await cdp.navigate(page, origin + TEMPLATE);

    // Ждём не таймер, а готовность ресурсов: без этого в кадр попадёт
    // системный шрифт вместо фирменного.
    const ready = await cdp.evaluate(
      page,
      `(async () => {
         await document.fonts.ready;
         const shots = [...document.images];
         await Promise.all(
           shots.map((img) => (img.complete ? Promise.resolve() : img.decode().catch(() => {}))),
         );
         const fonts = [...document.fonts].map((f) => f.family + " " + f.weight + " " + f.status);
         return {
           fonts,
           images: shots.map((img) => img.naturalWidth + "×" + img.naturalHeight),
         };
       })()`,
    );

    console.log("шрифты:", (ready && ready.fonts ? ready.fonts : []).join(" · ") || "—");
    console.log("изображения:", (ready && ready.images ? ready.images : []).join(", ") || "—");

    await cdp.sleep(300);
    await cdp.screenshot(page, OUTPUT, { full: false, quality: 90 });
  } finally {
    await close();
    server.close();
  }

  const { default: sharp } = await import("sharp").catch(() => ({ default: null }));
  const size = fs.statSync(OUTPUT).size;
  let dims = "—";
  if (sharp) {
    const meta = await sharp(OUTPUT).metadata();
    dims = `${meta.width}×${meta.height}`;
  }
  console.log(`готово: public/og.jpg · ${(size / 1024).toFixed(1)} КБ · ${dims}`);
  if (dims !== `${WIDTH}×${HEIGHT}` && dims !== "—") {
    console.error(`Размер не совпал: ожидали ${WIDTH}×${HEIGHT}`);
    process.exitCode = 1;
  }
})();
