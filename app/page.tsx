import { Advantages } from "@/components/Advantages";
import { Contacts } from "@/components/Contacts";
import { FinalCta } from "@/components/FinalCta";
import { Gallery } from "@/components/Gallery";
import { Hero } from "@/components/Hero";
import { Marquee } from "@/components/Marquee";
import { Process } from "@/components/Process";
import { Reviews } from "@/components/Reviews";
import { Services } from "@/components/Services";
import { SymptomChips } from "@/components/SymptomChips";

/**
 * Порядок секций — под сценарий «нашёл в 2ГИС → сказал, что беспокоит →
 * понял услуги → увидел сервис → прочитал отзывы → позвонил».
 *
 * «Что беспокоит?» стоит сразу после первого экрана: это самый короткий путь
 * к обращению, а в середине страницы его находили единицы. Фон секций
 * чередуется — это даёт ритм и помогает ориентироваться при прокрутке.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <Marquee />
      <SymptomChips />
      <Services />
      <Advantages />
      <Process />
      <Gallery />
      <Reviews />
      <Contacts />
      <FinalCta />
    </>
  );
}
