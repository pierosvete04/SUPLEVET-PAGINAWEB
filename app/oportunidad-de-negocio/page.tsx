import type { Metadata } from "next";
import Image from "next/image";
import {
  FlaskConical,
  Sparkles,
  TrendingUp,
  Clock,
  GraduationCap,
  HeartPulse,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { PageBreadcrumbs } from "@/components/shared/PageBreadcrumbs";
import { FormularioDistribuidor } from "@/components/oportunidad/FormularioDistribuidor";
import { ListaChecks } from "@/components/oportunidad/ListaChecks";
import { getConfiguracionSitio } from "@/lib/data/configuracion";
import { getVentajasActivas } from "@/lib/oportunidad-ventajas";
import { createClient } from "@/lib/supabase/server";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Oportunidad de negocio — Distribuidor Estratégico Suplevet",
  description:
    "Conviértete en Distribuidor Estratégico de Suplevet. Un negocio de bienestar animal a tu manera: producto respaldado por ciencia, resultados reales en las mascotas y acompañamiento para crecer.",
  alternates: { canonical: `${siteConfig.siteUrl}/oportunidad-de-negocio` },
};

// Debe coincidir con ICONOS_DISPONIBLES en components/admin/oportunidad/VentajaForm.tsx
const ICONOS: Record<string, LucideIcon> = {
  FlaskConical,
  Sparkles,
  TrendingUp,
  Clock,
  GraduationCap,
  HeartPulse,
};

/** Los campos de lista del panel son un textarea: una viñeta por línea. */
const lineas = (campo: string | null | undefined) =>
  (campo ?? "")
    .split("\n")
    .map((linea) => linea.trim())
    .filter(Boolean);

const pasos = (config: Awaited<ReturnType<typeof getConfiguracionSitio>>) => [
  { n: "01", titulo: config?.oportunidad_paso1_titulo, texto: config?.oportunidad_paso1_texto },
  { n: "02", titulo: config?.oportunidad_paso2_titulo, texto: config?.oportunidad_paso2_texto },
  { n: "03", titulo: config?.oportunidad_paso3_titulo, texto: config?.oportunidad_paso3_texto },
];

