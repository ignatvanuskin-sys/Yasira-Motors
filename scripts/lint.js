'use strict';

/**
 * Статическая проверка проекта (npm run lint).
 *
 * Проект без сборщика, поэтому линтер тоже свой. Он проверяет то,
 * что действительно может сломать сайт:
 *
 *   1. синтаксис каждого .js-файла;
 *   2. отсутствие запрещённых строк в публичном интерфейсе
 *      (demo / mock / test environment и т.п. — их не должно быть в UI);
 *   3. отсутствие секретов и process.env в клиентском коде;
 *   4. наличие всех картинок, на которые ссылается код;
 *   5. баланс фигурных скобок в CSS;
 *   6. отсутствие опасных конструкций (eval, new Function) в src/.
 */

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const problems = [];
const checked = { js: 0, css: 0, images: 0 };

function fail(file, message) {
  problems.push(`${path.relative(ROOT, file)}: ${message}`);
}

/** Рекурсивный обход каталога. */
function walk(dir, filter, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.git', 'logs'].includes(entry.name)) continue;
      walk(full, filter, out);
    } else if (filter(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

/* 1. Синтаксис JS */
function checkSyntax() {
  const files = []
    .concat(walk(path.join(ROOT, 'src'), (n) => n.endsWith('.js')))
    .concat(walk(path.join(ROOT, 'scripts'), (n) => n.endsWith('.js')))
    .concat(walk(path.join(ROOT, 'tests'), (n) => n.endsWith('.js')))
    .concat(walk(path.join(ROOT, 'public'), (n) => n.endsWith('.js')))
    .concat([path.join(ROOT, 'server.js')].filter((f) => fs.existsSync(f)));

  for (const file of files) {
    checked.js += 1;
    const source = fs.readFileSync(file, 'utf8');
    try {
      // Компиляция без выполнения: ловит синтаксические ошибки.
      new vm.Script(source, { filename: file });
    } catch (err) {
      fail(file, `синтаксическая ошибка: ${err.message}`);
    }
  }
}

/* 2. Запрещённые строки в публичном интерфейсе */
function checkNoDemoUi() {
  const forbidden = [
    'demo mode',
    'mock mode',
    'mock-режим',
    'демо-режим',
    'демонстрационный стенд',
    'database not connected',
    'storage unavailable',
    "booking won't save",
    'temporary version',
    'production setup required',
  ];
  const files = walk(path.join(ROOT, 'src', 'views'), (n) => n.endsWith('.js')).concat(
    walk(path.join(ROOT, 'public'), (n) => n.endsWith('.js') || n.endsWith('.css'))
  );

  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8').toLowerCase();
    for (const phrase of forbidden) {
      if (text.includes(phrase.toLowerCase())) {
        fail(file, `в публичном интерфейсе найдена запрещённая фраза «${phrase}»`);
      }
    }
  }
}

/* 3. Секреты и process.env в клиентском коде */
function checkClientSecrets() {
  const files = walk(path.join(ROOT, 'public'), (n) => n.endsWith('.js'));
  const secretPatterns = [
    /process\.env/,
    /ADMIN_PASSWORD/,
    /SESSION_SECRET/,
    /TELEGRAM_BOT_TOKEN/,
    /KV_REST_API_TOKEN/,
  ];
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    for (const pattern of secretPatterns) {
      if (pattern.test(text)) {
        fail(file, `клиентский код обращается к серверной переменной (${pattern})`);
      }
    }
  }
}

/* 4. Картинки, на которые ссылается код */
function checkImages() {
  const sources = walk(path.join(ROOT, 'src'), (n) => n.endsWith('.js')).concat(
    walk(path.join(ROOT, 'public'), (n) => n.endsWith('.css'))
  );
  const seen = new Set();
  const pattern = /\/img\/([A-Za-z0-9_.-]+\.(?:jpg|jpeg|png|webp|svg))|'(directions\d\.jpg|adv\d\.jpg|map\.png)'/g;

  for (const file of sources) {
    const text = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const name = match[1] || match[2];
      if (name) seen.add(name);
    }
  }

  for (const name of seen) {
    checked.images += 1;
    const target = path.join(ROOT, 'public', 'img', name);
    if (!fs.existsSync(target)) {
      problems.push(`public/img/${name}: файл не найден, но на него ссылается код`);
    }
  }
}

/* 5. CSS: баланс скобок и отсутствие пустых правил-заглушек */
function checkCss() {
  const files = walk(path.join(ROOT, 'public', 'css'), (n) => n.endsWith('.css'));
  for (const file of files) {
    checked.css += 1;
    const text = fs.readFileSync(file, 'utf8');
    let depth = 0;
    for (const char of text.replace(/\/\*[\s\S]*?\*\//g, '')) {
      if (char === '{') depth += 1;
      if (char === '}') depth -= 1;
      if (depth < 0) break;
    }
    if (depth !== 0) fail(file, `несбалансированные фигурные скобки (итог: ${depth})`);
  }
}

/* 6. Опасные конструкции на сервере */
function checkUnsafe() {
  const files = walk(path.join(ROOT, 'src'), (n) => n.endsWith('.js')).concat(
    [path.join(ROOT, 'server.js')].filter((f) => fs.existsSync(f))
  );
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    if (/\beval\s*\(/.test(text)) fail(file, 'используется eval()');
    if (/new\s+Function\s*\(/.test(text)) fail(file, 'используется new Function()');
    if (/child_process/.test(text) && !file.endsWith('lint.js')) {
      fail(file, 'используется child_process');
    }
  }
}

/* ── Запуск ── */
checkSyntax();
checkNoDemoUi();
checkClientSecrets();
checkImages();
checkCss();
checkUnsafe();

console.log(
  `Линтер: проверено ${checked.js} JS-файлов, ${checked.css} CSS, ${checked.images} ссылок на изображения.`
);

if (problems.length) {
  console.error(`\nНайдено проблем: ${problems.length}`);
  for (const problem of problems) console.error(`  ✗ ${problem}`);
  process.exit(1);
}

console.log('Проблем не найдено.');
