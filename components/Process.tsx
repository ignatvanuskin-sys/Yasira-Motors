import { Reveal } from "@/components/Reveal";
import { Section, SectionHead } from "@/components/Section";
import { process } from "@/lib/content";

export function Process() {
  return (
    <Section id="process" tone="alt">
      <SectionHead
        index="03"
        eyebrow="Как мы работаем"
        title="Четыре шага"
        lead="К работам приступаем после согласования — без онлайн-записи, достаточно звонка или сообщения."
      />

      <ol className="mt-11 grid gap-7 md:grid-cols-4 md:gap-4">
        {process.map((item, i) => (
          <Reveal as="li" key={item.step} delay={Math.min(i * 70, 240)} className="relative">
            <div className="relative flex gap-4 md:block">
              <span className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-night-900 text-[13px] font-extrabold tracking-[0.04em] text-brand-400">
                {item.step}
              </span>
              {i < process.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="absolute top-[21px] left-[22px] h-[calc(100%+1.75rem)] w-px bg-line md:top-[22px] md:left-[22px] md:h-px md:w-[calc(100%+1rem)]"
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
    </Section>
  );
}
