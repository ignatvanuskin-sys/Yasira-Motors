import type { Metadata, Viewport } from "next";
import { preload } from "react-dom";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MobileBar } from "@/components/MobileBar";
import { RevealScript } from "@/components/RevealScript";
import { company, SITE_URL } from "@/lib/site";
import { structuredData } from "@/lib/seo";
import "./globals.css";

const description =
  "Автосервис в Актау: диагностика, ТО и замена масла, ремонт двигателя, АКПП, МКПП, ходовой и развал-схождение. 25-й микрорайон, 52/2. ★ 4,9 в 2ГИС. Тел. +7 777 088 44 36";

/** Предпросмотрные деплои Vercel не должны попадать в индекс поисковиков. */
const isPreview = process.env.VERCEL_ENV === "preview";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "YASIRA MOTORS — автосервис в Актау | Ремонт и обслуживание автомобилей",
    template: "%s — YASIRA MOTORS, автосервис в Актау",
  },
  description,
  applicationName: company.name,
  keywords: [
    "автосервис Актау",
    "СТО Актау",
    "ремонт автомобилей Актау",
    "обслуживание автомобилей Актау",
    "замена масла Актау",
    "компьютерная диагностика Актау",
    "развал-схождение Актау",
    "ремонт АКПП Актау",
    "ремонт ходовой части Актау",
    "шиномонтаж Актау",
    "YASIRA MOTORS",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: SITE_URL,
    siteName: company.name,
    title: "YASIRA MOTORS — автосервис в Актау",
    description,
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: "YASIRA MOTORS — автосервис в Актау, 25-й микрорайон, 52/2",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "YASIRA MOTORS — автосервис в Актау",
    description,
    images: ["/og.jpg"],
  },
  robots: isPreview
    ? { index: false, follow: false }
    : {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true, "max-image-preview": "large" },
      },
  category: "automotive",
  formatDetection: { telephone: true, address: true },
  icons: {
    // PNG-фолбэк нужен Safari до 16 — он не умеет SVG-фавиконы
    icon: [
      { url: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { url: "/icon-32.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0c",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // React 19 сам вставляет <link rel="preload"> и дедуплицирует их —
  // вручную разметку писать не нужно, иначе preload дублируется в head.
  preload("/fonts/manrope-cyrillic.woff2", { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  preload("/fonts/manrope-latin.woff2", { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  // Моноширинный виден на первом экране (строка бренда), поэтому тоже предзагружаем
  preload("/fonts/jetbrains-mono-cyrillic-500.woff2", {
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous",
  });

  return (
    <html lang="ru">
      <head>
        {/*
          Класс js ставится до первой отрисовки. Анимация появления скрывает
          блоки только при работающем JS: если скрипты не загрузились, контент
          виден сразу — страница не может остаться пустой.
        */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <script
          type="application/ld+json"
          // Данные только подтверждённые: адрес, телефон, график, рубрики.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData()) }}
        />
      </head>
      <body className="flex min-h-screen flex-col pb-mobile-bar">
        <a
          href="#services"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[80] focus:rounded-ctl focus:bg-brand-500 focus:px-4 focus:py-2 focus:font-semibold focus:text-white"
        >
          Перейти к услугам
        </a>
        <Header />
        <main className="grow">{children}</main>
        {/* Подвал — вне <main>: это отдельная область страницы, а не часть контента */}
        <Footer />
        <MobileBar />
        <RevealScript />
      </body>
    </html>
  );
}
