'use strict';

/**
 * Логика онлайн-записи.
 *
 * Часовой пояс: сервис работает в Актау (UTC+5, без перехода на летнее
 * время). Все слоты считаются в локальном времени сервера. При
 * развёртывании на хостинге в другом поясе ОБЯЗАТЕЛЬНО выставить
 * TZ=Asia/Aqtau (или Asia/Yekaterinburg — тот же сдвиг UTC+5),
 * иначе клиент увидит слоты в чужом времени.
 */

const config = require('../config');
const store = require('./store');
const { normalizePhone, formatPhone } = require('./validate');
const { getService } = require('../content/services');

/** Статусы записи. */
const STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
};

const ACTIVE_STATUSES = [STATUS.PENDING, STATUS.CONFIRMED, STATUS.COMPLETED];

const STATUS_LABELS = {
  PENDING: 'Ожидает подтверждения',
  CONFIRMED: 'Подтверждена',
  CANCELLED: 'Отменена',
  COMPLETED: 'Выполнена',
};

/** Человеко-понятная ошибка записи. */
class BookingError extends Error {
  /**
   * @param {string} code
   * @param {string} message текст для пользователя
   * @param {number} [httpStatus]
   */
  constructor(code, message, httpStatus = 400) {
    super(message);
    this.name = 'BookingError';
    this.code = code;
    this.httpStatus = httpStatus;
    this.userMessage = message;
  }
}

/* ───────────────────────────── работа с датами ───────────────────────────── */

/** @param {Date} date @returns {string} 'YYYY-MM-DD' в локальном времени */
function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** @param {string} key @returns {Date} локальная полночь */
function parseDateKey(key) {
  const [y, m, d] = String(key).split('-').map((n) => parseInt(n, 10));
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
}

/** @param {string} key */
function isValidDateKey(key) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(key))) return false;
  const parsed = parseDateKey(key);
  return toDateKey(parsed) === key;
}

/** День недели по ISO: 1 = Пн … 7 = Вс. */
function isoDayOf(dateKey) {
  const day = parseDateKey(dateKey).getDay();
  return day === 0 ? 7 : day;
}

/** @param {Date} date @param {number} days */
function addDays(date, days) {
  const copy = new Date(date.getTime());
  copy.setDate(copy.getDate() + days);
  return copy;
}

/** @param {string} time 'HH:MM' @returns {number} минуты от полуночи */
function timeToMinutes(time) {
  const [h, m] = String(time).split(':').map((n) => parseInt(n, 10));
  return h * 60 + m;
}

/** @param {number} minutes @returns {string} 'HH:MM' */
function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

const WEEKDAY_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const WEEKDAY_FULL = [
  'понедельник',
  'вторник',
  'среда',
  'четверг',
  'пятница',
  'суббота',
  'воскресенье',
];
const MONTH_GENITIVE = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
];

/**
 * «28 сентября» — для сводки записи и уведомлений.
 * @param {string} dateKey
 */
function humanDate(dateKey) {
  const date = parseDateKey(dateKey);
  return `${date.getDate()} ${MONTH_GENITIVE[date.getMonth()]}`;
}

/** «воскресенье, 28 сентября 2026» */
function fullDate(dateKey) {
  const date = parseDateKey(dateKey);
  return `${WEEKDAY_FULL[isoDayOf(dateKey) - 1]}, ${date.getDate()} ${
    MONTH_GENITIVE[date.getMonth()]
  } ${date.getFullYear()}`;
}

/** «28.09.2026» — для уведомлений администратору. */
function numericDate(dateKey) {
  const [y, m, d] = dateKey.split('-');
  return `${d}.${m}.${y}`;
}

/* ─────────────────────────── рабочий график дня ─────────────────────────── */

/**
 * График на дату с учётом переопределений из админки.
 * @param {string} dateKey
 * @returns {{closed:boolean, open:string|null, close:string|null, capacity:number, note:string|null}}
 */
