'use strict';

/** Тесты логики записи: сетка слотов, окно записи, защита от двойного бронирования. */

const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

/* Изолированное хранилище — до подключения модулей. */
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'yasira-booking-'));
process.env.DATA_FILE = path.join(TMP, 'db.json');
process.env.NODE_ENV = 'test';

const test = require('node:test');
const assert = require('node:assert/strict');

const config = require('../src/config');
const store = require('../src/lib/store');
const booking = require('../src/lib/booking');

test.after(() => {
  fs.rmSync(TMP, { recursive: true, force: true });
});

/** Первая доступная дата в окне записи. */
function firstOpenDate(from = new Date()) {
  for (let offset = 0; offset < config.booking.horizonDays; offset += 1) {
    const date = booking.toDateKey(booking.addDays(from, offset));
    const day = booking.dayAvailability(date);
    if (!day.closed && day.slots.length) return date;
  }
  throw new Error('Не найдено ни одного открытого дня');
}

/** Время слота, до которого заведомо есть запас (не сегодня). */
function usableDate() {
  const date = firstOpenDate(booking.addDays(new Date(), 1));
  return date;
}

test('toDateKey и parseDateKey работают без сдвига часового пояса', () => {
  const date = new Date(2026, 8, 28, 14, 30); // 28 сентября 2026, локально
  assert.equal(booking.toDateKey(date), '2026-09-28');
  assert.equal(booking.parseDateKey('2026-09-28').getDate(), 28);
  assert.equal(booking.parseDateKey('2026-09-28').getMonth(), 8);
});

test('isValidDateKey отбраковывает некорректные даты', () => {
  assert.equal(booking.isValidDateKey('2026-09-28'), true);
  assert.equal(booking.isValidDateKey('2026-13-01'), false);
  assert.equal(booking.isValidDateKey('28.09.2026'), false);
  assert.equal(booking.isValidDateKey('вчера'), false);
});

test('isoDayOf считает понедельник первым днём недели', () => {
  // 28 сентября 2026 — понедельник
  assert.equal(booking.isoDayOf('2026-09-28'), 1);
  // 27 сентября 2026 — воскресенье
  assert.equal(booking.isoDayOf('2026-09-27'), 7);
});

test('timeToMinutes и minutesToTime взаимно обратимы', () => {
  assert.equal(booking.timeToMinutes('09:00'), 540);
  assert.equal(booking.minutesToTime(540), '09:00');
  assert.equal(booking.minutesToTime(870), '14:30');
});

test('сетка слотов соответствует графику работы', () => {
  const monday = '2026-09-28';
  const slots = booking.slotTimes(monday);
  const schedule = booking.daySchedule(monday);

  /* Ожидания считаются из конфига, а не вписаны числами.
     Иначе правка графика в одном месте ломает тест, который проверяет
     не конкретные часы, а согласованность сетки с расписанием. */
  const expected = config.hoursForDay(booking.isoDayOf(monday));
  assert.ok(expected, 'для понедельника в конфиге должен быть график');

  assert.equal(schedule.closed, false);
  assert.equal(schedule.open, expected.open);
  assert.equal(schedule.close, expected.close);
  assert.ok(slots.length > 0);
  assert.equal(slots[0], expected.open);
  // Последний слот + шаг не выходит за закрытие
  const last = slots[slots.length - 1];
  assert.ok(
    booking.timeToMinutes(last) + config.booking.slotMinutes <=
      booking.timeToMinutes(expected.close)
  );
  // Слоты идут с шагом и по возрастанию
  for (let i = 1; i < slots.length; i += 1) {
    assert.equal(
      booking.timeToMinutes(slots[i]) - booking.timeToMinutes(slots[i - 1]),
      config.booking.slotMinutes
    );
  }
});

test('в воскресенье действует сокращённый график', () => {
  const sunday = '2026-10-04'; // воскресенье
  assert.equal(booking.isoDayOf(sunday), 7);
  const schedule = booking.daySchedule(sunday);
  assert.equal(schedule.open, '10:00');
  assert.equal(schedule.close, '17:00');
});

test('запись недоступна в прошлом и за горизонтом', () => {
  const now = new Date(2026, 8, 28, 10, 0);
  assert.equal(booking.isDateInWindow('2026-09-27', now).ok, false);
  assert.equal(booking.isDateInWindow('2026-09-28', now).ok, true);
  assert.equal(booking.isDateInWindow('2027-01-01', now).ok, false);
});

test('createBooking создаёт запись со статусом PENDING', async () => {
  const date = usableDate();
  const slot = booking.availableSlots(date, new Date()).slots[0].time;

  const { booking: created } = await booking.createBooking({
    serviceSlug: 'kompyuternaya-diagnostika',
    date,
    time: slot,
    name: 'Асхат Айдарханов',
    phone: '87770884436',
    brand: 'Toyota',
    model: 'Camry',
    year: '2020',
  });

  assert.equal(created.status, booking.STATUS.PENDING);
  assert.match(created.publicId, /^YM-\d{5}$/);
  assert.equal(created.customerPhone, '+77770884436');
  assert.equal(created.vehicleText, 'Toyota Camry 2020');
  assert.equal(created.serviceTitle, 'Компьютерная диагностика');
});

test('повторная отправка с тем же requestId не создаёт вторую запись', async () => {
  const date = usableDate();
  const slot = booking.availableSlots(date, new Date()).slots[0].time;
  const requestId = 'test-idempotency-key-1';

  const first = await booking.createBooking({
    serviceSlug: 'shinomontazh',
    date,
    time: slot,
    name: 'Тест Идемпотентности',
    phone: '+77001112233',
    requestId,
  });
  const second = await booking.createBooking({
    serviceSlug: 'shinomontazh',
    date,
    time: slot,
    name: 'Тест Идемпотентности',
    phone: '+77001112233',
    requestId,
  });

  assert.equal(first.booking.publicId, second.booking.publicId);
  assert.equal(second.duplicate, true);
});

