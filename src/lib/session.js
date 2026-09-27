'use strict';

/**
 * Сессии администратора и проверка пароля.
 *
 * Cookie подписывается HMAC-SHA256 секретом SESSION_SECRET, поэтому
 * подделать сессию без секрета нельзя. Пароль сравнивается через
 * timingSafeEqual; поддерживается как простой пароль в переменной
 * окружения, так и scrypt-хеш вида "scrypt$<salt>$<hash>"
 * (получить: npm run hash-password).
 */

const crypto = require('node:crypto');
const config = require('../config');

const COOKIE_NAME = 'ym_admin';

/** @param {string} input */
function base64url(input) {
  return Buffer.from(input).toString('base64url');
}

/** @param {string} input */
function fromBase64url(input) {
  return Buffer.from(input, 'base64url').toString('utf8');
}

/** @param {string} data */
function sign(data) {
  return crypto
    .createHmac('sha256', config.admin.sessionSecret || 'insecure-development-secret')
    .update(data)
    .digest('base64url');
}

/**
 * Создаёт значение cookie для вошедшего администратора.
 * @param {string} subject
 */
function issue(subject = 'admin') {
  const payload = {
    sub: subject,
    iat: Date.now(),
    exp: Date.now() + config.admin.sessionTtlMs,
  };
  const encoded = base64url(JSON.stringify(payload));
  return `${encoded}.${sign(encoded)}`;
}

/**
 * Проверяет cookie.
 * @param {string|undefined} cookieValue
 * @returns {{sub:string, iat:number, exp:number}|null}
 */
function verify(cookieValue) {
  if (!cookieValue || typeof cookieValue !== 'string') return null;
  const [encoded, signature] = cookieValue.split('.');
  if (!encoded || !signature) return null;

  const expected = sign(encoded);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(fromBase64url(encoded));
    if (!payload || typeof payload.exp !== 'number' || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Хеширование пароля для .env. */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

/**
 * Проверка пароля администратора.
 * @param {string} input
 * @returns {boolean}
 */
function verifyPassword(input) {
  const stored = config.admin.password;
  if (!stored) {
    // Пароль не задан: админка закрыта, а не открыта всем.
    console.error(
      '[session] ADMIN_PASSWORD не задан — вход в админку невозможен. Задайте пароль в .env.'
    );
    return false;
  }
  const candidate = String(input || '');

  if (stored.startsWith('scrypt$')) {
    const [, salt, hash] = stored.split('$');
    if (!salt || !hash) return false;
    const derived = crypto.scryptSync(candidate, salt, 64);
    const expected = Buffer.from(hash, 'hex');
    return derived.length === expected.length && crypto.timingSafeEqual(derived, expected);
  }

  const a = Buffer.from(candidate);
  const b = Buffer.from(stored);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/** Парсит cookie из заголовка. */
function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of String(header).split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (key) out[key] = decodeURIComponent(value);
  }
  return out;
}

/** Достаёт сессию администратора из запроса. */
function adminFromRequest(req) {
  const cookies = parseCookies(req.headers.cookie);
  return verify(cookies[COOKIE_NAME]);
}

/** Заголовок установки cookie сессии. */
function sessionCookie(value) {
  const attrs = [
    `${COOKIE_NAME}=${value}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.floor(config.admin.sessionTtlMs / 1000)}`,
  ];
  if (config.nodeEnv === 'production') attrs.push('Secure');
  return attrs.join('; ');
}

/** Заголовок удаления cookie. */
function clearCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

module.exports = {
  COOKIE_NAME,
  issue,
  verify,
  hashPassword,
  verifyPassword,
  parseCookies,
  adminFromRequest,
  sessionCookie,
  clearCookie,
};
