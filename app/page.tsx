import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import {
  HERO_DESKTOP_OPTIMIZED_WIDTH,
  HERO_MOBILE_OPTIMIZED_WIDTH,
  optimizedHeroSrc,
  resolvePrimaryHeroImages,
} from "@/lib/hero";
import { TrustBar } from "@/components/home/TrustBar";
import { CombosDestacados } from "@/components/home/CombosDestacados";
import { BandanaShowcase } from "@/components/home/BandanaShowcase";
import { PresentacionesShowcase } from "@/components/home/PresentacionesShowcase";
import { ComoSePrepara } from "@/components/shared/ComoSePrepara";
// import { AntesDespues } from "@/components/home/AntesDespues"; // desactivado temporalmente
import { ResenasCarousel } from "@/components/shared/ResenasCarousel";
import { Faq } from "@/components/shared/Faq";
import { BlogCoverflowSlider } from "@/components/blog/BlogCoverflowSlider";
import { getResenasAprobadas } from "@/lib/resenas";
import { getPublishedPosts } from "@/lib/data/blog";
import { getFaqsActivas } from "@/lib/faqs";
import { getResultadosRealesActivos } from "@/lib/resultados-reales";
import { getConfiguracionSitio } from "@/lib/data/configuracion";
import { siteConfig } from "@/lib/site-config";

// Sin esto, la home no declara su propio canonical (solo hereda title/
// description de app/layout.tsx) — con parámetros de tracking (?utm_source=…)
// Google podía tratar cada variante de la URL como una página distinta.
export const metadata: Metadata = {
  alternates: { canonical: siteConfig.siteUrl },
};
import { getBannersHero } from "@/lib/banners";
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
  const [resenas, posts, faqs, resultados, config, heroBanners] = await Promise.all([
    getResenasAprobadas(supabase),
    getPublishedPosts(),
    getFaqsActivas(supabase),
    getResultadosRealesActivos(supabase),
    getConfiguracionSitio(supabase),
    getBannersHero(supabase),
  ]);

  const trustbarTextos = [
    config?.trustbar_texto_1,
    config?.trustbar_texto_2,
    config?.trustbar_texto_3,
  ].filter((t): t is string => Boolean(t));

  // Precarga la imagen del primer slide del hero (probable elemento LCP de la
  // home) para que el navegador empiece a descargarla en paralelo al HTML,
  // sin esperar a que cargue/hidrate el JS del componente. El href debe ser
  // BYTE-IGUAL al `src` que finalmente pide el <img> en Hero.tsx (misma
  // llamada a optimizedHeroSrc con el mismo ancho) — si no coinciden, el
  // navegador no reconoce el preload como el mismo recurso y lo descarta.
  // Dos <link> con `media` porque el hero usa una imagen distinta en mobile
  // vs. desktop (mismo breakpoint sm: 640px que components/home/Hero.tsx).
  const heroPrimario = resolvePrimaryHeroImages(
    heroBanners,
    config?.hero_banner_desktop,
    config?.hero_banner_mobile
  );

  return (
    <>
      <link
        rel="preload"
        as="image"
        href={optimizedHeroSrc(heroPrimario.mobile, HERO_MOBILE_OPTIMIZED_WIDTH)}
        media="(max-width: 639px)"
        fetchPriority="high"
      />
      <link
        rel="preload"
        as="image"
        href={optimizedHeroSrc(heroPrimario.desktop, HERO_DESKTOP_OPTIMIZED_WIDTH)}
        media="(min-width: 640px)"
        fetchPriority="high"
      />
      {/* El hero es puramente visual (banners sin texto) — este h1 le da a la
          página el heading principal que exige SEO/a11y sin tocar el diseño. */}
      <h1 className="sr-only">SUPLEVET — Nutrición para tus mascotas</h1>
      <Hero
        banners={heroBanners}
        bannerDesktop={config?.hero_banner_desktop}
        bannerMobile={config?.hero_banner_mobile}
      />
      <TrustBar textos={trustbarTextos.length > 0 ? trustbarTextos : TRUSTBAR_FALLBACK} />
      <CombosDestacados />
      <BandanaShowcase />
      <PresentacionesShowcase />
      <div className="bg-gradient-to-b from-soft-gray to-accent">
        <ComoSePrepara fondoPropio={false} paddingSuperiorReducido paddingInferiorReducido />
        {/* <AntesDespues resultados={resultados} /> desactivado temporalmente */}
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
        <section className="bg-soft-gray pb-7 pt-section-y">
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
      <Faq preguntas={faqs} paddingSuperiorReducido />
    </>
  );
}
