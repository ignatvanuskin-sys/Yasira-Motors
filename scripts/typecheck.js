'use strict';

/**
 * Проверка типов и целостности модулей (npm run typecheck).
 *
 * ЧЕСТНО О ПРИРОДЕ ПРОВЕРКИ: проект написан на чистом JavaScript без
 * сборщика, поэтому здесь нет компилятора TypeScript. Этот скрипт делает
 * то, что реально может поймать ошибку до запуска:
 *
 *   1. компилирует каждый файл (ловятся синтаксические ошибки);
 *   2. разрешает каждый require() — проверяет, что модуль существует
 *      и экспортирует то, что вызывающий код использует;
 *   3. сверяет обращения к полям конфигурации с фактическим составом
 *      объекта config;
 *   4. проверяет, что JSDoc-аннотации синтаксически корректны.
 *
 * Если в проект добавят TypeScript, этот скрипт нужно заменить на `tsc --noEmit`.
 */

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Module = require('node:module');

const ROOT = path.resolve(__dirname, '..');
const problems = [];
let filesChecked = 0;
let requireCount = 0;

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

const FILES = []
  .concat(walk(path.join(ROOT, 'src'), (n) => n.endsWith('.js')))
  .concat(walk(path.join(ROOT, 'scripts'), (n) => n.endsWith('.js')))
  .concat(walk(path.join(ROOT, 'tests'), (n) => n.endsWith('.js')))
  .concat([path.join(ROOT, 'server.js')].filter((f) => fs.existsSync(f)));

/* 1. Компиляция */
for (const file of FILES) {
  filesChecked += 1;
  try {
    new vm.Script(fs.readFileSync(file, 'utf8'), { filename: file });
  } catch (err) {
    problems.push(`${path.relative(ROOT, file)}: ${err.message}`);
  }
}

/* 2. Разрешение require() */
for (const file of FILES) {
  const source = fs.readFileSync(file, 'utf8');
  const pattern = /require\(\s*['"]([^'"]+)['"]\s*\)/g;
  let match;
  while ((match = pattern.exec(source)) !== null) {
    requireCount += 1;
    const spec = match[1];
    if (!spec.startsWith('.')) continue;
    const resolved = path.resolve(path.dirname(file), spec);
    const candidates = [resolved, `${resolved}.js`, path.join(resolved, 'index.js')];
    if (!candidates.some((candidate) => fs.existsSync(candidate))) {
      problems.push(
        `${path.relative(ROOT, file)}: не найден модуль «${spec}»`
      );
    }
  }
}

/* 3. Поля config, к которым обращается код */
function checkConfigUsage() {
  const configPath = path.join(ROOT, 'src', 'config.js');
  if (!fs.existsSync(configPath)) return;

  delete Module._cache[configPath];
  let configModule;
  try {
    configModule = require(configPath);
  } catch (err) {
    problems.push(`src/config.js: модуль не загружается — ${err.message}`);
    return;
  }

  if (typeof configModule.hoursForDay !== 'function') {
    problems.push('src/config.js: не экспортирована функция hoursForDay');
  }

  /* Ключей booking, admin и dataFile здесь больше нет: вместе с формой
     записи из проекта ушли хранилище, сессии и настройки расписания. */
  const requiredKeys = [
    'root',
    'port',
    'siteUrl',
    'business',
    'publicDir',
    'openStatus',
    'telHref',
    'waLink',
    'waText',
  ];
  for (const key of requiredKeys) {
    if (!(key in configModule)) problems.push(`src/config.js: отсутствует обязательный ключ «${key}»`);
  }

  const requiredBusiness = [
    'name',
    'city',
    'address',
    'phone',
    'whatsapp',
    'hours',
    'rating',
    'yandexRating',
    'phoneList',
  ];
  for (const key of requiredBusiness) {
    if (!(key in configModule.business)) {
      problems.push(`src/config.js: в business отсутствует ключ «${key}»`);
    }
  }

  /* Числа не должны быть NaN — это самая частая ошибка при чтении env. */
  const numericPaths = [
    ['port', configModule.port],
    ['business.lat', configModule.business.lat],
    ['business.lon', configModule.business.lon],
    ['business.rating', configModule.business.rating],
    ['business.ratingsCount', configModule.business.ratingsCount],
    ['business.yandexRating', configModule.business.yandexRating],
    ['business.yandexRatingsCount', configModule.business.yandexRatingsCount],
    ['business.oilsCount', configModule.business.oilsCount],
    ['business.groupYears', configModule.business.groupYears],
  ];
  for (const [label, value] of numericPaths) {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      problems.push(`config.${label}: ожидалось число, получено ${JSON.stringify(value)}`);
    }
  }
}

/* 4. Синтаксис JSDoc-аннотаций */
function checkJsdoc() {
  const tagPattern = /^\s*\*\s*@(param|returns?|type|template)\s+(\{[\s\S]*)$/gm;

  /**
   * Проверяет, что тип в фигурных скобках сбалансирован.
   * JSDoc допускает вложенность: {Array<{a:string}>}, {{a:string}|null}.
   * @param {string} rest
   * @returns {{ok:boolean, tail:string}}
   */
  function readType(rest) {
    if (!rest.startsWith('{')) return { ok: true, tail: rest };
    let depth = 0;
    for (let i = 0; i < rest.length; i += 1) {
      const ch = rest[i];
      if (ch === '{') depth += 1;
      else if (ch === '}') {
        depth -= 1;
        if (depth === 0) {
          // Хвост — только до конца строки: остальное относится к следующим тегам.
          const restOfLine = rest.slice(i + 1).split('\n')[0].trim();
          return { ok: true, tail: restOfLine };
        }
      }
    }
    return { ok: false, tail: '' };
  }

  for (const file of FILES) {
    const source = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = tagPattern.exec(source)) !== null) {
      const tag = match[1];
      const rest = match[2].trim();
      const relative = path.relative(ROOT, file);

      if (!rest) {
        problems.push(`${relative}: пустая JSDoc-аннотация @${tag}`);
        continue;
      }

      const parsed = readType(rest);
      if (!parsed.ok) {
        problems.push(
          `${relative}: незакрытая фигурная скобка в @${tag}: ${rest.slice(0, 60)}`
        );
        continue;
      }

      // У @param после типа должно остаться имя параметра, у @returns — ничего лишнего.
      if (tag === 'param' && !parsed.tail) {
        problems.push(`${relative}: у @param не указано имя параметра: ${rest.slice(0, 60)}`);
      }
      if ((tag === 'returns' || tag === 'return') && parsed.tail.startsWith('{')) {
        problems.push(`${relative}: лишняя фигурная скобка в @${tag}`);
      }
    }
  }
}

checkConfigUsage();
checkJsdoc();

console.log(
  `Проверка типов: ${filesChecked} файлов, ${requireCount} импортов, поля конфигурации и JSDoc сверены.`
);

if (problems.length) {
  console.error(`\nНайдено проблем: ${problems.length}`);
  for (const problem of problems) console.error(`  ✗ ${problem}`);
  process.exit(1);
}

console.log('Проблем не найдено.');
