// Одноразовая загрузка моноширинного шрифта для мета-подписей.
// Запуск: npm run fonts
import { mkdir, writeFile, rm } from "node:fs/promises";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const API = "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500&display=swap";

const WANTED = ["cyrillic", "latin"];

await mkdir("public/fonts", { recursive: true });

const css = await fetch(API, { headers: { "user-agent": UA } }).then((r) => r.text());

/**
 * В CSS Google комментарий с именем подмножества стоит ПЕРЕД своим @font-face,
 * поэтому пары «комментарий + блок» надо искать вместе: иначе имя подмножества
 * уезжает на следующее правило и файлы называются неверно.
 */
const pairs = [...css.matchAll(/\/\*\s*([a-z-]+)\s*\*\/\s*@font-face\s*\{([^}]*)\}/g)].map(
  (m) => ({ subset: m[1], body: m[2] }),
);

const downloaded = [];

for (const { subset, body } of pairs) {
  if (!WANTED.includes(subset)) continue;
  const url = body.match(/url\((https:\/\/[^)]+\.woff2)\)/)?.[1];
  const range = body.match(/unicode-range:\s*([^;]+);/)?.[1];
  if (!url || !range) continue;

  const file = `public/fonts/jetbrains-mono-${subset}-500.woff2`;
  const buffer = Buffer.from(
    await fetch(url, { headers: { "user-agent": UA } }).then((r) => r.arrayBuffer()),
  );
  await writeFile(file, buffer);
  downloaded.push({ subset, file, kb: Math.round(buffer.length / 1024), range: range.trim() });
}

// Убираем файлы от прежнего запуска с ошибочными именами
for (const stale of ["jetbrains-mono-latin-ext-500.woff2", "jetbrains-mono-cyrillic-ext-500.woff2"]) {
  await rm(`public/fonts/${stale}`, { force: true });
}

console.log(JSON.stringify(downloaded, null, 1));
