import type { NextConfig } from "next";

/*
  Страховка от публикации с неизвестным адресом: если сборка идёт на Vercel
  для продакшена, а базовый URL не определился, сайт получил бы canonical и
  sitemap с чужим адресом. Лучше упасть на сборке, чем выпустить это в индекс.
*/
if (process.env.VERCEL === "1" && process.env.VERCEL_ENV === "production") {
  const resolved = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (!resolved) {
    throw new Error(
      "Не удалось определить адрес сайта: задайте NEXT_PUBLIC_SITE_URL или проверьте VERCEL_PROJECT_PRODUCTION_URL.",
    );
  }
}

const nextConfig: NextConfig = {
  // Site is fully static: no forms, no server logic — only call / WhatsApp links.
  // Static export keeps hosting cheap and the pages as fast as possible.
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  productionBrowserSourceMaps: false,
  compress: true,
};

export default nextConfig;
