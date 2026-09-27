'use strict';

/**
 * Простое ограничение частоты запросов — скользящее окно в памяти.
 *
 * Этого достаточно, чтобы отсечь спам формы и брутфорс пароля админки
 * на одном инстансе. При горизонтальном масштабировании лимитер нужно
 * выносить в общее хранилище (README §Масштабирование).
 */

/** @type {Map<string, number[]>} */
const buckets = new Map();

/** Периодическая очистка, чтобы карта не росла бесконечно. */
const CLEANUP_INTERVAL = 10 * 60 * 1000;
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, stamps] of buckets) {
    const alive = stamps.filter((t) => now - t < 60 * 60 * 1000);
    if (alive.length) buckets.set(key, alive);
    else buckets.delete(key);
  }
}, CLEANUP_INTERVAL);
if (typeof cleanupTimer.unref === 'function') cleanupTimer.unref();

/**
 * Проверяет и учитывает попытку.
 * @param {string} key обычно "ip:route"
 * @param {{limit:number, windowMs:number}} options
 * @returns {{allowed:boolean, remaining:number, retryAfterSec:number}}
 */
function hit(key, options) {
  const { limit, windowMs } = options;
  const now = Date.now();
  const stamps = (buckets.get(key) || []).filter((t) => now - t < windowMs);

  if (stamps.length >= limit) {
    const oldest = stamps[0];
    const retryAfterMs = windowMs - (now - oldest);
    buckets.set(key, stamps);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    };
  }

  stamps.push(now);
  buckets.set(key, stamps);
  return { allowed: true, remaining: limit - stamps.length, retryAfterSec: 0 };
}

/** Сбрасывает счётчик (например, после успешного входа в админку). */
function reset(key) {
  buckets.delete(key);
}

/** Текущее состояние без увеличения счётчика. */
function peek(key, options) {
  const now = Date.now();
  const stamps = (buckets.get(key) || []).filter((t) => now - t < options.windowMs);
  return { used: stamps.length, limit: options.limit, remaining: Math.max(0, options.limit - stamps.length) };
}

module.exports = { hit, reset, peek };
