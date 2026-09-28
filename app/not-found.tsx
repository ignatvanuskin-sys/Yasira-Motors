import type { Metadata } from "next";
import { CallButton, WhatsAppButton } from "@/components/Actions";
import { nav, phone } from "@/lib/site";

export const metadata: Metadata = {
  title: "Страница не найдена",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <section className="pt-[118px] pb-20 md:pt-[150px] md:pb-28">
      <div className="shell">
        <p className="eyebrow">
          <span className="h-px w-6 bg-brand-500" aria-hidden="true" />
          Ошибка 404
        </p>
        <h1 className="mt-5 text-[clamp(1.7rem,4.6vw,2.6rem)] text-fog-100">
          Такой страницы нет
        </h1>
        <p className="mt-4 max-w-[54ch] text-[16.5px] leading-relaxed text-fog-400">
          Возможно, ссылка устарела. Ниже — основные разделы сайта, а связаться с сервисом можно
          по телефону или в WhatsApp.
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <CallButton size="lg" label={`Позвонить ${phone.display}`} className="xl:min-w-[248px]" />
          <WhatsAppButton size="lg" />
        </div>

        <nav aria-label="Разделы сайта" className="mt-10">
          <ul className="flex flex-wrap gap-2.5">
            {nav.map((item) => (
              <li key={item.href}>
                <a
                  href={`/${item.href}`}
                  className="inline-flex h-11 items-center rounded-ctl border border-line bg-night-850 px-4 text-[14.5px] font-semibold text-fog-200 transition-colors hover:border-brand-500 hover:text-fog-100"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  );
}
