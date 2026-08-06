import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import {
  HERO_DESKTOP_OPTIMIZED_WIDTH,
  HERO_MOBILE_OPTIMIZED_WIDTH,
  optimizedHeroSrc,
  resolvePrimaryHeroImages,
} from "@/lib/hero";
import { medirImagenes } from "@/lib/image-size";
import { TrustBar } from "@/components/home/TrustBar";
import { CombosDestacados } from "@/components/home/CombosDestacados";
import { BandanaShowcase } from "@/components/home/BandanaShowcase";
import { PresentacionesShowcase } from "@/components/home/PresentacionesShowcase";
import { ComoSePrepara } from "@/components/shared/ComoSePrepara";
// import { AntesDespues } from "@/components/home/AntesDespues"; // desactivado temporalmente
import { ResenasCarousel } from "@/components/shared/ResenasCarousel";
import { Faq } from "@/components/shared/Faq";
import { BlogCoverflowSlider } from "@/components/blog/BlogCoverflowSlider";
import {
  getBannersHeroPublicos,
  getConfiguracionPublica,
  getFaqsPublicas,
  getPostsPublicos,
  getResenasCarrusel,
} from "@/lib/data/publico";
import { siteConfig } from "@/lib/site-config";

// Sin esto, la home no declara su propio canonical (solo hereda title/
// description de app/layout.tsx) — con parámetros de tracking (?utm_source=…)
// Google podía tratar cada variante de la URL como una página distinta.
export const metadata: Metadata = {
  alternates: { canonical: siteConfig.siteUrl },
};

// La home se prerenderiza y se regenera cada 60 s (o antes, si alguien guarda
// algo en /admin — ver lib/data/publico.ts). Antes era dinámica: se renderizaba
// entera, con sus consultas a Supabase, en CADA visita de CADA usuario. Eso es
// lo que el CDN reportaba como `x-hcdn-cache-status: DYNAMIC` y 1,2 s de tiempo
// de origen, y además impedía que el <Link> del logo prefetcheara nada.
export const revalidate = 60;

const TRUSTBAR_FALLBACK = [
  "Envíos a todo el Perú",
  "Recomendado por especialistas",
  "Múltiples métodos de pago",
];

// Home — jerarquía de intención (PLAN.md sección 5.2):
// gancho visual -> confianza -> producto -> cómo se usa -> antes/después -> objeciones
export default async function Home() {
  // Sin `getResultadosRealesActivos`: alimentaba a <AntesDespues>, que está
  // desactivado más abajo. Era una consulta a Supabase en cada carga de la home
  // cuyo resultado no se renderizaba en ningún lado.
  const [resenas, posts, faqs, config, heroBanners] = await Promise.all([
    getResenasCarrusel(),
    getPostsPublicos(),
    getFaqsPublicas(),
    getConfiguracionPublica(),
    getBannersHeroPublicos(),
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

  // Tamaño real de cada imagen del hero, para que el <img> pueda declarar
  // width/height y reservar su espacio antes de descargarse (ver
  // lib/image-size.ts). Sin esto el banner aparecía de golpe y empujaba toda
  // la home hacia abajo: el CLS de 0.546 que reportaba PageSpeed en mobile.
  const dimensionesHero = await medirImagenes([
    heroPrimario.desktop,
    heroPrimario.mobile,
    ...heroBanners.flatMap((b) => [b.imagen, b.imagen_mobile]),
  ]);

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
        dimensiones={dimensionesHero}
      />
      <TrustBar textos={trustbarTextos.length > 0 ? trustbarTextos : TRUSTBAR_FALLBACK} />
      <CombosDestacados />
      <BandanaShowcase />
      <PresentacionesShowcase />
      <div className="bg-gradient-to-b from-soft-gray to-accent">
        <ComoSePrepara fondoPropio={false} paddingSuperiorReducido paddingInferiorReducido />
        {/* <AntesDespues /> desactivado temporalmente. Para reactivarlo hay que
            volver a traer getResultadosPublicos() de lib/data/publico.ts. */}
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
