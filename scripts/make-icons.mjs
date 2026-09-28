// Одноразовая генерация иконок из фирменного знака.
// Запуск: npm run icons
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

/** Знак YASIRA MOTORS: красный квадрат + три белых луча. */
const mark = (size, radius) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="${size}" height="${size}">
  <rect width="48" height="48" rx="${radius}" fill="#e01f26"/>
  <g fill="#ffffff" stroke="#101013" stroke-width="1.1">
    <rect x="20.7" y="24.6" width="6.6" height="16.8" rx="3.3"/>
    <rect x="20.7" y="24.6" width="6.6" height="16.8" rx="3.3" transform="rotate(120 24 24)"/>
    <rect x="20.7" y="24.6" width="6.6" height="16.8" rx="3.3" transform="rotate(240 24 24)"/>
  </g>
</svg>`;

await mkdir("app", { recursive: true });
await mkdir("public", { recursive: true });

// iOS сам скругляет иконки, поэтому у apple-touch-icon углы прямые.
await sharp(Buffer.from(mark(180, 0))).png().toFile("app/apple-icon.png");

// Иконки для webmanifest.
await sharp(Buffer.from(mark(192, 36))).png().toFile("public/icon-192.png");
await sharp(Buffer.from(mark(512, 96))).png().toFile("public/icon-512.png");

console.log("Готово: app/apple-icon.png, public/icon-192.png, public/icon-512.png");
