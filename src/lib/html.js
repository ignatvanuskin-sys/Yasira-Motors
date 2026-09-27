'use strict';

/**
 * Мини-шаблонизатор и экранирование.
 *
 * КЛЮЧЕВОЕ ПРАВИЛО: всё, что приходит от пользователя, обязано проходить
 * через esc() или через tagged-шаблон html`` — он экранирует подстановки
 * сам, но НЕ экранирует разметку, собранную предыдущим вызовом html``.
 *
 * Как это устроено: html`` возвращает не строку, а помеченный безопасный
 * фрагмент (SafeHtml). Поэтому вложенные шаблоны —
 *   html`<ul>${items.map((i) => html`<li>${i}</li>`)}</ul>`
 * — вставляются как разметка, а не как экранированный текст.
 * Если бы html`` возвращал обычную строку, вложенная разметка дважды
 * экранировалась бы и попадала на страницу как видимый код.
 *
 * Конкатенация фрагментов — через concat([...]); join() для этого не годится,
 * потому что приводит фрагменты к строкам и теряет пометку безопасности.
 */

const HTML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '`': '&#96;',
};

/**
 * Экранирование значения для вставки в HTML.
 *
 * Возвращает помеченный фрагмент, а не строку: так esc() можно
 * использовать и внутри plain-шаблонов (сработает toString), и внутри
 * html`` — где renderValue не станет экранировать его повторно.
 * Двойное экранирование — самая частая ошибка в шаблонных движках,
 * поэтому оно исключено на уровне типа, а не соглашения.
 *
 * @param {unknown} value
 * @returns {{__html: string, toString(): string}}
 */
function esc(value) {
  if (value === null || value === undefined) return raw('');
  return raw(String(value).replace(/[&<>"'`]/g, (ch) => HTML_ESCAPES[ch]));
}

/**
 * Помечает строку как безопасный HTML-фрагмент.
 * @param {string} value
 * @returns {{__html: string, toString(): string}}
 */
function raw(value) {
  const safe = String(value);
  return {
    __html: safe,
    toString() {
      return safe;
    },
  };
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isRaw(value) {
  return Boolean(value) && typeof value === 'object' && typeof value.__html === 'string';
}

/**
 * Приводит значение к безопасному фрагменту.
 * @param {unknown} value
 */
function renderValue(value) {
  if (value === null || value === undefined || value === false || value === true) return '';
  if (isRaw(value)) return value.__html;
  if (Array.isArray(value)) return value.map(renderValue).join('');
  if (typeof value === 'object' && typeof value.toHtml === 'function') {
    return renderValue(value.toHtml());
  }
  if (typeof value === 'object') return esc(JSON.stringify(value));
  return esc(value);
}

/**
 * Tagged template: экранирует подстановки, сохраняет вложенную разметку.
 * @param {TemplateStringsArray} strings
 * @param {...unknown} values
 * @returns {{__html: string, toString(): string}}
 */
function html(strings, ...values) {
  let out = strings[0];
  for (let i = 0; i < values.length; i += 1) {
    out += renderValue(values[i]);
    out += strings[i + 1];
  }
  return raw(out);
}

/**
 * Склеивает фрагменты, сохраняя пометку безопасности.
 * @param {unknown[]} parts
 * @returns {{__html: string, toString(): string}}
 */
function concat(parts) {
  return raw(parts.map(renderValue).join(''));
}

/**
 * Собирает атрибуты, пропуская пустые значения.
 * @param {Record<string, unknown>} map
 * @returns {string}
 */
function attrs(map) {
  const parts = [];
  for (const [key, value] of Object.entries(map)) {
    if (value === null || value === undefined || value === false) continue;
    if (value === true) {
      parts.push(esc(key));
      continue;
    }
    parts.push(`${esc(key)}="${esc(value)}"`);
  }
  return parts.length ? ` ${parts.join(' ')}` : '';
}

module.exports = { esc, raw, html, concat, attrs, isRaw, renderValue };
