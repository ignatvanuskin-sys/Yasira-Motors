import { Logo } from "@/components/Logo";
import {
  address,
  company,
  email,
  links,
  nav,
  phone,
  phones,
  scheduleSummary,
  whatsappLink,
} from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-line bg-night-900 py-12 md:py-14">
      <div className="shell">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo stacked tone="light" />
            <p className="mt-4 max-w-[36ch] text-[14.5px] leading-relaxed text-fog-400">
              {company.kind} в Актау. {company.tagline}.
            </p>
            <p className="mt-4 text-[13px] text-fog-500">
              Входит в группу компаний Yasira.{" "}
              <a
                href={links.groupSite}
                target="_blank"
                rel="noopener noreferrer"
                className="text-fog-400 underline decoration-night-700 underline-offset-2 hover:text-fog-200"
              >
                yasira.kz
              </a>
            </p>
          </div>

          <nav aria-labelledby="footer-nav-heading">
            <h2 id="footer-nav-heading" className="text-[12px] font-bold tracking-[0.08em] text-fog-500 uppercase">
              Навигация
            </h2>
            <ul className="mt-4 space-y-2.5">
              {nav.map((item) => (
                <li key={item.href}>
                  <a
                    href={`/${item.href}`}
                    className="text-[14.5px] text-fog-300 transition-colors hover:text-fog-100"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-[12px] font-bold tracking-[0.08em] text-fog-500 uppercase">
              Контакты
            </h2>
            <ul className="mt-3 text-[14.5px] text-fog-300">
              <li className="flex min-h-[44px] items-center">{address.microDistrict}, Актау</li>
              <li>
                <a
                  href={`tel:${phone.tel}`}
                  className="inline-flex min-h-[44px] items-center font-semibold transition-colors hover:text-fog-100"
                >
                  {phone.display}
                </a>
              </li>
              <li>
                  <a
                    href={whatsappLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[44px] items-center transition-colors hover:text-fog-100"
                  >
                    WhatsApp: {phone.display}
                  </a>
              </li>
              <li>
                <a
                  href={`mailto:${email.general}`}
                  className="inline-flex min-h-[44px] items-center transition-colors hover:text-fog-100"
                >
                  {email.general}
                </a>
              </li>
              <li className="flex min-h-[44px] items-center text-[13.5px] text-fog-400">
                {scheduleSummary}
              </li>
              <li className="pt-1">
                <a
                  href={links.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-fog-400 transition-colors hover:text-fog-200"
                >
                  Instagram
                </a>
                <span className="mx-2 text-night-700">·</span>
                <a
                  href={links.twogis}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-fog-400 transition-colors hover:text-fog-200"
                >
                  2ГИС
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-line-soft pt-6 md:flex-row md:items-center md:justify-between">
          <p className="text-[13px] text-fog-500">
            © {new Date().getFullYear()} {company.name}. Актау, Казахстан.
          </p>
          <p className="text-[12.5px] text-fog-500">
            Рейтинг, отзывы, фотографии и график работы — по данным 2ГИС. Информация о группе
            компаний — по данным yasira.kz.
          </p>
        </div>
      </div>
    </footer>
  );
}
