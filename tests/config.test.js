'use strict';

/** Конфигурация: график работы, статус «открыто сейчас» и ссылки на действия. */

const test = require('node:test');
const assert = require('node:assert/strict');

const config = require('../src/config');

/** Дата в локальном поясе сервиса (Актау). */
function at(isoDay, hours, minutes) {
  // 2026-09-28 — понедельник; отсчитываем нужный день недели
  const date = new Date(2026, 8, 28 + (isoDay - 1), hours, minutes, 0, 0);
  assert.equal(date.getDay() === 0 ? 7 : date.getDay(), isoDay, 'день недели в тесте');
  return date;
}

test('график работы разобран по дням', () => {
  assert.deepEqual(config.hoursForDay(1), { open: '09:00', close: '19:00' });
  assert.deepEqual(config.hoursForDay(6), { open: '09:00', close: '19:00' });
  assert.deepEqual(config.hoursForDay(7), { open: '10:00', close: '17:00' });
});

test('во время работы статус — открыто и указано время закрытия', () => {
  const status = config.openStatus(at(1, 12, 0));
  assert.equal(status.open, true);
  assert.equal(status.label, 'Открыто');
  assert.match(status.detail, /19:00/);
});

test('до открытия статус — закрыто и указано время открытия', () => {
  const status = config.openStatus(at(1, 7, 30));
  assert.equal(status.open, false);
  assert.match(status.detail, /09:00/);
});

test('после закрытия статус — закрыто и указан следующий рабочий день', () => {
  const status = config.openStatus(at(1, 20, 0));
  assert.equal(status.open, false);
  assert.match(status.detail, /(завтра|вторник)/);
});

test('в воскресенье после закрытия говорится «завтра» и время открытия', () => {
  /* «Завтра» здесь точнее, чем «понедельник»: клиенту важно когда
     позвонить, а не название дня. Проверяем и то, что назван верный час. */
  const status = config.openStatus(at(7, 18, 0));
  assert.equal(status.open, false);
  assert.equal(status.detail, 'завтра с 09:00');
});

test('если следующий рабочий день не завтра, назван день недели', () => {
  /* При текущем графике работают все семь дней, поэтому «завтра» звучит
     всегда. Ветка с названием дня — запас на случай выходного в графике,
     поэтому проверяем её на временно изменённом расписании. */
  const original = config.business.hours;
  try {
    config.business.hours = [
      { days: [1, 2, 3], open: '09:00', close: '19:00' },
      { days: [5, 6], open: '09:00', close: '19:00' },
    ];
    // Четверг, после закрытия: ближайший рабочий день — пятница, но это завтра
    assert.equal(config.openStatus(at(4, 22, 0)).detail, 'завтра с 09:00');
    // Суббота после закрытия: ближайший рабочий день — понедельник
    assert.match(config.openStatus(at(6, 22, 0)).detail, /понедельник/);
  } finally {
    config.business.hours = original;
  }
});

test('границы смены: ровно 09:00 открыто, ровно 19:00 закрыто', () => {
  assert.equal(config.openStatus(at(2, 9, 0)).open, true);
  assert.equal(config.openStatus(at(2, 19, 0)).open, false);
});

test('ссылка на WhatsApp содержит номер и готовый текст', () => {
  const link = config.waLink(config.waText.general);
  assert.ok(link.startsWith('https://wa.me/'));
  assert.ok(link.includes(config.business.whatsapp));
  // Текст закодирован, читается после декодирования
  const text = decodeURIComponent(link.split('?text=')[1]);
  assert.equal(text, config.waText.general);
});

test('сообщение для услуги подставляет название в язык клиента', () => {
  const text = config.waText.service('ремонт ходовой');
  assert.match(text, /ремонт ходовой/);
  assert.match(text, /стоимости/);
});

test('ссылка «позвонить» содержит только цифры и плюс', () => {
  assert.equal(config.telHref('+7 777 088 44 36'), 'tel:+77770884436');
  assert.equal(config.telHref('8 (777) 088-44-36'), 'tel:87770884436');
});

test('в списке телефонов каждый номер подписан назначением', () => {
  assert.ok(config.business.phoneList.length >= 4);
  for (const entry of config.business.phoneList) {
    assert.ok(/\d/.test(entry.number), `номер: ${entry.number}`);
    assert.ok(entry.role.length > 2, `назначение для ${entry.number}`);
  }
});

test('рейтинги двух площадок заданы числами', () => {
  assert.equal(typeof config.business.rating, 'number');
  assert.equal(typeof config.business.yandexRating, 'number');
  assert.ok(config.business.rating > 0 && config.business.rating <= 5);
  assert.ok(config.business.yandexRating > 0 && config.business.yandexRating <= 5);
});
