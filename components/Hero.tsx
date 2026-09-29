import { ArrowDown, Star } from "lucide-react";
import { CallButton, WhatsAppButton } from "@/components/Actions";
import { OpenStatus } from "@/components/OpenStatus";
import { GridBackdrop, Spotlight } from "@/components/fx/backdrops";
import { heroPhoto } from "@/lib/content";
import { address, links, phone, rating } from "@/lib/site";

/**
 * Первый экран: фото сервиса занимает правую часть, текст прижат к низу
 * и стоит над полосой характеристик. Высота — ровно видимый экран (100svh),
 * поэтому кнопки всегда на месте и ничего не «уезжает» под сгиб.
 *
 * Внизу — «техпаспорт»: четыре короткие характеристики и приглашение листать.
 * Цифр здесь минимум: только рейтинг со ссылкой на 2ГИС.
 */
export function Hero() {
  return (
    <section
      id="top"
      className="grain hero-viewport relative flex flex-col overflow-hidden bg-night-950"
    >
      {/* Фото: справа на 58% на десктопе, фоном на мобильном */}
      <div className="absolute inset-0 lg:left-auto lg:right-0 lg:w-[58%]">
        <img
          src={heroPhoto.src}
          width={heroPhoto.width}
          height={heroPhoto.height}
          alt={heroPhoto.alt}
          fetchPriority="high"
          decoding="async"
          className="h-full w-full object-cover object-[50%_45%]"
        />
      </div>

      {/*
        Затемнение: на мобильном снизу вверх, на десктопе слева направо.
        Тёмная часть растянута до 70% ширины — заголовок длинный и заходит
        на фото, иначе контурная строка теряется на светлых участках снимка.
      */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-night-950 via-night-950/92 to-night-950/55 lg:bg-gradient-to-r lg:from-night-950 lg:from-32% lg:via-night-950/85 lg:via-70% lg:to-night-950/12"
      />

      {/* Чертёжная сетка — только на широком экране: на телефоне она
          читалась бы как шум поверх фотографии */}
      <GridBackdrop className="hidden lg:block" />

      {/* Прожектор падает сверху слева, откуда начинается заголовок */}
      <Spotlight
        opacity={0.7}
        className="top-0 left-0 h-[78%] w-[92%] lg:h-full lg:w-[62%]"
      />

      {/*
        Отступы первого экрана намеренно разные по ширине экрана. На 360×640
        рейтинг и обе кнопки обязаны попадать в кадр без прокрутки, поэтому
        на телефоне вертикальные интервалы сжаты; с sm возвращается воздух.
      */}
      <div className="shell relative z-10 flex flex-1 flex-col justify-end pt-[76px] sm:pt-[104px]">
        <p className="label flex flex-wrap items-center gap-x-3 gap-y-1 text-fog-200">
          YASIRA MOTORS
          <span className="text-fog-500">/</span>
          Легковой автосервис
          <span className="text-fog-500">/</span>
          {address.city}
        </p>

        {/* Oswald узкий, поэтому кегль можно поднять: строки остаются
            компактными и не заходят глубоко на светлую часть снимка */}
        <h1 className="display mt-3.5 text-[clamp(2rem,min(7.8vw,9.8vh),5.6rem)] text-fog-100 sm:mt-5">
          <span className="block">YASIRA MOTORS</span>
          <span className="block">Ремонт и обслуживание</span>
          <span className="display-outline block">автомобилей в Актау</span>
        </h1>

        <p className="mt-4 max-w-[46ch] text-[16.5px] leading-relaxed text-fog-200 sm:mt-6">
          Диагностика, техническое обслуживание и ремонт легковых автомобилей. Сначала
          находим причину неисправности — затем согласовываем работы и стоимость.
        </p>

        <div className="mt-5 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:items-center">
          <CallButton size="lg" label={`Позвонить ${phone.display}`} source="hero" />
          <WhatsAppButton size="lg" source="hero" />
        </div>

        {/* Строка доверия без рамок: рейтинг и график, разделённые волоском */}
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 pb-4 text-fog-400 sm:mt-9 sm:pb-10">
          <a
            href={links.twogisReviews}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 transition-colors hover:text-fog-100"
          >
            <Star className="h-[13px] w-[13px] shrink-0 fill-brand-400 text-brand-400" aria-hidden="true" />
            <span className="label">
              {rating.value.toString().replace(".", ",")} · {rating.count} оценок в {rating.source}
            </span>
          </a>
          <span aria-hidden="true" className="hidden h-4 w-px bg-line-strong sm:block" />
          {/* Живой статус вместо статичных часов: человек сразу видит,
              можно ли звонить сейчас */}
          <OpenStatus variant="label" />
        </div>
      </div>

      {/* Техпаспорт: на телефоне скрыт, чтобы не съедать первый экран */}
      {/* Фон полосы почти непрозрачный: под ней проходит светлый снимок,
          а в ячейках есть мелкий текст, которому нужен предсказуемый контраст */}
      <div className="relative z-10 hidden border-t border-line bg-night-950/92 backdrop-blur-md md:block">
        <div className="shell flex items-stretch justify-between">
          <Spec label="Город" value={address.city} />
          <Spec label="Профиль" value="Легковой автосервис" />
          <Spec label="Адрес" value={address.microDistrict} />
          <Spec label="Связь" value="Звонок и WhatsApp" accent />

          <a
            href="#services"
            className="flex items-center gap-2.5 px-6 py-4 text-fog-500 transition-colors hover:text-fog-100"
          >
            <span className="label">Листайте</span>
            <ArrowDown className="h-3.5 w-3.5 animate-bounce" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}

function Spec({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="border-l border-line px-6 py-4 first:border-l-0 first:pl-0">
      <p className="label text-fog-500">{label}</p>
      <p className={`mt-1.5 text-[14px] leading-snug ${accent ? "text-brand-400" : "text-fog-200"}`}>
        {value}
      </p>
    </div>
  );
}
