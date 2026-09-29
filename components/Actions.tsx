import { Phone } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons";
import { phone, whatsappLink } from "@/lib/site";

const base =
  "inline-flex items-center justify-center gap-2.5 rounded-ctl font-semibold transition-[background-color,border-color,color,transform] duration-200 select-none";

/** Главное действие сайта — звонок. */
export function CallButton({
  className = "",
  label,
  size = "md",
  source,
}: {
  className?: string;
  label?: string;
  size?: "md" | "lg";
  /** Откуда нажали: hero, contacts, symptoms, final — для аналитики. */
  source?: string;
}) {
  const sizing = size === "lg" ? "h-[52px] px-6 text-[15px]" : "h-12 px-5 text-[15px]";
  return (
    <a
      href={`tel:${phone.tel}`}
      className={`${base} ${sizing} bg-brand-500 text-white shadow-lift hover:bg-brand-400 active:translate-y-px ${className}`}
      data-cta="call"
      data-track-source={source}
    >
      <Phone className="h-[18px] w-[18px] shrink-0" strokeWidth={2.4} aria-hidden="true" />
      <span className="whitespace-nowrap">{label ?? "Позвонить"}</span>
    </a>
  );
}

/** Второе действие — сообщение в WhatsApp. */
export function WhatsAppButton({
  className = "",
  label = "Написать в WhatsApp",
  size = "md",
  source,
}: {
  className?: string;
  label?: string;
  size?: "md" | "lg";
  /** Откуда нажали: hero, contacts, symptoms, final — для аналитики. */
  source?: string;
}) {
  const sizing = size === "lg" ? "h-[52px] px-6 text-[15px]" : "h-12 px-5 text-[15px]";
  return (
    <a
      href={whatsappLink()}
      target="_blank"
      rel="noopener noreferrer"
      className={`${base} ${sizing} border border-line bg-night-850 text-fog-100 hover:border-brand-500 hover:bg-night-800 active:translate-y-px ${className}`}
      data-cta="whatsapp"
      data-track-source={source}
    >
      <WhatsAppIcon className="h-[18px] w-[18px]" />
      <span>{label}</span>
    </a>
  );
}
