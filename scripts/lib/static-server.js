"use strict";

/**
 * Локальный статический сервер для `out/`.
 *
 * Заголовки берутся из vercel.json, поэтому локальные прогоны проверяют ровно
 * ту политику безопасности и кэширования, которая будет на продакшене.
 */

const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const zlib = require("node:zlib");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

/**
 * Паттерны Vercel превращаем в регулярные выражения.
 * Поддерживаем "(.*)" (любой путь) и группы вида "(a|b)" для конкретных файлов.
 * Экранируются все метасимволы, кроме круглых скобок и вертикальной черты.
 */
function compileSource(source) {
  const body = source
    .split("(.*)")
    .map((part) => part.replace(/[.+?^${}[\]\\]/g, "\\$&"))
    .join("(.*)");
  return new RegExp("^" + body + "$");
}

function loadHeaderRules(configPath) {
  if (!configPath || !fs.existsSync(configPath)) return [];
  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    return (config.headers || []).map((rule) => ({
      pattern: compileSource(rule.source),
      headers: rule.headers || [],
    }));
  } catch {
    return [];
  }
}

/**
 * @param {string} root каталог сборки
 * @param {{configPath?: string}} [options]
 */
function createStaticServer(root, options = {}) {
  const configPath = options.configPath || path.resolve(root, "..", "vercel.json");
  const rules = loadHeaderRules(configPath);

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://127.0.0.1");
    const pathname = decodeURIComponent(url.pathname);
    let filePath = path.join(root, pathname);

    for (const rule of rules) {
      if (rule.pattern.test(pathname)) {
        for (const header of rule.headers) res.setHeader(header.key, header.value);
      }
    }

    if (!filePath.startsWith(root)) {
      res.writeHead(403).end("forbidden");
      return;
    }
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }
    if (!fs.existsSync(filePath)) {
      // Статический экспорт кладёт брендированную 404 в out/404.html
      const notFound = path.join(root, "404.html");
      if (fs.existsSync(notFound)) {
        res.writeHead(404, { "content-type": MIME[".html"] });
        fs.createReadStream(notFound).pipe(res);
        return;
      }
      res.writeHead(404, { "content-type": MIME[".html"] });
      res.end("<h1>404</h1>");
      return;
    }

    const type = MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    const compressible = /^(text\/|application\/(json|xml|manifest\+json|javascript))/.test(type);
    const acceptsGzip = /\bgzip\b/.test(String(req.headers["accept-encoding"] || ""));

    // Сжимаем текстовые ответы как на продакшене: иначе замеры
    // скорости и переданного объёма получаются нереалистичными.
    if (compressible && acceptsGzip) {
      const body = fs.readFileSync(filePath);
      res.writeHead(200, { "content-type": type, "content-encoding": "gzip", vary: "Accept-Encoding" });
      res.end(zlib.gzipSync(body, { level: 9 }));
      return;
    }

    res.writeHead(200, { "content-type": type });
    fs.createReadStream(filePath).pipe(res);
  });

  return server;
}

async function listen(server, port = 0) {
  await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));
  return server.address().port;
}

module.exports = { createStaticServer, listen, MIME };
