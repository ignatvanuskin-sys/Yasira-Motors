// Пайплайн изображений: обрезка водяного знака + ресайз + WebP.
// Запуск: npm run images
//
// Два исправления против прежней версии.
//
// 1. Источники. Скрипт читал public/images/*.jpg, но оригиналы лежат в
//    assets/photos — в public/images осталась только папка opt с готовыми
//    webp. То есть запустить обработку заново было нечем: скрипт молча
//    возвращал пустой отчёт. Теперь источник — assets/photos.
//
// 2. Водяной знак. Все исходники пришли из карточки 2ГИС и несут в правом
//    нижнем углу чужой логотип. Он занимает примерно 94–99 % высоты,
//    поэтому снизу срезается 8 % — с запасом.
//
// Набор обрабатываемых файлов берётся из lib/content.ts, а не из всего
// каталога: из шестнадцати фотографий на сайте используются десять,
// остальные незачем тащить в сборку.
//
// Карточку для соцсетей этот скрипт не собирает — ею занимается
// scripts/make-og.js. Раньше og.jpg делался здесь оверлеем на SVG, и это
// давало две проблемы: два скрипта писали один файл, а текст рендерился
// системным Arial, потому что растеризатор не знает шрифтов проекта.
import sharp from "sharp";
import { readFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const SRC = "assets/photos";
const OUT = "public/images/opt";
const CONTENT = "lib/content.ts";

const HERO_W = 1800;
const FULL_W = 1400;
const WATERMARK_CROP = 0.08;

/** Имена фотографий, на которые ссылается content.ts. */
async function usedPhotoNames() {
  const text = await readFile(CONTENT, "utf8");
  const names = new Set();
  for (const match of text.matchAll(/\/images\/opt\/([\w-]+)\.webp/g)) names.add(match[1]);
  return [...names].sort();
}

await mkdir(OUT, { recursive: true });

const names = await usedPhotoNames();
if (names.length === 0) {
  console.error(`Не нашёл ни одной ссылки на /images/opt/*.webp в ${CONTENT}`);
  process.exitCode = 1;
}

const report = [];
const sizes = [];

for (const name of names) {
  const src = path.join(SRC, `${name}.jpg`);
  if (!existsSync(src)) {
    console.warn(`нет исходника: ${src}`);
    continue;
  }

  const meta = await sharp(src).metadata();
  // При EXIF-повороте на 90° ширина и высота меняются местами, а extract
  // работает уже по повёрнутому изображению — иначе рамка обрезки уедет.
  const swapped = (meta.orientation ?? 1) >= 5;
  const width0 = swapped ? meta.height : meta.width;
  const height0 = swapped ? meta.width : meta.height;

  const keepH = Math.round(height0 * (1 - WATERMARK_CROP));
  const isHeroish = name === "workshop-lifts" || name === "oil-store";
  const targetW = Math.min(isHeroish ? HERO_W : FULL_W, width0);

  const info = await sharp(src)
    .rotate()
    .extract({ left: 0, top: 0, width: width0, height: keepH })
    .resize({ width: targetW, withoutEnlargement: true })
    .webp({ quality: 80, effort: 5 })
    .toFile(path.join(OUT, `${name}.webp`));

  report.push({
    file: name,
    from: `${width0}x${height0}`,
    cutOff: `${height0 - keepH}px снизу`,
    to: `${info.width}x${info.height}`,
    kb: Math.round(info.size / 1024),
  });
  sizes.push([name, info.width, info.height]);
}

console.log(JSON.stringify(report, null, 1));
console.log("\nразмеры для lib/content.ts:");
for (const [name, w, h] of sizes) console.log(`  ${name}: ${w}x${h}`);
