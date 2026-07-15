import { Hero } from "@/components/home/Hero";
import { TrustBar } from "@/components/home/TrustBar";
import { CombosDestacados } from "@/components/home/CombosDestacados";
import { PresentacionesShowcase } from "@/components/home/PresentacionesShowcase";
import { ComoSePrepara } from "@/components/shared/ComoSePrepara";
import { AntesDespues } from "@/components/home/AntesDespues";
import { ResenasCarousel } from "@/components/shared/ResenasCarousel";
import { Faq } from "@/components/shared/Faq";
import { BlogCoverflowSlider } from "@/components/blog/BlogCoverflowSlider";
import { getResenasAprobadas } from "@/lib/resenas";
import { getPublishedPosts } from "@/lib/data/blog";
import { getFaqsActivas } from "@/lib/faqs";
import { getResultadosRealesActivos } from "@/lib/resultados-reales";
import { getConfiguracionSitio } from "@/lib/data/configuracion";
import { createClient } from "@/lib/supabase/server";

const TRUSTBAR_FALLBACK = [
  "Envíos a todo el Perú",
  "Recomendado por especialistas",
  "Múltiples métodos de pago",
];

// Home — jerarquía de intención (PLAN.md sección 5.2):
// gancho visual -> confianza -> producto -> cómo se usa -> antes/después -> objeciones
export default async function Home() {
  const supabase = await createClient();
  const [resenas, posts, faqs, resultados, config] = await Promise.all([
    getResenasAprobadas(supabase),
    getPublishedPosts(),
    getFaqsActivas(supabase),
    getResultadosRealesActivos(supabase),
    getConfiguracionSitio(supabase),
  ]);

  const trustbarTextos = [
    config?.trustbar_texto_1,
    config?.trustbar_texto_2,
    config?.trustbar_texto_3,
  ].filter((t): t is string => Boolean(t));

  return (
    <>
      <Hero bannerDesktop={config?.hero_banner_desktop} bannerMobile={config?.hero_banner_mobile} />
      <TrustBar textos={trustbarTextos.length > 0 ? trustbarTextos : TRUSTBAR_FALLBACK} />
      <CombosDestacados />
      <PresentacionesShowcase />
      <div className="bg-gradient-to-b from-soft-gray to-accent">
        <ComoSePrepara fondoPropio={false} paddingInferiorReducido />
        <AntesDespues resultados={resultados} />
      </div>
      {resenas.length > 0 && (
        <section className="bg-white py-section-y">
          <div className="mx-auto max-w-container px-mobile-margin md:px-gutter">
            <h2 className="text-center font-display text-3xl font-bold text-secondary md:text-4xl">
              Lo que dicen nuestros clientes
            </h2>
            <ResenasCarousel resenas={resenas} />
          </div>
        </section>
      )}
      {posts.length > 0 && (
        <section className="bg-soft-gray py-section-y">
          <div className="mx-auto max-w-container px-mobile-margin md:px-gutter">
            <h2 className="text-center font-display text-3xl font-bold text-secondary md:text-4xl">
              Nuestro Blog
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-center font-body text-sm text-muted-foreground">
              Consejos y guías sobre nutrición y salud para tu mascota.
            </p>
            <div className="mt-10">
              <BlogCoverflowSlider posts={posts.slice(0, 8)} />
            </div>
          </div>
        </section>
      )}
      <Faq preguntas={faqs} />
    </>
  );
}