export default async function OportunidadDeNegocioPage() {
  const supabase = await createClient();
  const [config, ventajas] = await Promise.all([
    getConfiguracionSitio(supabase),
    getVentajasActivas(supabase),
  ]);

  const bulletsProducto = lineas(config?.oportunidad_producto_bullets);
  const bulletsVentajas = lineas(config?.oportunidad_ventajas_bullets);

  return (
    <div>
      {/* HERO — el breadcrumb va DENTRO del hero con overlay (igual que /nosotros)
          para no dejar una franja en flujo normal que choque con el hero a
          pantalla completa justo debajo del header. */}
      <section className="relative flex min-h-[60vh] items-center overflow-hidden bg-gradient-to-br from-secondary to-[#0f1b2e] text-white">
        <PageBreadcrumbs items={[{ label: "Oportunidad de negocio" }]} overlay />
        {config?.oportunidad_hero_imagen && (
          <Image
            src={config.oportunidad_hero_imagen}
            alt=""
            fill
            priority
            className="object-cover opacity-60"
            sizes="100vw"
          />
        )}
        {/* Antes esto tapaba casi toda la imagen (opacity-25 de la imagen +
            hasta 85% de este overlay). Se baja el overlay para que la foto se
            note, manteniendo suficiente contraste para el texto blanco. */}
        <div className="absolute inset-0 bg-gradient-to-r from-secondary via-secondary/60 to-secondary/10" />
        <div className="relative mx-auto w-full max-w-container px-mobile-margin py-section-y md:px-gutter">
          <div className="max-w-2xl">
            {/* Entrada escalonada: eyebrow+título, texto y botones llegan en
                tiempos distintos en vez de moverse como un solo bloque. */}
            <ScrollReveal>
              <p className="font-impact text-sm tracking-wide text-sky">
                DISTRIBUIDOR ESTRATÉGICO SUPLEVET
              </p>
              <h1 className="mt-3 font-display text-4xl font-bold leading-tight md:text-6xl">
                {config?.oportunidad_hero_titulo}
              </h1>
            </ScrollReveal>
            <ScrollReveal delay={0.15}>
              <p className="mt-5 max-w-xl font-body text-base text-white/85 md:text-lg">
                {config?.oportunidad_hero_texto}
              </p>
            </ScrollReveal>
            <ScrollReveal delay={0.3}>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#postular"
                  className="group flex items-center justify-center gap-2 rounded-[17px] bg-accent px-7 py-3.5 font-body text-base font-bold text-accent-foreground transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-secondary"
                >
                  Quiero ser distribuidor
                  <ArrowRight
                    className="h-5 w-5 transition-transform group-hover:translate-x-1"
                    strokeWidth={2}
                  />
                </a>
                <a
                  href="#ventajas"
                  className="flex items-center justify-center gap-2 rounded-[17px] border border-white/40 px-7 py-3.5 font-body text-base font-bold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-secondary"
                >
                  Ver ventajas
                </a>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* INTRO — imagen + panel de texto con offset (estilo editorial) */}
      <section className="bg-white py-section-y">
        <div className="mx-auto grid max-w-container grid-cols-1 items-center gap-10 px-mobile-margin md:grid-cols-2 md:gap-16 md:px-gutter">
          <ScrollReveal className="relative">
            <div className="absolute -left-4 -top-4 hidden aspect-square w-full rounded-[var(--radius-card)] bg-accent/30 md:block" />
            {config?.oportunidad_intro_imagen && (
              <div className="relative aspect-square w-full overflow-hidden rounded-[var(--radius-card)] shadow-sm">
                <Image
                  src={config.oportunidad_intro_imagen}
                  alt="Mascota saludable acompañada de Suplevet"
                  fill
                  className="object-cover"
                  sizes="(min-width: 768px) 50vw, 100vw"
                />
              </div>
            )}
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <p className="font-impact text-sm tracking-wide text-secondary">MÁS QUE UNA VENTA</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-secondary md:text-4xl">
              {config?.oportunidad_intro_titulo}
            </h2>
            <p className="mt-5 font-body text-muted-foreground">{config?.oportunidad_intro_texto_1}</p>
            <p className="mt-4 font-body text-muted-foreground">{config?.oportunidad_intro_texto_2}</p>
          </ScrollReveal>
        </div>
      </section>

      {/* VENTAJAS — enfoque en producto y resultados */}
      <section id="ventajas" className="scroll-mt-24 bg-soft-gray py-section-y">
        <div className="mx-auto max-w-container px-mobile-margin md:px-gutter">
          <ScrollReveal className="mx-auto max-w-2xl text-center">
            <p className="font-impact text-sm tracking-wide text-secondary">LA VENTAJA SUPLEVET</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-secondary md:text-4xl">
              {config?.oportunidad_ventajas_titulo}
            </h2>
            <p className="mt-4 font-body text-muted-foreground">{config?.oportunidad_ventajas_texto}</p>
          </ScrollReveal>

          {/* Condiciones comerciales — bloque propio con su título arriba, en
              flujo normal (sin overlap: el intento anterior lo superponía al
              límite de la sección INTRO, pero esa sección es a 2 columnas —
              imagen a la izquierda, texto a la derecha — así que el panel
              centrado a lo ancho de toda la sección quedaba descolgado y
              "se salía" respecto a la imagen angosta de arriba). La lista va
              alineada a la izquierda aunque el título esté centrado: una
              lista centrada obliga a rastrear el inicio de cada línea. */}
          {bulletsVentajas.length > 0 && (
            <ScrollReveal delay={0.1} className="mx-auto mt-10 max-w-2xl text-center">
              <h3 className="font-display text-xl font-bold text-secondary md:text-2xl">
                Condiciones comerciales
              </h3>
              <div className="mt-5 rounded-[var(--radius-card)] border border-border bg-white p-6 text-left shadow-sm md:p-8">
                <ListaChecks items={bulletsVentajas} className="gap-4 text-base text-secondary" />
              </div>
            </ScrollReveal>
          )}

          {/* Grilla uniforme de 6 tarjetas — la primera lleva un fondo en
              degradado navy como único acento de jerarquía (mismo tamaño que
              las demás, sin col-span/row-span: la versión anterior de tarjeta
              2x2 quedaba demasiado grande frente al resto). */}
          <div className="mt-12 grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-3">
            {ventajas.map(({ id, icono, titulo, texto }, i) => {
              const Icon = ICONOS[icono] ?? FlaskConical;
              const destacada = i === 0;
              return (
                <ScrollReveal
                  key={id}
                  delay={(i % 3) * 0.1}
                  className={
                    destacada
                      ? "group relative flex flex-col overflow-hidden rounded-[var(--radius-card)] bg-gradient-to-br from-secondary via-[#1c3357] to-[#0d1c33] p-6 text-white shadow-md transition-all hover:-translate-y-1 hover:shadow-xl"
                      : "group flex flex-col rounded-[var(--radius-card)] border border-border bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                  }
                >
                  {destacada && (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/20 blur-3xl"
                    />
                  )}
                  <div
                    className={
                      destacada
                        ? "relative flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white transition-colors group-hover:bg-accent group-hover:text-secondary"
                        : "flex h-14 w-14 items-center justify-center rounded-full bg-accent/30 text-secondary transition-colors group-hover:bg-accent"
                    }
                  >
                    <Icon className="h-7 w-7" strokeWidth={1.5} />
                  </div>
                  <h3
                    className={
                      destacada
                        ? "relative mt-5 font-display text-lg font-bold"
                        : "mt-5 font-display text-lg font-bold text-secondary"
                    }
                  >
                    {titulo}
                  </h3>
                  <p
                    className={
                      destacada
                        ? "relative mt-2 font-body text-sm text-white/80"
                        : "mt-2 font-body text-sm text-muted-foreground"
                    }
                  >
                    {texto}
                  </p>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* PRODUCTO — banda destacada */}
      <section className="relative overflow-hidden bg-secondary py-section-y text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-1/2 h-[28rem] w-[28rem] -translate-y-1/2 translate-x-1/3 rounded-full bg-accent/10 blur-[100px]"
        />
        <div className="relative mx-auto grid max-w-container grid-cols-1 items-center gap-10 px-mobile-margin md:grid-cols-2 md:gap-16 md:px-gutter">
          <ScrollReveal>
            <p className="font-impact text-sm tracking-wide text-sky">EL RESPALDO DE TU NEGOCIO</p>
            <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">
              {config?.oportunidad_producto_titulo}
            </h2>
            <p className="mt-5 font-body text-white/85">{config?.oportunidad_producto_texto}</p>
            <ListaChecks items={bulletsProducto} className="mt-6 text-white/90" />
          </ScrollReveal>

          <ScrollReveal delay={0.1} className="relative">
            {config?.oportunidad_producto_imagen && (
              <div className="relative mx-auto aspect-square w-full max-w-xs overflow-hidden rounded-[var(--radius-card)] bg-white/5 p-4 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.35)]">
                <Image
                  src={config.oportunidad_producto_imagen}
                  alt="Producto Suplevet"
                  fill
                  className="object-contain p-2"
                  sizes="(min-width: 768px) 20rem, 60vw"
                />
              </div>
            )}
          </ScrollReveal>
        </div>
      </section>

      {/* CÓMO EMPEZAR */}
      <section className="bg-white py-section-y">
        <div className="mx-auto max-w-container px-mobile-margin md:px-gutter">
          <ScrollReveal className="text-center">
            <p className="font-impact text-sm tracking-wide text-secondary">EN 3 PASOS</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-secondary md:text-4xl">
              {config?.oportunidad_pasos_titulo}
            </h2>
          </ScrollReveal>

          <div className="relative mt-12 grid grid-cols-1 gap-gutter md:grid-cols-3">
            {/* Línea conectora entre los 3 pasos (solo desktop) — refuerza la
                secuencia sin agregar texto nuevo. */}
            <div
              aria-hidden
              className="absolute left-0 right-0 top-14 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block"
            />
            {pasos(config).map(({ n, titulo, texto }, i) => (
              <ScrollReveal
                key={n}
                delay={i * 0.1}
                className="relative rounded-[var(--radius-card)] bg-soft-gray p-7 transition-shadow hover:shadow-md"
              >
                <span className="font-display text-5xl font-bold text-accent">{n}</span>
                <h3 className="mt-3 font-display text-xl font-bold text-secondary">{titulo}</h3>
                <p className="mt-2 font-body text-sm text-muted-foreground">{texto}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* FORMULARIO / POSTULAR */}
      <section id="postular" className="scroll-mt-24 bg-gradient-to-br from-secondary to-[#0f1b2e] py-section-y">
        <div className="mx-auto grid max-w-container grid-cols-1 items-center gap-10 px-mobile-margin md:grid-cols-2 md:gap-16 md:px-gutter">
          <ScrollReveal className="text-white">
            <p className="font-impact text-sm tracking-wide text-sky">DA EL PRIMER PASO</p>
            <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">
              {config?.oportunidad_postular_titulo}
            </h2>
            <p className="mt-5 font-body text-white/85">{config?.oportunidad_postular_texto_1}</p>
            <p className="mt-4 font-body text-sm text-white/70">{config?.oportunidad_postular_texto_2}</p>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <FormularioDistribuidor />
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
