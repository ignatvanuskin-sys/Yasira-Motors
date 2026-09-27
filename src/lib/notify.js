'use strict';

/**
 * Уведомления администратору.
 *
 * Канал — Telegram Bot API, вызывается напрямую через https из Node,
 * чтобы не тянуть зависимости. Если TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID
 * не заданы, уведомления просто отключаются: сайт и запись работают
 * штатно, а факт недоставки уходит в лог. Пользователь в интерфейсе
 * об этом ничего не видит.
 *
 * Подключение: создайте бота у @BotFather, получите токен, узнайте chat_id
 * администратора (например, через @userinfobot) и задайте переменные
 * TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID.
 */

const fs = require('node:fs');
const path = require('node:path');
const https = require('node:https');
const config = require('../config');

const LOG_FILE = path.join(config.root, 'logs', 'notifications.log');

/** Запись в лог-файл: что и когда пытались отправить. */
function log(entry) {
  try {
    fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
    fs.appendFileSync(LOG_FILE, `${JSON.stringify(entry)}\n`, 'utf8');
  } catch (err) {
    console.error('[notify] Не удалось записать лог уведомлений:', err.message);
  }
}

/**
 * Текст уведомления о новой записи.
 * @param {object} booking описание из booking.describeBooking()
 */
function buildBookingMessage(booking) {
  const lines = [
    '🚗 НОВАЯ ЗАПИСЬ',
    '',
    'YASIRA MOTORS',
    '',
    `Клиент:\n${booking.customerName || '—'}`,
    '',
    `Телефон:\n${booking.customerPhoneDisplay || booking.customerPhone || '—'}`,
  ];
  if (booking.vehicleText) lines.push('', `Автомобиль:\n${booking.vehicleText}`);
  if (booking.vehicle && booking.vehicle.plate) {
    lines.push('', `Госномер:\n${booking.vehicle.plate}`);
  }
  lines.push(
    '',
    `Услуга:\n${booking.serviceTitle}`,
    '',
    `Дата:\n${booking.numericDate}`,
    '',
    `Время:\n${booking.time}`,
    '',
    `Номер записи:\n${booking.publicId}`
  );
  if (booking.notes) lines.push('', `Комментарий:\n${booking.notes}`);
  return lines.join('\n');
}

/**
 * Отправка сообщения в Telegram.
 * @param {string} text
 * @returns {Promise<{ok:boolean, skipped?:boolean, error?:string}>}
 */
function sendTelegram(text) {
  if (!config.telegram.enabled) {
    return Promise.resolve({ ok: false, skipped: true });
  }
  const payload = JSON.stringify({
    chat_id: config.telegram.chatId,
    text,
    disable_web_page_preview: true,
  });

  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: 'api.telegram.org',
        path: `/bot${config.telegram.token}/sendMessage`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
        timeout: 10000,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ ok: true });
          } else {
            resolve({ ok: false, error: `HTTP ${res.statusCode}: ${body.slice(0, 300)}` });
          }
        });
      }
    );
    req.on('timeout', () => {
      req.destroy(new Error('timeout'));
    });
    req.on('error', (err) => resolve({ ok: false, error: err.message }));
    req.write(payload);
    req.end();
  });
}

/**
 * Уведомить администратора о новой записи.
 * Никогда не выбрасывает исключение — вызывающий код не должен
 * падать из-за недоступности уведомлений.
 * @param {object} booking
 */
async function notifyNewBooking(booking) {
  const text = buildBookingMessage(booking);
  const result = await sendTelegram(text).catch((err) => ({ ok: false, error: err.message }));
  log({
    at: new Date().toISOString(),
    type: 'booking.created',
    bookingId: booking.publicId,
    channel: 'telegram',
    delivered: Boolean(result.ok),
    skipped: Boolean(result.skipped),
    error: result.error || null,
  });
  if (!result.ok && !result.skipped) {
    console.error('[notify] Telegram недоступен:', result.error);
  }
  return result;
}

module.exports = { notifyNewBooking, buildBookingMessage, sendTelegram, LOG_FILE };
