import { Advantages } from "@/components/Advantages";
import { Contacts } from "@/components/Contacts";
import { FinalCta } from "@/components/FinalCta";
import { Gallery } from "@/components/Gallery";
import { Hero } from "@/components/Hero";
import { Process } from "@/components/Process";
import { Reviews } from "@/components/Reviews";
import { Services } from "@/components/Services";

/**
 * Порядок секций — под сценарий «нашёл в 2ГИС → понял услуги → увидел сервис
 * → прочитал отзывы → позвонил». Никаких лишних блоков.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
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
