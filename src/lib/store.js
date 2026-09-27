'use strict';

/**
 * Хранилище данных.
 *
 * Реализация — JSON-файл с атомарной записью и блокировкой, чтобы
 * исключить двойную запись на один слот. Этого достаточно для одного
 * процесса Node (один инстанс сайта).
 *
 * ВАЖНО про надёжность: файл — это НЕ распределённая база. Если сайт
 * когда-нибудь запустят в нескольких инстансах или на платформе с
 * read-only/ephemeral файловой системой, хранилище нужно заменить
 * (README §Хранилище). Весь доступ к данным идёт через этот модуль,
 * поэтому замена затрагивает один файл.
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const config = require('../config');

const EMPTY_DB = () => ({
  meta: {
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  customers: [],
  vehicles: [],
  bookings: [],
  /* Управление рабочим расписанием: закрытые дни, изменённые часы, ёмкость. */
  scheduleOverrides: [],
  /* Отдельные слоты, снятые с продажи (например, перерыв или подъёмник занят). */
  blockedSlots: [],
  /* Управление каталогом услуг из админки (переопределения поверх кода). */
  serviceOverrides: [],
  /* Настройки, которые владелец может менять без правки кода. */
  settings: {},
  counters: { booking: 0 },
});

let db = null;
let writeQueue = Promise.resolve();

/* ────────────────────────────── низкий уровень ───────────────────────────── */

function ensureDir(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
}

function readDb() {
  const file = config.dataFile;
  if (!fs.existsSync(file)) return EMPTY_DB();
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    const base = EMPTY_DB();
    return {
      ...base,
      ...parsed,
      meta: { ...base.meta, ...(parsed.meta || {}) },
      counters: { ...base.counters, ...(parsed.counters || {}) },
    };
  } catch (err) {
    // Повреждённый файл нельзя молча потерять: сохраняем копию и стартуем с чистого.
    const backup = `${file}.corrupt-${Date.now()}`;
    try {
      fs.copyFileSync(file, backup);
    } catch {
      /* копия не критична */
    }
    console.error(
      `[store] Файл данных повреждён, создана резервная копия: ${backup}. Ошибка: ${err.message}`
    );
    return EMPTY_DB();
  }
}

function persist() {
  const file = config.dataFile;
  ensureDir(file);
  db.meta.updatedAt = new Date().toISOString();
  const payload = JSON.stringify(db, null, 2);
  // Атомарная запись: сначала во временный файл, потом переименование.
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, payload, 'utf8');
  fs.renameSync(tmp, file);
}

/**
 * Загружает базу в память (вызывается лениво).
 * @returns {ReturnType<typeof EMPTY_DB>}
 */
function load() {
  if (!db) db = readDb();
  return db;
}

/**
 * Выполняет функцию, удерживая эксклюзивную блокировку на файл.
 * Блокировка межпроцессная (lockfile) — на случай нескольких воркеров.
 * @template T
 * @param {() => T} fn
 * @returns {Promise<T>}
 */
function withLock(fn) {
  const run = async () => {
    const lockPath = `${config.dataFile}.lock`;
    ensureDir(config.dataFile);
    const deadline = Date.now() + 5000;
    let handle = null;
    while (handle === null) {
      try {
        handle = fs.openSync(lockPath, 'wx');
      } catch (err) {
        if (err.code !== 'EEXIST') throw err;
        if (Date.now() > deadline) {
          // Считаем блокировку протухшей и продолжаем: недоступность записи
          // хуже, чем редкая конкуренция, а атомарный rename защищает файл.
          try {
            fs.unlinkSync(lockPath);
          } catch {
            /* уже удалён */
          }
        }
        await new Promise((r) => setTimeout(r, 25));
      }
    }
    try {
      load();
      const result = fn();
      persist();
      return result;
    } finally {
      try {
        fs.closeSync(handle);
      } catch {
        /* уже закрыт */
      }
      try {
        fs.unlinkSync(lockPath);
      } catch {
        /* уже удалён */
      }
    }
  };

  // Плюс внутрипроцессная очередь: не конкурируем сами с собой.
  const chained = writeQueue.then(run, run);
  writeQueue = chained.catch(() => {});
  return chained;
}

/** Чтение без блокировки (только для чтения страниц). */
function read() {
  return load();
}

/* ─────────────────────────────── идентификаторы ──────────────────────────── */

/** @returns {string} */
function id() {
  return crypto.randomUUID();
}

/**
 * Короткий код записи, который удобно продиктовать по телефону.
 * @param {number} n
 * @returns {string}
 */
function bookingCode(n) {
  return `YM-${String(n).padStart(5, '0')}`;
}

/* ────────────────────────────────── сброс ────────────────────────────────── */

function reset() {
  db = EMPTY_DB();
  persist();
}

module.exports = {
  load,
  read,
  withLock,
  persist,
  reset,
  id,
  bookingCode,
  EMPTY_DB,
};
