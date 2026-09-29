import { CallButton, WhatsAppButton } from "@/components/Actions";
import { WhatsAppIcon } from "@/components/icons";
import { Section } from "@/components/Section";
import { symptoms } from "@/lib/content";
import { phone, whatsappLink } from "@/lib/site";

/**
 * «Что беспокоит?» — самый короткий путь к обращению, поэтому блок стоит
 * сразу после первого экрана, а не в середине страницы.
 *
 * Человек не обязан знать, какая услуга ему нужна: он выбирает симптом и
 * получает открытый WhatsApp с готовым первым сообщением. Это не запись и
 * не форма — ни даты, ни имени, ни телефона; просто заготовленный текст,
 * который снимает главный барьер «не знаю, с чего начать».
 */
export function SymptomChips() {
  return (
    <Section id="symptoms">
      <div className="rounded-card border border-line bg-night-850 p-5 md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="label text-brand-400">Что беспокоит?</p>
            <p className="mt-2.5 max-w-[52ch] text-[15px] leading-relaxed text-fog-300">
              Выберите, что происходит с машиной — откроется WhatsApp с готовым сообщением.
              Или просто позвоните: подскажем, с чего начать.
            </p>

            {/* На телефоне две колонки: девять чипов в столбик съедали экран */}
            <ul className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              {symptoms.map((symptom) => (
                <li key={symptom.label} className="min-w-0">
                  <a
                    href={whatsappLink(phone.whatsapp, symptom.text)}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-track="symptom_select"
                    data-track-source="symptoms"
                    data-track-topic={symptom.label}
                    className="flex h-full min-h-[48px] w-full items-center gap-2 rounded-chip border border-line bg-night-800 px-3.5 py-2 text-[13.5px] font-medium text-fog-200 transition-colors hover:border-brand-500 hover:bg-night-750 hover:text-fog-100 sm:inline-flex sm:w-auto"
                  >
                    <WhatsAppIcon className="h-3.5 w-3.5 shrink-0 text-brand-400" />
                    {symptom.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
            <CallButton label={`Позвонить ${phone.display}`} source="symptoms" />
            <WhatsAppButton source="symptoms" />
          </div>
        </div>
      </div>
    </Section>
  );
}
