'use strict';

/**
 * Минимальный клиент DevTools Protocol.
 *
 * Зачем свой: Playwright и Puppeteer тянут сотни мегабайт зависимостей,
 * а для проверки вёрстки достаточно нескольких команд CDP поверх
 * встроенного в Node WebSocket. Этот модуль используется скриптами
 * проверки (scripts/qa.js, scripts/qa-shots.js) и в само приложение
 * не входит.
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);

/** @returns {string|null} путь к исполняемому файлу Chrome */
function findChrome() {
  for (const candidate of CHROME_CANDIDATES) {
    if (candidate && fs.existsSync(candidate)) return candidate;
  }
  return null;
}

/** @param {number} ms */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** @param {string} url */
function getJson(url) {
  return new Promise((resolve, reject) => {
    const request = http.get(url, (response) => {
      let body = '';
      response.on('data', (chunk) => {
        body += chunk;
      });
      response.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (err) {
          reject(err);
        }
      });
    });
    request.on('error', reject);
    request.setTimeout(4000, () => request.destroy(new Error('timeout')));
  });
}

/** Клиент одной вкладки. */
class Cdp {
  /** @param {WebSocket} ws */
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.listeners = new Map();

    ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) reject(new Error(message.error.message));
        else resolve(message.result);
        return;
      }
      if (message.method && this.listeners.has(message.method)) {
        for (const listener of this.listeners.get(message.method)) listener(message.params);
      }
    });
  }

  /** @param {string} url @returns {Promise<Cdp>} */
  static async connect(url) {
    const ws = new WebSocket(url);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true });
      ws.addEventListener('error', () => reject(new Error('Не удалось подключиться к Chrome')), {
        once: true,
      });
    });
    return new Cdp(ws);
  }

  /**
   * Команда с одним повтором: headless Chrome иногда не отвечает сразу.
   * @param {string} method @param {object} [params] @param {number} [attempts]
   */
  async send(method, params, attempts = 2) {
    let lastError = null;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        return await this.sendOnce(method, params);
      } catch (err) {
        lastError = err;
        await sleep(400);
      }
    }
    throw lastError;
  }

  sendOnce(method, params) {
    this.id += 1;
    const id = this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params: params || {} }));
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`Таймаут CDP-команды ${method}`));
        }
      }, 45000);
    });
  }

  /** @param {string} method @param {(params:object)=>void} listener */
  on(method, listener) {
    if (!this.listeners.has(method)) this.listeners.set(method, []);
    this.listeners.get(method).push(listener);
  }

  once(method) {
    return new Promise((resolve) => {
      const wrapped = (params) => {
        this.listeners.set(
          method,
          (this.listeners.get(method) || []).filter((item) => item !== wrapped)
        );
        resolve(params);
      };
      this.on(method, wrapped);
    });
  }

  close() {
    try {
      this.ws.close();
    } catch {
      /* соединение уже закрыто */
    }
  }
}

/**
 * Запускает headless Chrome и открывает вкладку.
 * @param {{port:number, width?:number, height?:number}} options
 * @returns {Promise<{page:Cdp, browser:Cdp, close:()=>Promise<void>}>}
 */
async function launch(options) {
  const chrome = findChrome();
  if (!chrome) throw new Error('Chrome не найден. Задайте путь через переменную CHROME_PATH.');

  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'yasira-chrome-'));
  const child = spawn(
    chrome,
    [
      '--headless=new',
      `--remote-debugging-port=${options.port}`,
      `--user-data-dir=${profile}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-gpu',
      '--hide-scrollbars',
      '--disable-extensions',
      '--force-device-scale-factor=1',
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  let version = null;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      version = await getJson(`http://127.0.0.1:${options.port}/json/version`);
      break;
    } catch {
      await sleep(250);
    }
  }
  if (!version) {
    child.kill();
    throw new Error('Не удалось запустить Chrome с отладочным портом.');
  }

  const browser = await Cdp.connect(version.webSocketDebuggerUrl);
  const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' });

  let pageWs = null;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const list = await getJson(`http://127.0.0.1:${options.port}/json/list`);
    const target = list.find((item) => item.id === targetId);
    if (target && target.webSocketDebuggerUrl) {
      pageWs = target.webSocketDebuggerUrl;
      break;
    }
    await sleep(200);
  }
  if (!pageWs) {
    child.kill();
    throw new Error('Не удалось подключиться к вкладке Chrome.');
  }

  const page = await Cdp.connect(pageWs);
  await page.send('Page.enable');
  await page.send('Runtime.enable');

  if (options.width && options.height) {
    await setViewport(page, options.width, options.height);
  }

  return {
    page,
    browser,
    async close() {
      page.close();
      browser.close();
      child.kill();
      await sleep(250);
      try {
        fs.rmSync(profile, { recursive: true, force: true });
      } catch {
        /* профиль может остаться — не критично */
      }
    },
  };
}

/**
 * @param {Cdp} page @param {number} width @param {number} height
 */
function setViewport(page, width, height) {
  return page.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 900,
  });
}

/**
 * Выполняет выражение в странице с повтором: сразу после навигации
 * контекст исполнения может быть ещё не готов.
 * @param {Cdp} page @param {string} expression @param {number} [attempts]
 */
async function evaluate(page, expression, attempts = 3) {
  let lastError = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const result = await page.send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      if (result.exceptionDetails) {
        throw new Error(
          `Ошибка в браузере: ${result.exceptionDetails.exception?.description || 'неизвестно'}`
        );
      }
      return result.result.value;
    } catch (err) {
      lastError = err;
      await sleep(200);
    }
  }
  throw lastError;
}

/**
 * Переходит на страницу и дожидается её готовности по фактическому
 * состоянию документа (событие загрузки может относиться к предыдущей
 * странице — тогда следующий evaluate уйдёт в мёртвый контекст).
 * @param {Cdp} page @param {string} url
 */
async function navigate(page, url) {
  const expectedPath = new URL(url).pathname;
  await page.send('Page.navigate', { url });

  for (let attempt = 0; attempt < 70; attempt += 1) {
    await sleep(120);
    try {
      const state = await evaluate(page, `document.readyState + '|' + location.pathname`, 1);
      if (String(state).startsWith('complete') && String(state).includes(expectedPath)) {
        await sleep(200);
        return;
      }
    } catch {
      /* контекст ещё не готов */
    }
  }
  throw new Error(`Страница не догрузилась: ${url}`);
}

/**
 * Делает снимок страницы.
 * @param {Cdp} page @param {string} file @param {{full?:boolean, quality?:number}} [options]
 */
async function screenshot(page, file, options = {}) {
  const result = await page.send('Page.captureScreenshot', {
    format: 'jpeg',
    quality: options.quality || 82,
    captureBeyondViewport: options.full !== false,
  });
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.from(result.data, 'base64'));
  return file;
}

module.exports = {
  Cdp,
  launch,
  findChrome,
  setViewport,
  evaluate,
  navigate,
  screenshot,
  sleep,
  getJson,
};
