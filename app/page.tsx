import { Hero } from "@/components/home/Hero";
import { TrustBar } from "@/components/home/TrustBar";
import { CombosDestacados } from "@/components/home/CombosDestacados";
import { PresentacionesShowcase } from "@/components/home/PresentacionesShowcase";
import { ComoSePrepara } from "@/components/shared/ComoSePrepara";
import { AntesDespues } from "@/components/home/AntesDespues";
import { Faq } from "@/components/shared/Faq";

// Home — jerarquía de intención (PLAN.md sección 5.2):
// gancho visual -> confianza -> producto -> cómo se usa -> antes/después -> objeciones
export default function Home() {
  return (
    <>
      <Hero />
      <TrustBar />
      <CombosDestacados />
      <PresentacionesShowcase />
      <ComoSePrepara />
      <AntesDespues />
      <Faq />
    </>
  );
}
