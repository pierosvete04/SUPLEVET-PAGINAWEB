import type { Metadata } from "next";
import Image from "next/image";
import {
  Award,
  Beaker,
  Eye,
  Flag,
  Heart,
  Leaf,
  Lightbulb,
  Shield,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { PageBreadcrumbs } from "@/components/shared/PageBreadcrumbs";
import { HuellasFondo } from "@/components/shared/HuellasFondo";
import { TestimoniosCarousel } from "@/components/nosotros/TestimoniosCarousel";
import { ResenasCarousel } from "@/components/shared/ResenasCarousel";
import { BlogCoverflowSlider } from "@/components/blog/BlogCoverflowSlider";
import { getTestimoniosActivos } from "@/lib/testimonios";
import { getResenasAprobadas } from "@/lib/resenas";
import { getPublishedPosts } from "@/lib/data/blog";
import { getValoresActivos } from "@/lib/valores-nosotros";
import { getConfiguracionSitio } from "@/lib/data/configuracion";
import { createClient } from "@/lib/supabase/server";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Quiénes somos",
  description:
    "Conoce la historia, misión y visión de Suplevet, marca peruana de nutrición clínica veterinaria desarrollada por Nutrova for Pets.",
  alternates: { canonical: `${siteConfig.siteUrl}/nosotros` },
};

// Debe coincidir con ICONOS_DISPONIBLES en components/admin/nosotros/ValorForm.tsx
const ICONOS: Record<string, LucideIcon> = { Beaker, Heart, Lightbulb, Shield, Star, Award, Leaf, Users };

// Recortes orgánicos para las fotos — sustituyen al rectángulo y dan el aire
// editorial de las láminas de marca. Dos variantes para que dos fotos en la
// misma página no se lean como calcadas.
const BLOB_A = "rounded-[58%_42%_47%_53%/48%_58%_42%_52%]";
const BLOB_B = "rounded-[44%_56%_60%_40%/56%_44%_56%_44%]";