function daySchedule(dateKey) {
  const db = store.read();
  const overrides = db.scheduleOverrides.filter((o) => o.date === dateKey);
  const closed = overrides.find((o) => o.closed === true);
  const modified = overrides.find((o) => o.open && o.close);
  const capacityOverride = overrides.find((o) => Number.isFinite(o.capacity));

  if (closed) {
    return {
      closed: true,
      open: null,
      close: null,
      capacity: 0,
      note: closed.note || 'Сервис не работает в этот день',
    };
  }

  const base = modified
    ? { open: modified.open, close: modified.close }
    : config.hoursForDay(isoDayOf(dateKey));

  if (!base) {
    return {
      closed: true,
      open: null,
      close: null,
      capacity: 0,
      note: 'Выходной день',
    };
  }

  return {
    closed: false,
    open: base.open,
    close: base.close,
    capacity: capacityOverride
      ? Math.max(1, Number(capacityOverride.capacity))
      : config.booking.capacity,
    note: null,
  };
}

/** Список слотов дня (без учёта занятости). */
function slotTimes(dateKey) {
  const schedule = daySchedule(dateKey);
  if (schedule.closed) return [];
  const step = Math.max(15, config.booking.slotMinutes);
  const start = timeToMinutes(schedule.open);
  const end = timeToMinutes(schedule.close);
  const out = [];
  for (let t = start; t + step <= end; t += step) out.push(minutesToTime(t));
  return out;
}

/** Слоты, снятые с продажи вручную. */
function blockedTimes(dateKey) {
  const db = store.read();
  return db.blockedSlots
    .filter((b) => b.date === dateKey)
    .map((b) => b.time)
    .filter(Boolean);
}

/**
 * Сколько активных записей уже стоит на слот.
 * @param {string} dateKey @param {string} time
 */
function activeCountAt(dateKey, time) {
  const db = store.read();
  return db.bookings.filter(
    (b) => b.date === dateKey && b.time === time && ACTIVE_STATUSES.includes(b.status)
  ).length;
}

/**
 * Полная картина по дню: слоты + занятость.
 * @param {string} dateKey
 * @returns {{date:string, closed:boolean, note:string|null, capacity:number,
 *            open:string|null, close:string|null,
 *            slots:Array<{time:string, taken:number, capacity:number, available:boolean}>}}
 */
function dayAvailability(dateKey) {
  const schedule = daySchedule(dateKey);
  if (schedule.closed) {
    return {
      date: dateKey,
      closed: true,
      note: schedule.note,
      capacity: 0,
      open: null,
      close: null,
      slots: [],
    };
  }
  const blocked = new Set(blockedTimes(dateKey));
  const slots = slotTimes(dateKey).map((time) => {
    const taken = activeCountAt(dateKey, time);
    const isBlocked = blocked.has(time);
    return {
      time,
      taken,
      capacity: schedule.capacity,
      available: !isBlocked && taken < schedule.capacity,
      blocked: isBlocked,
    };
  });
  return {
    date: dateKey,
    closed: false,
    note: null,
    capacity: schedule.capacity,
    open: schedule.open,
    close: schedule.close,
    slots,
  };
}

/**
 * Можно ли вообще записаться на эту дату (окно записи, запас времени).
 * @param {string} dateKey
 * @param {Date} [now]
 * @returns {{ok:boolean, reason:string|null}}
 */
function isDateInWindow(dateKey, now = new Date()) {
  if (!isValidDateKey(dateKey)) {
    return { ok: false, reason: 'Некорректная дата' };
  }
  const today = toDateKey(now);
  const last = toDateKey(addDays(now, config.booking.horizonDays));
  if (dateKey < today) return { ok: false, reason: 'Дата уже прошла' };
  if (dateKey > last) {
    return {
      ok: false,
      reason: `Онлайн-запись открыта на ${config.booking.horizonDays} дней вперёд`,
    };
  }
  return { ok: true, reason: null };
}

/**
 * Доступные слоты с учётом запаса времени до начала записи.
 * @param {string} dateKey
 * @param {Date} [now]
 */
