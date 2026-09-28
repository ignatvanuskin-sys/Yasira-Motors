import { Advantages } from "@/components/Advantages";
import { Contacts } from "@/components/Contacts";
import { FinalCta } from "@/components/FinalCta";
import { Gallery } from "@/components/Gallery";
import { Hero } from "@/components/Hero";
import { Marquee } from "@/components/Marquee";
import { Process } from "@/components/Process";
import { Reviews } from "@/components/Reviews";
import { Services } from "@/components/Services";

/**
 * Порядок секций — под сценарий «нашёл в 2ГИС → понял услуги → увидел сервис
 * → прочитал отзывы → позвонил». Секции пронумерованы как разделы документа,
 * фон чередуется: это даёт ритм и помогает ориентироваться при прокрутке.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <Marquee />
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
