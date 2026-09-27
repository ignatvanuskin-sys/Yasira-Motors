'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const validate = require('../src/lib/validate');

test('normalizePhone приводит казахстанские номера к единому виду', () => {
  assert.equal(validate.normalizePhone('+7 777 088 44 36'), '+77770884436');
  assert.equal(validate.normalizePhone('8 (777) 088-44-36'), '+77770884436');
  assert.equal(validate.normalizePhone('777 088 44 36'), '+77770884436');
  assert.equal(validate.normalizePhone('7770884436'), '+77770884436');
});

test('normalizePhone отбраковывает мусор', () => {
  assert.equal(validate.normalizePhone('123'), null);
  assert.equal(validate.normalizePhone(''), null);
  assert.equal(validate.normalizePhone('телефон'), null);
  assert.equal(validate.normalizePhone('+1 202 555 0100'), null);
});

test('formatPhone возвращает читаемый номер', () => {
  assert.equal(validate.formatPhone('+77770884436'), '+7 777 088 44 36');
});

test('clean убирает управляющие символы и лишние пробелы', () => {
  assert.equal(validate.clean('  Toyota\u0000  Camry  ', 50), 'Toyota Camry');
  assert.equal(validate.clean('a'.repeat(300), 10).length, 10);
});

test('validateName пропускает нормальные имена и отклоняет мусор', () => {
  assert.equal(validate.validateName('Асхат').ok, true);
  assert.equal(validate.validateName('Денис Кушнир').ok, true);
  assert.equal(validate.validateName('Миша-Пётр').ok, true);
  assert.equal(validate.validateName('А').ok, false);
  assert.equal(validate.validateName('<script>alert(1)</script>').ok, false);
  assert.equal(validate.validateName('12345').ok, false);
});

test('validateYear ограничивает диапазон', () => {
  assert.equal(validate.validateYear('2020').value, '2020');
  assert.equal(validate.validateYear('').ok, true);
  assert.equal(validate.validateYear('1800').ok, false);
  assert.equal(validate.validateYear('20x0').ok, false);
  assert.equal(validate.validateYear(String(new Date().getFullYear() + 5)).ok, false);
});

test('validatePlate допускает пустое значение и отклоняет спецсимволы', () => {
  assert.equal(validate.validatePlate('').ok, true);
  assert.equal(validate.validatePlate('123 ABC 12').value, '123 ABC 12');
  assert.equal(validate.validatePlate('<b>').ok, false);
});

test('validateBookingPayload принимает корректную заявку', () => {
  const result = validate.validateBookingPayload({
    serviceSlug: 'kompyuternaya-diagnostika',
    date: '2026-10-01',
    time: '14:30',
    name: '  Асхат  ',
    phone: '8 777 088 44 36',
    brand: 'Toyota',
    model: 'Camry',
    year: '2020',
    plate: '123 abc 12',
    notes: '  Горит Check Engine  ',
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.name, 'Асхат');
  assert.equal(result.value.phone, '+77770884436');
  assert.equal(result.value.plate, '123 ABC 12');
  assert.equal(result.value.notes, 'Горит Check Engine');
  assert.equal(result.value.requestId, null);
});

test('validateBookingPayload собирает все ошибки сразу', () => {
  const result = validate.validateBookingPayload({
    serviceSlug: '',
    date: 'вчера',
    time: '25:00',
    name: 'X',
    phone: '123',
    year: '1000',
  });

  assert.equal(result.ok, false);
  assert.ok(result.errors.serviceSlug);
  assert.ok(result.errors.date);
  assert.ok(result.errors.time);
  assert.ok(result.errors.name);
  assert.ok(result.errors.phone);
  assert.ok(result.errors.year);
});

test('validateBookingPayload не падает на пустом вводе', () => {
  const result = validate.validateBookingPayload(null);
  assert.equal(result.ok, false);
  assert.ok(Object.keys(result.errors).length > 0);
});
