'use strict';

/**
 * Контекст запроса через AsyncLocalStorage.
 *
 * Нужен, чтобы выдавать каждому ответу свой CSP-nonce, не протаскивая
 * его параметром через все шаблоны. Зависимостей нет — только node:async_hooks.
 */

const { AsyncLocalStorage } = require('node:async_hooks');
const crypto = require('node:crypto');

const storage = new AsyncLocalStorage();

/** @template T @param {object} context @param {() => T} fn @returns {T} */
function run(context, fn) {
  return storage.run(context, fn);
}

/** Текущий nonce (или null вне запроса). */
function nonce() {
  const store = storage.getStore();
  return store && store.nonce ? store.nonce : null;
}

/** Генерирует новый nonce для ответа. */
function newNonce() {
  return crypto.randomBytes(16).toString('base64');
}

/** Текущий контекст (для отладки и тестов). */
function current() {
  return storage.getStore() || null;
}

module.exports = { run, nonce, newNonce, current };