export default async function NosotrosPage() {
  const supabase = await createClient();
  const [testimonios, resenas, posts, valores, config] = await Promise.all([
    getTestimoniosActivos(supabase),
    getResenasAprobadas(supabase),
    getPublishedPosts(),
    getValoresActivos(supabase),
    getConfiguracionSitio(supabase),
  ]);

  return (
    <div>
      {/* Hero asimétrico: el texto deja de estar centrado sobre una foto
          atenuada y comparte peso con la imagen, ya recortada en orgánico. */}
      <section className="relative overflow-hidden bg-gradient-to-br from-secondary to-[#0f1b2e]">
        <PageBreadcrumbs items={[{ label: "Nosotros" }]} overlay />
        <HuellasFondo id="huellas-hero" className="text-white/[0.05]" />
        <div className="pointer-events-none absolute -right-24 top-1/3 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-container items-center gap-8 px-mobile-margin pb-10 pt-14 md:grid-cols-[1.05fr_0.95fr] md:gap-gutter md:px-gutter md:pb-16 md:pt-16">
          <ScrollReveal>
            <p className="font-impact text-xl leading-none tracking-wide text-sky md:text-3xl">
              SOBRE NOSOTROS
            </p>
            <h1 className="mt-3 font-display text-2xl font-bold leading-tight text-white md:text-[2.6rem]">
              {config?.nosotros_hero_titulo}
            </h1>
          </ScrollReveal>

          {config?.nosotros_hero_imagen && (
            <ScrollReveal delay={0.15}>
              <div
                className={`relative mx-auto aspect-square w-full max-w-[220px] overflow-hidden shadow-2xl sm:max-w-xs md:max-w-none ${BLOB_A}`}
              >
                <Image
                  src={config.nosotros_hero_imagen}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 60vw, 40vw"
                  priority
                />
              </div>
            </ScrollReveal>
          )}
        </div>
      </section>

      {/* Cita + Origen: la frase abre el relato y el origen lo desarrolla, en la
          misma sección para que se lean como una sola voz. */}
      <section className="relative overflow-hidden bg-white py-section-y">
        <HuellasFondo id="huellas-origen" className="text-secondary/[0.04]" />

        <div className="relative mx-auto max-w-container px-mobile-margin md:px-gutter">
          <ScrollReveal className="mx-auto max-w-3xl text-center">
            <p className="font-display text-2xl font-bold leading-snug text-secondary md:text-4xl">
              &ldquo;{config?.nosotros_quote}&rdquo;
            </p>
          </ScrollReveal>

          <ScrollReveal className="mx-auto mt-16 max-w-3xl border-t border-border pt-12 text-center">
            <p className="font-impact text-sm tracking-widest text-vitality-orange-ink">01 — ORIGEN</p>
            <h2 className="mt-2 font-impact text-4xl leading-none tracking-wide text-secondary md:text-6xl">
              Nuestro Origen
            </h2>
            <p className="mx-auto mt-5 max-w-2xl font-body leading-relaxed text-muted-foreground md:text-lg">
              {config?.nosotros_origen_texto}
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Misión y Visión como dos paneles de peso equivalente, con el titular
          condensado en grande — el lenguaje de las láminas de marca. */}
      <section className="bg-soft-gray py-section-y">
        <div className="mx-auto grid max-w-container gap-gutter px-mobile-margin md:grid-cols-2 md:px-gutter">
          {/* Paneles complementarios en vez de gemelos: navy con titular
              naranja, y celeste con titular navy. El naranja de marca solo
              aparece como texto sobre el navy —sobre blanco no llega ni al
              mínimo de titular— y como superficie no lleva texto encima. */}
          <ScrollReveal className="relative overflow-hidden rounded-[var(--radius-card)] bg-secondary p-8 text-white md:p-10">
            <HuellasFondo id="huellas-mision" className="text-white/10" />
            <div className="relative">
              <Flag className="h-8 w-8 text-primary" strokeWidth={1.75} aria-hidden />
              <p className="mt-4 font-impact text-sm tracking-widest text-white/70">02 — MISIÓN</p>
              <h2 className="font-impact text-4xl leading-none tracking-wide text-primary md:text-5xl">
                Nuestra Misión
              </h2>
              <p className="mt-4 font-body leading-relaxed text-white/90">
                {config?.nosotros_mision_texto}
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal
            delay={0.1}
            className="relative overflow-hidden rounded-[var(--radius-card)] bg-accent p-8 text-secondary md:p-10"
          >
            <HuellasFondo id="huellas-vision" className="text-secondary/10" />
            <div className="relative">
              <Eye className="h-8 w-8" strokeWidth={1.75} aria-hidden />
              <p className="mt-4 font-impact text-sm tracking-widest text-secondary/90">
                03 — VISIÓN
              </p>
              <h2 className="font-impact text-4xl leading-none tracking-wide md:text-5xl">
                Nuestra Visión
              </h2>
              <p className="mt-4 font-body leading-relaxed text-secondary/90">
                {config?.nosotros_vision_texto}
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {valores.length > 0 && (
        <section className="relative overflow-hidden bg-white py-section-y">
          <HuellasFondo id="huellas-valores" className="text-secondary/[0.04]" />
          <div className="relative mx-auto max-w-container px-mobile-margin md:px-gutter">
            <ScrollReveal className="text-center">
              <p className="font-impact text-sm tracking-widest text-vitality-orange-ink">
                LO QUE NOS SOSTIENE
              </p>
              <h2 className="mt-2 font-impact text-4xl leading-none tracking-wide text-secondary md:text-6xl">
                Nuestros Valores
              </h2>
            </ScrollReveal>

            <div className="mt-12 grid grid-cols-1 gap-gutter md:grid-cols-3">
              {valores.map(({ id, icono, titulo, texto }, i) => {
                const Icon = ICONOS[icono] ?? Heart;
                return (
                  <ScrollReveal
                    key={id}
                    delay={i * 0.1}
                    className="group relative overflow-hidden rounded-[var(--radius-card)] border border-border bg-white p-7 transition-shadow duration-300 hover:shadow-lg"
                  >
                    {/* Número como marca de agua: da jerarquía y ritmo sin
                        añadir otro texto que competir por atención. */}
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute -top-4 right-1 font-impact text-8xl leading-none text-secondary/[0.07]"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="relative flex h-14 w-14 items-center justify-center rounded-[var(--radius-card)] bg-accent/30 text-secondary">
                      <Icon className="h-7 w-7" strokeWidth={1.5} aria-hidden />
                    </span>
                    <h3 className="relative mt-5 font-impact text-2xl leading-tight tracking-wide text-secondary">
                      {titulo}
                    </h3>
                    <p className="relative mt-2 font-body text-sm leading-relaxed text-muted-foreground">
                      {texto}
                    </p>
                  </ScrollReveal>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Antes era una foto con el texto encima, que obligaba a oscurecerla para
          que se leyera. Ahora la foto se recorta en orgánico y el texto vive a
          su lado: la imagen se ve entera y el titular no depende de un velo. */}
      {config?.nosotros_overlay_imagen && (
        <section className="relative overflow-hidden bg-soft-gray py-section-y">
          <HuellasFondo id="huellas-compromiso" className="text-secondary/[0.04]" />
          <div className="relative mx-auto grid max-w-container items-center gap-10 px-mobile-margin md:grid-cols-2 md:gap-gutter md:px-gutter">
            <ScrollReveal>
              <div className={`relative aspect-square overflow-hidden shadow-xl ${BLOB_B}`}>
                <Image
                  src={config.nosotros_overlay_imagen}
                  alt="Perro feliz junto a Suplevet"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 90vw, 45vw"
                />
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <h2 className="font-impact text-4xl leading-none tracking-wide text-secondary md:text-6xl">
                {config.nosotros_overlay_titulo}
              </h2>
              <p className="mt-4 font-body leading-relaxed text-muted-foreground md:text-lg">
                {config.nosotros_overlay_texto}
              </p>
            </ScrollReveal>
          </div>
        </section>
      )}

      <section className="bg-white py-section-y">
        <div className="mx-auto max-w-container px-mobile-margin md:px-gutter">
          <ScrollReveal>
            <h2 className="text-center font-display text-2xl font-bold text-secondary md:text-3xl">
              Lo que dicen de nosotros
            </h2>
          </ScrollReveal>
          <TestimoniosCarousel testimonios={testimonios} />
        </div>
      </section>

      {resenas.length > 0 && (
        <section className="bg-soft-gray py-section-y">
          <div className="mx-auto max-w-container px-mobile-margin md:px-gutter">
            <ScrollReveal>
              <h2 className="text-center font-display text-2xl font-bold text-secondary md:text-3xl">
                Reseñas de nuestros clientes
              </h2>
            </ScrollReveal>
            <ResenasCarousel resenas={resenas} />
          </div>
        </section>
      )}

      {posts.length > 0 && (
        <section className="bg-white py-section-y">
          <div className="mx-auto max-w-container px-mobile-margin md:px-gutter">
            <ScrollReveal>
              <h2 className="text-center font-display text-2xl font-bold text-secondary md:text-3xl">
                Nuestro Blog
              </h2>
            </ScrollReveal>
            <div className="mt-10">
              <BlogCoverflowSlider posts={posts.slice(0, 8)} />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