function availableSlots(dateKey, now = new Date()) {
  const window = isDateInWindow(dateKey, now);
  if (!window.ok) {
    return { ...window, date: dateKey, closed: true, slots: [] };
  }
  const day = dayAvailability(dateKey);
  if (day.closed) {
    return { ok: false, reason: day.note, date: dateKey, closed: true, slots: [] };
  }

  const todayKey = toDateKey(now);
  const earliestMinutes = timeToMinutes(
    minutesToTime(now.getHours() * 60 + now.getMinutes() + config.booking.leadMinutes)
  );
  const slots = day.slots.filter((slot) => {
    if (!slot.available) return false;
    if (dateKey === todayKey && timeToMinutes(slot.time) < earliestMinutes) return false;
    return true;
  });

  return {
    ok: true,
    reason: slots.length ? null : 'На выбранную дату свободного времени нет',
    date: dateKey,
    closed: false,
    open: day.open,
    close: day.close,
    capacity: day.capacity,
    slots,
  };
}

/**
 * Ближайшие даты, открытые для записи (для календаря).
 * @param {Date} [now]
 * @param {number} [days]
 */
function calendar(now = new Date(), days = 14) {
  const out = [];
  for (let i = 0; i < days; i += 1) {
    const date = addDays(now, i);
    const key = toDateKey(date);
    const window = isDateInWindow(key, now);
    const schedule = daySchedule(key);
    const free = window.ok && !schedule.closed ? availableSlots(key, now).slots.length : 0;
    out.push({
      date: key,
      day: date.getDate(),
      weekday: WEEKDAY_SHORT[isoDayOf(key) - 1],
      month: date.getMonth() + 1,
      isToday: i === 0,
      closed: schedule.closed || !window.ok,
      freeCount: free,
      available: free > 0,
    });
  }
  return out;
}

/* ──────────────────────────── создание записи ────────────────────────────── */

/**
 * Проверка, что слот свободен. Вынесена отдельно, потому что это
 * ядро защиты от двойной записи.
 * @param {string} dateKey @param {string} time
 */
function assertSlotFree(dateKey, time) {
  const schedule = daySchedule(dateKey);
  if (schedule.closed) {
    throw new BookingError('DAY_CLOSED', 'В этот день сервис не работает. Выберите другую дату.');
  }
  if (blockedTimes(dateKey).includes(time)) {
    throw new BookingError(
      'SLOT_BLOCKED',
      'Это время недоступно для записи. Выберите другое время.'
    );
  }
  if (!slotTimes(dateKey).includes(time)) {
    throw new BookingError('SLOT_NOT_IN_GRID', 'Такого времени нет в расписании. Выберите другое.');
  }
  if (activeCountAt(dateKey, time) >= schedule.capacity) {
    throw new BookingError(
      'SLOT_TAKEN',
      'Это время уже занято. Выберите другое время или другую дату.',
      409
    );
  }
}

/**
 * Создаёт запись. Вся проверка и вставка выполняются внутри
 * эксклюзивной блокировки хранилища — это и есть защита от
 * двойного бронирования одного слота.
 *
 * @param {{
 *  serviceSlug: string, date: string, time: string,
 *  name: string, phone: string,
 *  brand?: string, model?: string, year?: string|number, plate?: string,
 *  notes?: string, source?: string, requestId?: string
 * }} input
 * @param {(payload:object)=>void|Promise<void>} [onCreated] уведомление администратору
 */
