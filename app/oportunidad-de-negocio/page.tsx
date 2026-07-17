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
} from "lucide-react";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { PageBreadcrumbs } from "@/components/shared/PageBreadcrumbs";
import { FormularioDistribuidor } from "@/components/oportunidad/FormularioDistribuidor";

export const metadata: Metadata = {
  title: "Oportunidad de negocio — Distribuidor Estratégico Suplevet",
  description:
    "Conviértete en Distribuidor Estratégico de Suplevet. Un negocio de bienestar animal a tu manera: producto respaldado por ciencia, resultados reales en las mascotas y acompañamiento para crecer.",
};

const BASE_IMG =
  "https://bcahhdszzwearqaafhpa.supabase.co/storage/v1/object/public/productos-web-fotos";
const IMG_PERRO = `${BASE_IMG}/suplevet-250g/lifestyle-perro.png`;
const IMG_GATO = `${BASE_IMG}/suplevet-150g/lifestyle-gato.png`;
const IMG_PRODUCTO = `${BASE_IMG}/suplevet-250g/hero-estudio.png`;

// Ventajas enfocadas en PRODUCTO y RESULTADOS (pedido explícito: nada de
// devoluciones ni reembolsos). Lo que hace fácil vender Suplevet es el producto
// mismo y lo que logra en las mascotas.
const ventajas = [
  {
    icon: FlaskConical,
    titulo: "Un producto que se recomienda solo",
    texto:
      "Nutrición funcional respaldada por ciencia: ingredientes de grado farmacéutico o alimenticio, sin gluten ni azúcar añadida. Vendes algo en lo que de verdad puedes creer.",
  },
  {
    icon: HeartPulse,
    titulo: "Resultados que se notan",
    texto:
      "Más energía, mejor digestión y un pelaje más sano. Cuando el dueño ve el cambio en su mascota, vuelve a comprar — y eso convierte tu venta en ingresos que se repiten.",
  },
  {
    icon: Sparkles,
    titulo: "Una marca peruana en crecimiento",
    texto:
      "Suplevet es nutrición clínica veterinaria desarrollada en Perú, con una fórmula única en el país. Te sumas a un catálogo diferenciado, no a un producto más del montón.",
  },
  {
    icon: TrendingUp,
    titulo: "Márgenes pensados para tu negocio",
    texto:
      "Accedes a precios de Distribuidor Estratégico que te dejan un margen atractivo en cada venta. Tú decides cuánto crecer.",
  },
  {
    icon: Clock,
    titulo: "Empieza a tu ritmo",
    texto:
      "Sin necesidad de un local ni de una gran inversión inicial. Vendes desde donde estés, a medio tiempo o a tiempo completo, según tus metas.",
  },
  {
    icon: GraduationCap,
    titulo: "Formación y acompañamiento",
    texto:
      "No te dejamos solo: te damos argumentos de venta, material y el respaldo de nuestro equipo para que cada conversación con tu cliente cuente.",
  },
];

const pasos = [
  {
    n: "01",
    titulo: "Postúlate",
    texto: "Déjanos tus datos en el formulario y se abre una conversación directa por WhatsApp.",
  },
  {
    n: "02",
    titulo: "Conversamos",
    texto:
      "Te contamos cómo funciona, resolvemos tus dudas y vemos juntos el plan que mejor se adapta a ti.",
  },
  {
    n: "03",
    titulo: "Empiezas a vender",
    texto:
      "Recibes tu material y el acompañamiento del equipo para arrancar con el pie derecho.",
  },
];

