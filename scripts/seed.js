'use strict';

/**
 * Инициализация хранилища.
 *
 *   node scripts/seed.js          — создать пустую базу (безопасно)
 *   node scripts/seed.js --demo   — добавить демонстрационные записи
 *
 * Демо-данные создаются ТОЛЬКО вне production и НИКОГДА не попадают
 * в публичный интерфейс: это тестовые записи для админки и проверки
 * слотов на этапе разработки. На боевом сервере флаг --demo игнорируется.
 */

const config = require('../src/config');
const store = require('../src/lib/store');
const bookingLib = require('../src/lib/booking');

const wantDemo = process.argv.includes('--demo');

function main() {
  if (wantDemo && config.nodeEnv === 'production') {
    console.log('NODE_ENV=production — демонстрационные данные не создаются.');
    console.log(`Хранилище: ${config.dataFile}`);
    return;
  }

  const db = store.load();
  console.log(`Хранилище: ${config.dataFile}`);
  console.log(
    `Записей: ${db.bookings.length}, клиентов: ${db.customers.length}, ` +
      `переопределений графика: ${db.scheduleOverrides.length}`
  );

  if (!wantDemo) {
    if (!db.bookings.length && !db.customers.length) {
      store.persist();
      console.log('Пустая база создана. Готово.');
    } else {
      console.log('База уже заполнена — данные не тронуты.');
    }
    return;
  }

  /* Демонстрационные записи: несколько слотов на ближайшие рабочие дни. */
  const now = new Date();
  const demo = [
    { serviceSlug: 'kompyuternaya-diagnostika', name: 'Тестовый Клиент', phone: '+77000000001',
      brand: 'Toyota', model: 'Camry', year: '2020', notes: 'Демонстрационная запись (dev).' },
    { serviceSlug: 'zamena-masla-i-filtrov', name: 'Тестовый Клиент 2', phone: '+77000000002',
      brand: 'Hyundai', model: 'Tucson', year: '2019', notes: 'Демонстрационная запись (dev).' },
    { serviceSlug: 'remont-hodovoy-chasti', name: 'Тестовый Клиент 3', phone: '+77000000003',
      brand: 'Kia', model: 'Sportage', year: '2021', notes: 'Демонстрационная запись (dev).' },
  ];

  (async () => {
    let created = 0;
    for (let offset = 0; offset < 10 && created < demo.length; offset += 1) {
      const date = bookingLib.toDateKey(bookingLib.addDays(now, offset));
      const slots = bookingLib.availableSlots(date, now).slots || [];
      if (!slots.length) continue;
      const item = demo[created];
      const time = slots[Math.min(2, slots.length - 1)].time;
      try {
        await bookingLib.createBooking(
          Object.assign({ date, time, source: 'seed-demo' }, item)
        );
        created += 1;
        console.log(`  + демо-запись: ${date} ${time} — ${item.name}`);
      } catch (err) {
        console.log(`  ! не удалось создать запись на ${date} ${time}: ${err.message}`);
      }
    }
    console.log(`\nДемонстрационных записей создано: ${created}.`);
    console.log('Это тестовые данные для разработки. Удалить: удалите файл ' + config.dataFile);
  })();
}

main();