async function createBooking(input, onCreated) {
  const service = getService(input.serviceSlug);
  if (!service) {
    throw new BookingError('SERVICE_UNKNOWN', 'Услуга не найдена. Выберите услугу из списка.');
  }

  const dateKey = String(input.date || '');
  const time = String(input.time || '');
  if (!isValidDateKey(dateKey)) {
    throw new BookingError('DATE_INVALID', 'Выберите дату записи.');
  }
  if (!/^\d{2}:\d{2}$/.test(time)) {
    throw new BookingError('TIME_INVALID', 'Выберите время записи.');
  }

  const now = new Date();
  const window = isDateInWindow(dateKey, now);
  if (!window.ok) {
    throw new BookingError('DATE_OUT_OF_WINDOW', `${window.reason}. Выберите другую дату.`);
  }
  if (dateKey === toDateKey(now)) {
    const earliest = now.getHours() * 60 + now.getMinutes() + config.booking.leadMinutes;
    if (timeToMinutes(time) < earliest) {
      throw new BookingError(
        'TIME_TOO_SOON',
        'До этого времени слишком мало: нужно минимум ' +
          `${config.booking.leadMinutes} минут на подготовку. Выберите более поздний слот.`
      );
    }
  }

  const booking = await store.withLock(() => {
    const db = store.read();

    // Идемпотентность: повторная отправка той же формы не создаёт вторую заявку.
    if (input.requestId) {
      const duplicate = db.bookings.find((b) => b.requestId === input.requestId);
      if (duplicate) return { booking: duplicate, duplicate: true };
    }

    assertSlotFree(dateKey, time);

    // Телефон нормализуется и здесь: доменный слой не должен полагаться
    // на то, что вызывающий код уже привёл его к единому виду.
    const phone = normalizePhone(input.phone) || String(input.phone || '').trim();
    let customer = db.customers.find((c) => c.phone === phone);
    if (!customer) {
      customer = {
        id: store.id(),
        name: String(input.name || '').trim(),
        phone,
        createdAt: new Date().toISOString(),
      };
      db.customers.push(customer);
    } else if (input.name && customer.name !== input.name) {
      customer.name = String(input.name).trim();
    }

    const brand = String(input.brand || '').trim();
    const model = String(input.model || '').trim();
    const year = String(input.year || '').trim();
    const plate = String(input.plate || '').trim().toUpperCase();

    let vehicle = null;
    if (brand || model) {
      vehicle = db.vehicles.find(
        (v) =>
          v.customerId === customer.id &&
          v.brand.toLowerCase() === brand.toLowerCase() &&
          v.model.toLowerCase() === model.toLowerCase() &&
          String(v.year) === year
      );
      if (!vehicle) {
        vehicle = {
          id: store.id(),
          customerId: customer.id,
          brand,
          model,
          year,
          plate,
          createdAt: new Date().toISOString(),
        };
        db.vehicles.push(vehicle);
      } else if (plate && vehicle.plate !== plate) {
        vehicle.plate = plate;
      }
    }

    db.counters.booking += 1;
    const created = {
      id: store.id(),
      publicId: store.bookingCode(db.counters.booking),
      customerId: customer.id,
      vehicleId: vehicle ? vehicle.id : null,
      serviceId: service.slug,
      serviceTitle: service.title,
      date: dateKey,
      time,
      status: STATUS.PENDING,
      notes: String(input.notes || '').trim(),
      source: String(input.source || 'website'),
      requestId: input.requestId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [
        { at: new Date().toISOString(), status: STATUS.PENDING, by: 'client' },
      ],
    };
    db.bookings.push(created);
    return { booking: created, duplicate: false, customer, vehicle };
  });

  const detailed = describeBooking(booking.booking);

  // Уведомление администратору — после успешной записи и вне блокировки,
  // чтобы недоступность Telegram никогда не ломала бронирование.
  if (onCreated && !booking.duplicate) {
    try {
      await onCreated(detailed);
    } catch (err) {
      console.error('[booking] Не удалось отправить уведомление:', err.message);
    }
  }

  return { booking: detailed, duplicate: Boolean(booking.duplicate) };
}

/* ──────────────────────────── чтение для админки ─────────────────────────── */