test('занятый слот нельзя забронировать дважды', async () => {
  const date = usableDate();
  const slot = booking.availableSlots(date, new Date()).slots[0].time;

  await booking.createBooking({
    serviceSlug: 'zamena-masla-i-filtrov',
    date,
    time: slot,
    name: 'Первый Клиент',
    phone: '+77005550001',
  });

  await assert.rejects(
    () =>
      booking.createBooking({
        serviceSlug: 'remont-akpp',
        date,
        time: slot,
        name: 'Второй Клиент',
        phone: '+77005550002',
      }),
    (err) => {
      assert.equal(err.code, 'SLOT_TAKEN');
      assert.equal(err.httpStatus, 409);
      return true;
    }
  );

  assert.equal(booking.activeCountAt(date, slot), 1);
});

test('занятый слот исчезает из доступных', async () => {
  const date = usableDate();
  const before = booking.availableSlots(date, new Date()).slots;
  const target = before[0].time;

  await booking.createBooking({
    serviceSlug: 'shinomontazh',
    date,
    time: target,
    name: 'Клиент Слота',
    phone: '+77005550003',
  });

  const after = booking.availableSlots(date, new Date()).slots;
  assert.equal(after.some((slot) => slot.time === target), false);
});

test('одновременные заявки на один слот: проходит ровно одна', async () => {
  const date = usableDate();
  const slot = booking.availableSlots(date, new Date()).slots[0].time;

  const attempts = Array.from({ length: 6 }, (_, index) =>
    booking
      .createBooking({
        serviceSlug: 'shinomontazh',
        date,
        time: slot,
        name: `Гонка ${index}`,
        phone: `+7700555010${index}`,
      })
      .then(() => 'ok')
      .catch((err) => err.code)
  );

  const results = await Promise.all(attempts);
  const succeeded = results.filter((result) => result === 'ok');
  const taken = results.filter((result) => result === 'SLOT_TAKEN');

  assert.equal(succeeded.length, config.booking.capacity);
  assert.equal(taken.length, 6 - config.booking.capacity);
  assert.equal(booking.activeCountAt(date, slot), config.booking.capacity);
});

test('отменённая запись освобождает слот', async () => {
  const date = usableDate();
  const slot = booking.availableSlots(date, new Date()).slots[0].time;

  const { booking: created } = await booking.createBooking({
    serviceSlug: 'shinomontazh',
    date,
    time: slot,
    name: 'Клиент Отмены',
    phone: '+77005550099',
  });

  await booking.updateStatus(created.id, booking.STATUS.CANCELLED);
  assert.equal(booking.activeCountAt(date, slot), 0);

  const again = await booking.createBooking({
    serviceSlug: 'shinomontazh',
    date,
    time: slot,
    name: 'Новый Клиент',
    phone: '+77005550098',
  });
  assert.ok(again.booking.publicId);
});

test('несуществующая услуга не принимается', async () => {
  const date = usableDate();
  const slot = booking.availableSlots(date, new Date()).slots[0].time;

  await assert.rejects(
    () =>
      booking.createBooking({
        serviceSlug: 'teleportaciya',
        date,
        time: slot,
        name: 'Клиент',
        phone: '+77005550077',
      }),
    (err) => err.code === 'SERVICE_UNKNOWN'
  );
});

test('время вне сетки слотов отклоняется', async () => {
  const date = usableDate();
  await assert.rejects(
    () =>
      booking.createBooking({
        serviceSlug: 'shinomontazh',
        date,
        time: '03:17',
        name: 'Клиент',
        phone: '+77005550088',
      }),
    (err) => err.code === 'SLOT_NOT_IN_GRID'
  );
});

test('закрытый день не принимает записи', async () => {
  const date = usableDate();
  await store.withLock(() => {
    const db = store.read();
    db.scheduleOverrides.push({ date, closed: true, note: 'Инвентаризация' });
  });

  const day = booking.dayAvailability(date);
  assert.equal(day.closed, true);

  await assert.rejects(
    () =>
      booking.createBooking({
        serviceSlug: 'shinomontazh',
        date,
        time: '10:00',
        name: 'Клиент',
        phone: '+77005550066',
      }),
    (err) => err.code === 'DAY_CLOSED'
  );

  await store.withLock(() => {
    const db = store.read();
    db.scheduleOverrides = db.scheduleOverrides.filter((o) => o.date !== date);
  });
});

test('уведомление администратора не ломает запись при сбое', async () => {
  const date = usableDate();
  const slot = booking.availableSlots(date, new Date()).slots[0].time;

  const { booking: created } = await booking.createBooking(
    {
      serviceSlug: 'shinomontazh',
      date,
      time: slot,
      name: 'Клиент Уведомления',
      phone: '+77005550055',
    },
    () => {
      throw new Error('канал уведомлений недоступен');
    }
  );

  assert.ok(created.publicId);
  assert.equal(created.status, booking.STATUS.PENDING);
});

test('календарь содержит только корректные дни', () => {
  const days = booking.calendar(new Date(2026, 8, 28), 10);
  assert.equal(days.length, 10);
  assert.equal(days[0].date, '2026-09-28');
  assert.equal(days[0].isToday, true);
  for (const day of days) {
    assert.match(day.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(typeof day.available, 'boolean');
    assert.ok(day.freeCount >= 0);
  }
});

test('сводка считает записи за сегодня', () => {
  const summary = booking.summary(new Date());
  assert.ok(summary.today);
  assert.ok(summary.todayCount >= 0);
  assert.ok(summary.total > 0);
});
