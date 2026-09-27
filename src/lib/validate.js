'use strict';

/**
 * Серверная валидация и нормализация пользовательского ввода.
 *
 * Правило проекта: клиентская валидация нужна только для удобства,
 * вся настоящая проверка живёт здесь. Любое поле, попадающее в базу,
 * проходит через эти функции.
 */

/** Убирает управляющие символы и обрезает длину. */
function clean(value, maxLength = 200) {
  return String(value === null || value === undefined ? '' : value)
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

/**
 * Приводит телефон к виду +7XXXXXXXXXX или возвращает null.
 * Принимает 11 цифр с 7/8 в начале либо 10 цифр без кода страны.
 * @param {string} input
 * @returns {string|null}
 */
function normalizePhone(input) {
  const digits = String(input || '').replace(/\D/g, '');
  if (digits.length === 11 && (digits[0] === '7' || digits[0] === '8')) {
    return `+7${digits.slice(1)}`;
  }
  if (digits.length === 10) return `+7${digits}`;
  return null;
}

/**
 * Форматирует номер для показа: +7 777 088 44 36
 * @param {string} normalized
 */
function formatPhone(normalized) {
  const digits = String(normalized || '').replace(/\D/g, '');
  if (digits.length !== 11) return normalized || '';
  return `+${digits[0]} ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(
    7,
    9
  )} ${digits.slice(9, 11)}`;
}

/** Имя: буквы (рус/каз/лат), дефис, апостроф, пробел. 2–60 символов. */
const NAME_RE = /^[A-Za-zÀ-ÿА-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі\s'’-]{2,60}$/;

/** @param {string} value */
function validateName(value) {
  const name = clean(value, 60);
  if (name.length < 2) return { ok: false, error: 'Укажите имя — как к вам обращаться.' };
  if (!NAME_RE.test(name)) {
    return { ok: false, error: 'Имя может содержать только буквы, пробел и дефис.' };
  }
  return { ok: true, value: name };
}

/** Свободный текст (комментарий). */
function validateNotes(value) {
  return { ok: true, value: clean(value, 600) };
}

/** Марка / модель — свободный, но ограниченный текст. */
function validateShortText(value, field, max = 40) {
  const text = clean(value, max);
  if (text && !/^[A-Za-z0-9А-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі\s'’./-]+$/.test(text)) {
    return { ok: false, error: `${field}: допустимы буквы, цифры, пробел, дефис и точка.` };
  }
  return { ok: true, value: text };
}

/**
 * Год выпуска: 1950 … текущий+1.
 * @param {string|number} value
 */
function validateYear(value) {
  const raw = clean(value, 4);
  if (!raw) return { ok: true, value: '' };
  if (!/^\d{4}$/.test(raw)) return { ok: false, error: 'Год указывается четырьмя цифрами.' };
  const year = parseInt(raw, 10);
  const max = new Date().getFullYear() + 1;
  if (year < 1950 || year > max) {
    return { ok: false, error: `Год должен быть в диапазоне 1950–${max}.` };
  }
  return { ok: true, value: String(year) };
}

/** Госномер — необязательное поле, свободный формат. */
function validatePlate(value) {
  const plate = clean(value, 16).toUpperCase();
  if (!plate) return { ok: true, value: '' };
  if (!/^[A-Z0-9А-ЯЁӘҒҚҢӨҰҮҺІ -]+$/.test(plate)) {
    return { ok: false, error: 'Госномер содержит недопустимые символы.' };
  }
  return { ok: true, value: plate };
}

/**
 * Валидация всей заявки на запись.
 * @param {Record<string, unknown>} body
 * @returns {{ok:true, value:object} | {ok:false, errors:Record<string,string>}}
 */
function validateBookingPayload(body) {
  const errors = {};
  const src = body && typeof body === 'object' ? body : {};

  const serviceSlug = clean(src.serviceSlug, 80);
  if (!serviceSlug) errors.serviceSlug = 'Выберите услугу.';

  const date = clean(src.date, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) errors.date = 'Выберите дату.';

  const time = clean(src.time, 5);
  // Одной маски «ЧЧ:ММ» мало: 25:00 и 12:99 формально ей соответствуют.
  if (!/^\d{2}:\d{2}$/.test(time)) {
    errors.time = 'Выберите время.';
  } else {
    const [hours, minutes] = time.split(':').map((n) => parseInt(n, 10));
    if (hours > 23 || minutes > 59) errors.time = 'Выберите время из предложенных.';
  }

  const name = validateName(src.name);
  if (!name.ok) errors.name = name.error;

  const phoneNormalized = normalizePhone(src.phone);
  if (!phoneNormalized) {
    errors.phone = 'Укажите телефон в формате +7 XXX XXX XX XX.';
  }

  const brand = validateShortText(src.brand, 'Марка', 40);
  if (!brand.ok) errors.brand = brand.error;

  const model = validateShortText(src.model, 'Модель', 40);
  if (!model.ok) errors.model = model.error;

  const year = validateYear(src.year);
  if (!year.ok) errors.year = year.error;

  const plate = validatePlate(src.plate);
  if (!plate.ok) errors.plate = plate.error;

  const notes = validateNotes(src.notes);
  const requestId = clean(src.requestId, 64);

  if (Object.keys(errors).length) return { ok: false, errors };

  return {
    ok: true,
    value: {
      serviceSlug,
      date,
      time,
      name: name.value,
      phone: phoneNormalized,
      brand: brand.value,
      model: model.value,
      year: year.value,
      plate: plate.value,
      notes: notes.value,
      requestId: requestId || null,
    },
  };
}

module.exports = {
  clean,
  normalizePhone,
  formatPhone,
  validateName,
  validateYear,
  validatePlate,
  validateBookingPayload,
};
