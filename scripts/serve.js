"use strict";

/**
 * Локальный предпросмотр собранного сайта без внешних зависимостей.
 *
 *   npm run build && npm run preview      → http://localhost:4173
 *
 * Отдаёт каталог out/ (результат `next build` в режиме static export).
 */

const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..", "out");
const PORT = Number(process.env.PORT || 4173);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
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

if (!fs.existsSync(ROOT)) {
  console.error("Нет каталога out/. Сначала выполните: npm run build");
  process.exit(1);
}

http
  .createServer((req, res) => {
    let filePath = path.join(ROOT, decodeURIComponent(new URL(req.url, "http://localhost").pathname));

    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403).end("forbidden");
      return;
    }
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }
    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { "content-type": "text/html; charset=utf-8" });
      res.end("<h1>404</h1>");
      return;
    }

    res.writeHead(200, {
      "content-type": MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream",
    });
    fs.createReadStream(filePath).pipe(res);
  })
  .listen(PORT, () => {
    console.log(`Сайт доступен: http://localhost:${PORT}`);
  });
