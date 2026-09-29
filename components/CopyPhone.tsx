"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { phone } from "@/lib/site";

/**
 * На десктопе ссылка tel: часто ничего не делает: звонок идёт с телефона, а за
 * компьютером человеку нужен номер, чтобы набрать его или вставить в мессенджер.
 * Кнопка копирует номер в формате как на странице и подтверждает действие
 * словом, а не только сменой цвета.
 */
export function CopyPhone({ className = "" }: { className?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(phone.display);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Буфер обмена недоступен: не показываем ложное «Скопировано»
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      data-track="copy_phone"
      className={`inline-flex h-[52px] items-center justify-center gap-2 rounded-ctl border border-line bg-night-850 px-5 text-[14.5px] font-semibold text-fog-200 transition-colors hover:border-brand-500 hover:text-fog-100 ${className}`}
    >
      {copied ? (
        <Check className="h-4 w-4 text-brand-400" aria-hidden="true" />
      ) : (
        <Copy className="h-4 w-4 text-fog-400" aria-hidden="true" />
      )}
      <span>{copied ? "Скопировано" : "Копировать номер"}</span>
    </button>
  );
}
