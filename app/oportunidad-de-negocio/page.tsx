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

  const bullets = (config?.oportunidad_producto_bullets ?? "")
    .split("\n")
    .map((b) => b.trim())
    .filter(Boolean);

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
            className="object-cover opacity-25"
            sizes="100vw"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-secondary via-secondary/85 to-transparent" />
        <div className="relative mx-auto w-full max-w-container px-mobile-margin py-section-y md:px-gutter">
          <ScrollReveal className="max-w-2xl">
            <p className="font-impact text-sm tracking-wide text-sky">
              DISTRIBUIDOR ESTRATÉGICO SUPLEVET
            </p>
            <h1 className="mt-3 font-display text-4xl font-bold leading-tight md:text-6xl">
              {config?.oportunidad_hero_titulo}
            </h1>
            <p className="mt-5 max-w-xl font-body text-base text-white/85 md:text-lg">
              {config?.oportunidad_hero_texto}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#postular"
                className="flex items-center justify-center gap-2 rounded-[17px] bg-accent px-7 py-3.5 font-body text-base font-bold text-accent-foreground transition-opacity hover:opacity-90"
              >
                Quiero ser distribuidor
                <ArrowRight className="h-5 w-5" strokeWidth={2} />
              </a>
              <a
                href="#ventajas"
                className="flex items-center justify-center gap-2 rounded-[17px] border border-white/40 px-7 py-3.5 font-body text-base font-bold text-white transition-colors hover:bg-white/10"
              >
                Ver ventajas
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* INTRO — imagen + panel de texto con offset (estilo editorial) */}
      <section className="bg-white py-section-y">
        <div className="mx-auto grid max-w-container grid-cols-1 items-center gap-10 px-mobile-margin md:grid-cols-2 md:gap-16 md:px-gutter">
          <ScrollReveal className="relative">
            <div className="absolute -left-4 -top-4 hidden h-full w-full rounded-[var(--radius-card)] bg-accent/30 md:block" />
            {config?.oportunidad_intro_imagen && (
              <div className="relative overflow-hidden rounded-[var(--radius-card)] shadow-sm">
                <Image
                  src={config.oportunidad_intro_imagen}
                  alt="Mascota saludable acompañada de Suplevet"
                  width={720}
                  height={560}
                  className="h-full w-full object-cover"
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

          <div className="mt-12 grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-3">
            {ventajas.map(({ id, icono, titulo, texto }, i) => {
              const Icon = ICONOS[icono] ?? FlaskConical;
              return (
                <ScrollReveal
                  key={id}
                  delay={(i % 3) * 0.1}
                  className="group flex flex-col rounded-[var(--radius-card)] border border-border bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/30 text-secondary transition-colors group-hover:bg-accent">
                    <Icon className="h-7 w-7" strokeWidth={1.5} />
                  </div>
                  <h3 className="mt-5 font-display text-lg font-bold text-secondary">{titulo}</h3>
                  <p className="mt-2 font-body text-sm text-muted-foreground">{texto}</p>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* PRODUCTO — banda destacada */}
      <section className="bg-secondary py-section-y text-white">
        <div className="mx-auto grid max-w-container grid-cols-1 items-center gap-10 px-mobile-margin md:grid-cols-2 md:gap-16 md:px-gutter">
          <ScrollReveal>
            <p className="font-impact text-sm tracking-wide text-sky">EL RESPALDO DE TU NEGOCIO</p>
            <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">
              {config?.oportunidad_producto_titulo}
            </h2>
            <p className="mt-5 font-body text-white/85">{config?.oportunidad_producto_texto}</p>
            <ul className="mt-6 flex flex-col gap-3 font-body text-sm text-white/90">
              {bullets.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={3}>
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </ScrollReveal>

          <ScrollReveal delay={0.1} className="relative">
            {config?.oportunidad_producto_imagen && (
              <div className="relative mx-auto max-w-sm overflow-hidden rounded-[var(--radius-card)] bg-white/5 p-6">
                <Image
                  src={config.oportunidad_producto_imagen}
                  alt="Producto Suplevet"
                  width={520}
                  height={520}
                  className="h-full w-full object-contain"
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

          <div className="mt-12 grid grid-cols-1 gap-gutter md:grid-cols-3">
            {pasos(config).map(({ n, titulo, texto }, i) => (
              <ScrollReveal
                key={n}
                delay={i * 0.1}
                className="relative rounded-[var(--radius-card)] bg-soft-gray p-7"
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