/** Приводит запись к виду, удобному для отображения. */
function describeBooking(booking) {
  const db = store.read();
  const customer = db.customers.find((c) => c.id === booking.customerId) || null;
  const vehicle = booking.vehicleId
    ? db.vehicles.find((v) => v.id === booking.vehicleId) || null
    : null;
  return {
    ...booking,
    statusLabel: STATUS_LABELS[booking.status] || booking.status,
    customerName: customer ? customer.name : '',
    customerPhone: customer ? customer.phone : '',
    /* Тот же номер в читаемом виде: +7 777 088 44 36 */
    customerPhoneDisplay: customer ? formatPhone(customer.phone) || customer.phone : '',
    vehicleText: vehicle ? vehicleText(vehicle) : '',
    vehicle,
    humanDate: humanDate(booking.date),
    fullDate: fullDate(booking.date),
    numericDate: numericDate(booking.date),
  };
}

/** @param {{brand?:string, model?:string, year?:string|number}} vehicle */
function vehicleText(vehicle) {
  if (!vehicle) return '';
  return [vehicle.brand, vehicle.model, vehicle.year].filter(Boolean).join(' ').trim();
}

/**
 * Записи за период.
 * @param {{from?:string, to?:string, status?:string[], query?:string}} [filter]
 */
function listBookings(filter = {}) {
  const db = store.read();
  let items = db.bookings.map(describeBooking);
  if (filter.from) items = items.filter((b) => b.date >= filter.from);
  if (filter.to) items = items.filter((b) => b.date <= filter.to);
  if (filter.status && filter.status.length) {
    items = items.filter((b) => filter.status.includes(b.status));
  }
  if (filter.query) {
    const q = filter.query.toLowerCase();
    items = items.filter((b) =>
      [b.customerName, b.customerPhone, b.vehicleText, b.serviceTitle, b.publicId]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }
  items.sort((a, b) =>
    a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)
  );
  return items;
}

/** @param {string} bookingId */
function getBooking(bookingId) {
  const db = store.read();
  const found = db.bookings.find((b) => b.id === bookingId || b.publicId === bookingId);
  return found ? describeBooking(found) : null;
}

/**
 * Смена статуса записи.
 * @param {string} bookingId @param {string} status @param {string} [by]
 */
async function updateStatus(bookingId, status, by = 'admin') {
  if (!Object.values(STATUS).includes(status)) {
    throw new BookingError('STATUS_INVALID', 'Неизвестный статус записи.');
  }
  return store.withLock(() => {
    const db = store.read();
    const booking = db.bookings.find((b) => b.id === bookingId || b.publicId === bookingId);
    if (!booking) throw new BookingError('BOOKING_NOT_FOUND', 'Запись не найдена.', 404);
    booking.status = status;
    booking.updatedAt = new Date().toISOString();
    booking.history.push({ at: booking.updatedAt, status, by });
    return describeBooking(booking);
  });
}

/** Сводка для дашборда. */
function summary(now = new Date()) {
  const today = toDateKey(now);
  const all = listBookings();
  const todayItems = all.filter((b) => b.date === today);
  const activeToday = todayItems.filter((b) => ACTIVE_STATUSES.includes(b.status));
  return {
    today,
    todayCount: activeToday.length,
    todayPending: todayItems.filter((b) => b.status === STATUS.PENDING).length,
    upcoming: all.filter((b) => b.date > today && ACTIVE_STATUSES.includes(b.status)).length,
    total: all.length,
    customers: store.read().customers.length,
  };
}

module.exports = {
  STATUS,
  STATUS_LABELS,
  ACTIVE_STATUSES,
  BookingError,
  toDateKey,
  parseDateKey,
  isValidDateKey,
  isoDayOf,
  addDays,
  timeToMinutes,
  minutesToTime,
  humanDate,
  fullDate,
  numericDate,
  weekdayFull: (dateKey) => WEEKDAY_FULL[isoDayOf(dateKey) - 1],
  daySchedule,
  slotTimes,
  dayAvailability,
  activeCountAt,
  availableSlots,
  isDateInWindow,
  calendar,
  createBooking,
  listBookings,
  getBooking,
  updateStatus,
  describeBooking,
  vehicleText,
  summary,
};
