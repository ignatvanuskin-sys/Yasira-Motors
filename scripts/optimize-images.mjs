// One-off image pipeline: resize + convert real 2GIS photos to WebP, build OG image.
import sharp from "sharp";
import { readdir, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const SRC = "public/images";
const OUT = "public/images/opt";

const HERO_W = 1800;
const FULL_W = 1400;

await mkdir(OUT, { recursive: true });

const files = (await readdir(SRC)).filter((f) => f.toLowerCase().endsWith(".jpg"));
const report = [];

for (const file of files) {
  const src = path.join(SRC, file);
  const base = file.replace(/\.jpg$/i, "");
  const meta = await sharp(src).metadata();

  const isHeroish = base === "workshop-lifts" || base === "oil-store";
  const width = Math.min(isHeroish ? HERO_W : FULL_W, meta.width ?? FULL_W);

  const out = path.join(OUT, `${base}.webp`);
  const info = await sharp(src)
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 80, effort: 5 })
    .toFile(out);

  report.push({ file: base, from: `${meta.width}x${meta.height}`, to: `${info.width}x${info.height}`, kb: Math.round(info.size / 1024) });
}

// Branded OG image (1200x630) built from the real workshop photo.
const ogBase = path.join(SRC, "workshop-lifts.jpg");
const ogMeta = await sharp(ogBase).metadata();
const coverW = 1200;
const coverH = 630;

const overlay = Buffer.from(`
<svg width="${coverW}" height="${coverH}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="${coverH}" x2="${coverW * 0.9}" y2="0">
      <stop offset="0%" stop-color="#080809" stop-opacity="0.96"/>
      <stop offset="55%" stop-color="#0B0B0D" stop-opacity="0.82"/>
      <stop offset="100%" stop-color="#0B0B0D" stop-opacity="0.25"/>
    </linearGradient>
  </defs>
  <rect width="${coverW}" height="${coverH}" fill="url(#g)"/>
  <rect x="72" y="196" width="64" height="5" fill="#D8202B"/>
  <text x="72" y="300" font-family="Arial, Helvetica, sans-serif" font-size="72" font-weight="700" fill="#FFFFFF" letter-spacing="1">YASIRA MOTORS</text>
  <text x="72" y="356" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="400" fill="#C9C9CE">Автосервис в Актау — 25-й микрорайон, 52/2</text>
  <text x="72" y="430" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="700" fill="#F2A93B">★ 4.9 в 2ГИС · Лучший автосервис 2GIS Awards 2026</text>
</svg>`);

await sharp(ogBase)
  .rotate()
  .resize({ width: coverW, height: coverH, fit: "cover", position: "centre" })
  .composite([{ input: overlay, blend: "over" }])
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile("public/og.jpg");

console.log(JSON.stringify(report, null, 1));
console.log("og.jpg", ogMeta.width + "x" + ogMeta.height, "->", coverW + "x" + coverH);
