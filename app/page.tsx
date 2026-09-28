import { Advantages } from "@/components/Advantages";
import { Contacts } from "@/components/Contacts";
import { FinalCta } from "@/components/FinalCta";
import { Gallery } from "@/components/Gallery";
import { Hero } from "@/components/Hero";
import { Process } from "@/components/Process";
import { Reviews } from "@/components/Reviews";
import { Services } from "@/components/Services";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Services />
      <Advantages />
      <Reviews />
      <Process />
      <Gallery />
      <Contacts />
      <FinalCta />
    </>
  );
}
