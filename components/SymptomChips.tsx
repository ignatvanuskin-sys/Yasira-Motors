import { CallButton, WhatsAppButton } from "@/components/Actions";
import { WhatsAppIcon } from "@/components/icons";
import { symptoms } from "@/lib/content";
import { phone, whatsappLink } from "@/lib/site";

/**
 * «Что беспокоит?» — самый короткий путь к обращению.
 *
 * Человек не обязан знать, какая услуга ему нужна: он выбирает симптом и
 * получает открытый WhatsApp с готовым первым сообщением. Это не запись и
 * не форма — ни даты, ни имени, ни телефона; просто заготовленный текст,
 * который снимает главный барьер «не знаю, с чего начать».
 */
export function SymptomChips() {
  return (
    <div className="mt-8 rounded-card border border-line bg-night-850 p-5 md:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="label text-brand-400">Что беспокоит?</p>
          <p className="mt-2.5 max-w-[52ch] text-[15px] leading-relaxed text-fog-300">
            Выберите, что происходит с машиной — откроется WhatsApp с готовым сообщением.
            Или просто позвоните: подскажем, с чего начать.
          </p>

          <ul className="mt-4 flex flex-wrap gap-2">
            {symptoms.map((symptom) => (
              <li key={symptom.label}>
                <a
                  href={whatsappLink(phone.whatsapp, symptom.text)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-chip border border-line bg-night-800 px-3.5 text-[13.5px] font-medium text-fog-200 transition-colors hover:border-brand-500 hover:bg-night-750 hover:text-fog-100"
                >
                  <WhatsAppIcon className="h-3.5 w-3.5 shrink-0 text-brand-400" />
                  {symptom.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
          <CallButton label={`Позвонить ${phone.display}`} />
          <WhatsAppButton />
        </div>
      </div>
    </div>
  );
}
