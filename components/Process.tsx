import { Reveal } from "@/components/Reveal";
import { Section, SectionHead } from "@/components/Section";
import { TracingBeam } from "@/components/fx/TracingBeam";
import { process } from "@/lib/content";

/**
 * Четыре шага работы.
 *
 * На телефоне шаги стоят в столбик, и связь между ними держит вертикальная
 * линия, которая прорисовывается по мере прокрутки (TracingBeam).
 * На широком экране шаги выстроены в строку, поэтому связь горизонтальная —
 * её рисует короткая линия между номерами, а вертикальная выключается.
 */
export function Process() {
  return (
    <Section id="process" tone="alt">
      <SectionHead
        index="03"
        eyebrow="Как мы работаем"
        title="Четыре шага"
        lead="Сначала диагностика, затем согласование: объём работ и стоимость вы узнаете до начала ремонта. Начать достаточно звонком или сообщением."
      />

      <TracingBeam className="mt-11">
        <ol className="relative grid gap-7 md:grid-cols-4 md:gap-4">
          {process.map((item, i) => (
            <Reveal as="li" key={item.step} delay={Math.min(i * 70, 240)} className="relative">
              <div className="relative flex gap-4 md:block">
                <span className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-night-900 text-[13px] font-extrabold tracking-[0.04em] text-brand-400">
                  {item.step}
                </span>
                {i < process.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className="absolute top-[22px] left-[22px] hidden h-px w-[calc(100%+1rem)] bg-line md:block"
                  />
                ) : null}
                <div className="md:mt-5">
                  <h3 className="text-[16px] leading-snug text-fog-100">{item.title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-fog-400">{item.text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </ol>
      </TracingBeam>
    </Section>
  );
}