export default function OportunidadDeNegocioPage() {
  return (
    <div>
      <PageBreadcrumbs items={[{ label: "Oportunidad de negocio" }]} />
      {/* HERO */}
      <section className="relative flex min-h-[60vh] items-center overflow-hidden bg-gradient-to-br from-secondary to-[#0f1b2e] text-white">
        <Image
          src={IMG_PERRO}
          alt=""
          fill
          priority
          className="object-cover opacity-25"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-secondary via-secondary/85 to-transparent" />
        <div className="relative mx-auto w-full max-w-container px-mobile-margin py-section-y md:px-gutter">
          <ScrollReveal className="max-w-2xl">
            <p className="font-impact text-sm tracking-wide text-sky">
              DISTRIBUIDOR ESTRATÉGICO SUPLEVET
            </p>
            <h1 className="mt-3 font-display text-4xl font-bold leading-tight md:text-6xl">
              Tu negocio de bienestar animal, a tu manera
            </h1>
            <p className="mt-5 max-w-xl font-body text-base text-white/85 md:text-lg">
              Convierte tu pasión por las mascotas en un ingreso real. Distribuye una marca peruana
              de nutrición clínica respaldada por ciencia, con resultados que tus clientes ven —
              y sienten — en sus mascotas.
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
            <div className="relative overflow-hidden rounded-[var(--radius-card)] shadow-sm">
              <Image
                src={IMG_GATO}
                alt="Mascota saludable acompañada de Suplevet"
                width={720}
                height={560}
                className="h-full w-full object-cover"
              />
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <p className="font-impact text-sm tracking-wide text-primary">MÁS QUE UNA VENTA</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-secondary md:text-4xl">
              Construye un negocio en torno a tu vida, no al revés
            </h2>
            <p className="mt-5 font-body text-muted-foreground">
              Como Distribuidor Estratégico de Suplevet no solo revendes un producto: acompañas a
              las familias a cuidar mejor la salud de sus mascotas. Tú decides cómo, cuándo y a qué
              ritmo trabajar.
            </p>
            <p className="mt-4 font-body text-muted-foreground">
              Nosotros ponemos el producto, la formación y el respaldo de la marca. Tú pones tu red
              y tus ganas. Ya sea para sumar un ingreso extra o para hacer crecer un negocio propio,
              encontrarás las herramientas para lograrlo.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* VENTAJAS — enfoque en producto y resultados */}
      <section id="ventajas" className="scroll-mt-24 bg-soft-gray py-section-y">
        <div className="mx-auto max-w-container px-mobile-margin md:px-gutter">
          <ScrollReveal className="mx-auto max-w-2xl text-center">
            <p className="font-impact text-sm tracking-wide text-primary">LA VENTAJA SUPLEVET</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-secondary md:text-4xl">
              Lo más difícil de vender ya lo tienes resuelto: el producto
            </h2>
            <p className="mt-4 font-body text-muted-foreground">
              Distribuir Suplevet es fácil porque funciona. Estas son las razones por las que tus
              clientes vuelven.
            </p>
          </ScrollReveal>

          <div className="mt-12 grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-3">
            {ventajas.map(({ icon: Icon, titulo, texto }, i) => (
              <ScrollReveal
                key={titulo}
                delay={(i % 3) * 0.1}
                className="group flex flex-col rounded-[var(--radius-card)] border border-border bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/30 text-secondary transition-colors group-hover:bg-accent">
                  <Icon className="h-7 w-7" strokeWidth={1.5} />
                </div>
                <h3 className="mt-5 font-display text-lg font-bold text-secondary">{titulo}</h3>
                <p className="mt-2 font-body text-sm text-muted-foreground">{texto}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCTO — banda destacada */}
      <section className="bg-secondary py-section-y text-white">
        <div className="mx-auto grid max-w-container grid-cols-1 items-center gap-10 px-mobile-margin md:grid-cols-2 md:gap-16 md:px-gutter">
          <ScrollReveal>
            <p className="font-impact text-sm tracking-wide text-sky">EL RESPALDO DE TU NEGOCIO</p>
            <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">
              Vendes salud, no promesas
            </h2>
            <p className="mt-5 font-body text-white/85">
              Cada fórmula de Suplevet está pensada para fortalecer la salud de la mascota desde
              adentro: sistema inmune, digestión, energía y vitalidad. Ingredientes seleccionados,
              sin aditivos nocivos, con un enfoque clínico y funcional único en el Perú.
            </p>
            <ul className="mt-6 flex flex-col gap-3 font-body text-sm text-white/90">
              {[
                "Respaldado por evidencia científica",
                "Ingredientes de grado farmacéutico o alimenticio",
                "Sin gluten ni azúcar añadida",
                "Resultados visibles que impulsan la recompra",
              ].map((item) => (
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
            <div className="relative mx-auto max-w-sm overflow-hidden rounded-[var(--radius-card)] bg-white/5 p-6">
              <Image
                src={IMG_PRODUCTO}
                alt="Producto Suplevet"
                width={520}
                height={520}
                className="h-full w-full object-contain"
              />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* CÓMO EMPEZAR */}
      <section className="bg-white py-section-y">
        <div className="mx-auto max-w-container px-mobile-margin md:px-gutter">
          <ScrollReveal className="text-center">
            <p className="font-impact text-sm tracking-wide text-primary">EN 3 PASOS</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-secondary md:text-4xl">
              Empezar es más simple de lo que crees
            </h2>
          </ScrollReveal>

          <div className="mt-12 grid grid-cols-1 gap-gutter md:grid-cols-3">
            {pasos.map(({ n, titulo, texto }, i) => (
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
              Postula como Distribuidor Estratégico
            </h2>
            <p className="mt-5 font-body text-white/85">
              Déjanos tus datos y conversemos por WhatsApp. Sin compromiso: te explicamos cómo
              funciona y resolvemos todas tus dudas para que decidas con información clara.
            </p>
            <p className="mt-4 font-body text-sm text-white/70">
              Tus datos quedan registrados con nuestro equipo y se abre una conversación directa
              con el número exclusivo de Distribuidores Estratégicos.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <FormularioDistribuidor />
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
