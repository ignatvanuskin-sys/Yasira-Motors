import { Reveal } from "@/components/Reveal";
import { Section, SectionHead } from "@/components/Section";
import { GlowGroup } from "@/components/fx/GlowGroup";
import { advantages } from "@/lib/content";
import { links, rating } from "@/lib/site";

/**
 * Раскладка бенто: две широкие ячейки и две узкие.
 *
 * Широкие сделаны не «на всю строку», а парой — иначе сетка снова читалась бы
 * как обычный ряд из четырёх одинаковых карточек. Асимметрия держит внимание:
 * взгляд идёт от крупной ячейки к мелкой, а не проскакивает строку целиком.
 *
 * На среднем экране сетка двухколоночная, поэтому широкие ячейки занимают
 * строку целиком — так они остаются «широкими» относительно соседей.
 */
const CELL_SPAN = [
  "sm:col-span-2 xl:col-span-2",
  "",
  "",
  "sm:col-span-2 xl:col-span-2",
] as const;

export function Advantages() {
  return (
    <Section id="why">
      <SectionHead
        index="02"
        eyebrow="Почему YASIRA MOTORS"
        title="Четыре причины обратиться"
        lead="Коротко о том, что важно владельцу машины."
      />

      {/* Свечение под курсором ставится на группу целиком: один слушатель
          на четыре карточки вместо четырёх обработчиков */}
      <GlowGroup className="mt-10">
        <ul className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
          {advantages.map((item, i) => {
            const Icon = item.icon;
            return (
              <Reveal
                as="li"
                key={item.title}
                delay={Math.min(i * 60, 200)}
                className={`h-full ${CELL_SPAN[i] ?? ""}`}
              >
                <article
                  data-glow=""
                  className="card-surface flex h-full flex-col p-5 transition-colors duration-300 hover:border-night-700 hover:bg-night-800 md:p-6"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-ctl border border-line bg-night-800">
                    <Icon className="h-[19px] w-[19px] text-brand-400" strokeWidth={2} aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-[16.5px] leading-snug text-fog-100">{item.title}</h3>
                  <p className="mt-2.5 text-[14.5px] leading-relaxed text-fog-400">{item.text}</p>
                </article>
              </Reveal>
            );
          })}
        </ul>
      </GlowGroup>

      {/* Единственное место, где показан бейдж 2ГИС — дословно как в карточке */}
      <div className="mt-4 flex flex-col gap-4 rounded-card border border-line bg-night-900 p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
        <div>
          <p className="text-[15px] font-bold text-fog-100">
            {rating.awardBadge} · {rating.awardTitle}
          </p>
          <p className="mt-1.5 text-[14px] text-fog-400">
            Бейдж на карточке компании в 2ГИС. Рейтинг {rating.value.toString().replace(".", ",")} —{" "}
            {rating.count} оценок, сверено {rating.verifiedOn}.
          </p>
        </div>
        <a
          href={links.twogis}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-[14.5px] font-bold text-brand-400 transition-colors hover:text-brand-500"
        >
          Открыть карточку в 2ГИС →
        </a>
      </div>
    </Section>
  );
}
