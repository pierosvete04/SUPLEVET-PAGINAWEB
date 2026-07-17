import type { Metadata } from "next";
import Image from "next/image";
import {
  Award,
  Beaker,
  Compass,
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
import { TestimoniosCarousel } from "@/components/nosotros/TestimoniosCarousel";
import { ResenasCarousel } from "@/components/shared/ResenasCarousel";
import { ImagenConOverlay } from "@/components/shared/ImagenConOverlay";
import { BlogCoverflowSlider } from "@/components/blog/BlogCoverflowSlider";
import { getTestimoniosActivos } from "@/lib/testimonios";
import { getResenasAprobadas } from "@/lib/resenas";
import { getPublishedPosts } from "@/lib/data/blog";
import { getValoresActivos } from "@/lib/valores-nosotros";
import { getConfiguracionSitio } from "@/lib/data/configuracion";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Quiénes somos",
  description:
    "Conoce la historia, misión y visión de Suplevet, marca peruana de nutrición clínica veterinaria desarrollada por Nutrova for Pets.",
};

// Debe coincidir con ICONOS_DISPONIBLES en components/admin/nosotros/ValorForm.tsx
const ICONOS: Record<string, LucideIcon> = { Beaker, Heart, Lightbulb, Shield, Star, Award, Leaf, Users };

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
      <section className="relative flex min-h-[50vh] items-center justify-center overflow-hidden bg-secondary text-center">
        <PageBreadcrumbs items={[{ label: "Nosotros" }]} overlay />
        {config?.nosotros_hero_imagen && (
          <Image src={config.nosotros_hero_imagen} alt="" fill className="object-cover opacity-40" sizes="100vw" />
        )}
        <div className="absolute inset-0 bg-secondary/60" />
        <ScrollReveal className="relative mx-auto max-w-2xl px-mobile-margin">
          <p className="font-impact text-sky text-sm tracking-wide">SOBRE NOSOTROS</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-white md:text-5xl">
            {config?.nosotros_hero_titulo}
          </h1>
        </ScrollReveal>
      </section>

      {/* La frase vive DENTRO de la misma sección que el mapa Origen -> Misión
          -> Visión (mismo fondo, sin corte entre ambas) — así se lee como la
          apertura del recorrido, no como un bloque suelto sin relación con lo
          de abajo. Línea punteada decorativa (solo desktop) conecta los tres
          nodos del mapa. */}
      <section className="relative overflow-hidden bg-white py-section-y">
        <div className="mx-auto max-w-container px-mobile-margin md:px-gutter">
          <ScrollReveal className="text-center">
            <p className="mx-auto max-w-xl font-display text-xl font-bold text-secondary md:text-2xl">
              &ldquo;{config?.nosotros_quote}&rdquo;
            </p>
          </ScrollReveal>

          <div className="relative mt-16 md:mt-20">
            <svg
              viewBox="0 0 1000 520"
              preserveAspectRatio="none"
              className="pointer-events-none absolute inset-0 hidden h-full w-full md:block"
              aria-hidden="true"
            >
              <path
                d="M 200 140 C 300 220, 140 280, 240 380 C 300 440, 560 440, 680 260"
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth="2"
                strokeDasharray="8 10"
                strokeLinecap="round"
              />
            </svg>

            <ScrollReveal className="relative z-10 flex items-start gap-4 md:w-[58%]">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                <Compass className="h-6 w-6" strokeWidth={1.75} />
              </span>
              <div>
                <p className="font-impact text-xs tracking-wide text-secondary/50">01 — ORIGEN</p>
                <h3 className="mt-1 font-display text-xl font-bold text-secondary">
                  Nuestro Origen
                </h3>
                <p className="mt-2 font-body text-sm text-muted-foreground">
                  {config?.nosotros_origen_texto}
                </p>
              </div>
            </ScrollReveal>

            <div className="relative z-10 mt-10 grid grid-cols-1 gap-6 md:mt-4 md:grid-cols-2 md:gap-10">
              <ScrollReveal
                delay={0.1}
                className="rounded-[var(--radius-card)] bg-primary p-6 text-white shadow-sm md:mt-28"
              >
                <Flag className="h-7 w-7" strokeWidth={1.75} />
                <p className="mt-3 font-impact text-xs tracking-wide text-white/70">02 — MISIÓN</p>
                <h3 className="font-display text-lg font-bold">Nuestra Misión</h3>
                <p className="mt-2 font-body text-sm text-white/90">
                  {config?.nosotros_mision_texto}
                </p>
              </ScrollReveal>

              <ScrollReveal
                delay={0.2}
                className="flex flex-col justify-center rounded-[var(--radius-card)] bg-accent p-6 text-secondary shadow-sm"
              >
                <Eye className="h-7 w-7" strokeWidth={1.75} />
                <p className="mt-3 font-impact text-xs tracking-wide text-secondary/60">
                  03 — VISIÓN
                </p>
                <h3 className="font-display text-lg font-bold">Nuestra Visión</h3>
                <p className="mt-2 font-body text-sm text-secondary/80">
                  {config?.nosotros_vision_texto}
                </p>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {valores.length > 0 && (
        <section className="bg-soft-gray py-section-y">
          <div className="mx-auto max-w-container px-mobile-margin md:px-gutter">
            <ScrollReveal>
              <h2 className="text-center font-display text-2xl font-bold text-secondary md:text-3xl">
                Nuestros Valores
              </h2>
            </ScrollReveal>
            <div className="mt-10 grid grid-cols-1 gap-gutter md:grid-cols-3">
              {valores.map(({ id, icono, titulo, texto }, i) => {
                const Icon = ICONOS[icono] ?? Heart;
                return (
                  <ScrollReveal
                    key={id}
                    delay={i * 0.1}
                    className="rounded-[var(--radius-card)] bg-white p-6 text-center shadow-sm"
                  >
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/30 text-secondary">
                      <Icon className="h-7 w-7" strokeWidth={1.5} />
                    </div>
                    <h3 className="mt-4 font-display text-lg font-bold text-secondary">{titulo}</h3>
                    <p className="mt-2 font-body text-sm text-muted-foreground">{texto}</p>
                  </ScrollReveal>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {config?.nosotros_overlay_imagen && (
        <section className="bg-white py-section-y">
          <div className="mx-auto max-w-container px-mobile-margin md:px-gutter">
            <ScrollReveal>
              <ImagenConOverlay imagen={config.nosotros_overlay_imagen} alt="Perro feliz junto a Suplevet">
                <h2 className="font-display text-2xl font-bold text-white md:text-4xl">
                  {config.nosotros_overlay_titulo}
                </h2>
                <p className="mt-2 font-body text-white/85 md:text-lg">{config.nosotros_overlay_texto}</p>
              </ImagenConOverlay>
            </ScrollReveal>
          </div>
        </section>
      )}

      <section className="bg-soft-gray py-section-y">
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
        <section className="bg-white py-section-y">
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
        <section className="bg-soft-gray py-section-y">
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
