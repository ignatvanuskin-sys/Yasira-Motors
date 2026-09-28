// Одноразовая загрузка шрифтов, которые хостятся у нас, а не тянутся с CDN.
// Запуск: npm run fonts
import { mkdir, writeFile, rm } from "node:fs/promises";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/**
 * Берём только нужные подмножества: кириллица и латиница. Интерфейс русский,
 * казахские буквы встречаются лишь в текстах отзывов — они входят в
 * основное кириллическое подмножество.
 */
const FAMILIES = [
  {
    // Мета-подписи, номера секций, теги
    api: "JetBrains+Mono:wght@500",
    slug: "jetbrains-mono",
    weights: ["500"],
    subsets: ["cyrillic", "latin"],
  },
  {
    // Крупные заголовки: узкий индустриальный гротеск.
    // Один вес: для заголовков хватает 600, а вариативный диапазон
    // весил бы вдвое больше без пользы.
    api: "Oswald:wght@600",
    slug: "oswald",
    weights: ["600"],
    subsets: ["cyrillic", "latin"],
  },
];

await mkdir("public/fonts", { recursive: true });

const report = [];

for (const family of FAMILIES) {
  const css = await fetch(`https://fonts.googleapis.com/css2?family=${family.api}&display=swap`, {
    headers: { "user-agent": UA },
  }).then((r) => r.text());

  // Комментарий с именем подмножества стоит ПЕРЕД своим @font-face,
  // поэтому пары «комментарий + блок» надо искать вместе.
  const pairs = [...css.matchAll(/\/\*\s*([a-z-]+)\s*\*\/\s*@font-face\s*\{([^}]*)\}/g)].map((m) => ({
    subset: m[1],
    body: m[2],
  }));

  for (const { subset, body } of pairs) {
    if (!family.subsets.includes(subset)) continue;
    const url = body.match(/url\((https:\/\/[^)]+\.woff2)\)/)?.[1];
    const range = body.match(/unicode-range:\s*([^;]+);/)?.[1];
    const weight = (body.match(/font-weight:\s*([^;]+);/)?.[1] ?? "").trim();
    if (!url || !range) continue;

    const slugWeight = weight.replace(/\s+/g, "-");
    const file = `public/fonts/${family.slug}-${subset}-${slugWeight}.woff2`;
    const buffer = Buffer.from(
      await fetch(url, { headers: { "user-agent": UA } }).then((r) => r.arrayBuffer()),
    );
    await writeFile(file, buffer);
    report.push({
      family: family.slug,
      subset,
      weight,
      kb: Math.round(buffer.length / 1024),
      range: range.trim(),
    });
  }
}

// Убираем файлы от прошлых запусков, которые больше не нужны
for (const stale of [
  "jetbrains-mono-latin-ext-500.woff2",
  "jetbrains-mono-cyrillic-ext-500.woff2",
  "oswald-cyrillic-ext-500-700.woff2",
  "oswald-latin-ext-500-700.woff2",
  "oswald-cyrillic-300-700.woff2",
  "oswald-latin-300-700.woff2",
]) {
  await rm(`public/fonts/${stale}`, { force: true });
}

console.log(JSON.stringify(report, null, 1));
