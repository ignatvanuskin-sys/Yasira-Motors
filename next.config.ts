import type { NextConfig } from "next";

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
