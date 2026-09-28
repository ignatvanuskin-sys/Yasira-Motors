import type { Metadata, Viewport } from "next";
import { Header } from "@/components/Header";
import { MobileBar } from "@/components/MobileBar";
import { RevealScript } from "@/components/RevealScript";
import { company, SITE_URL } from "@/lib/site";
import { structuredData } from "@/lib/seo";
import "./globals.css";

const description =
  "Автосервис в Актау: компьютерная диагностика, ТО и замена масла, ремонт двигателя, АКПП, МКПП, ходовой части и электрики, развал-схождение, шиномонтаж. 25-й микрорайон, 52/2. Рейтинг 4,9 в 2ГИС. Телефон +7 777 088 44 36.";

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
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  category: "automotive",
  formatDetection: { telephone: true, address: true },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0c",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link
          rel="preload"
          href="/fonts/manrope-cyrillic.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/manrope-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <noscript>
          {/* Без JS контент не должен оставаться скрытым из-за анимации появления */}
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        <script
          type="application/ld+json"
          // Данные только подтверждённые: адрес, телефон, график, рубрики.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData()) }}
        />
      </head>
      <body className="flex min-h-screen flex-col pb-[68px] md:pb-0">
        <a
          href="#services"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[80] focus:rounded-ctl focus:bg-brand-500 focus:px-4 focus:py-2 focus:font-semibold focus:text-white"
        >
          Перейти к услугам
        </a>
        <Header />
        <main className="grow">{children}</main>
        <MobileBar />
        <RevealScript />
      </body>
    </html>
  );
}
