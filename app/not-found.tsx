import Link from "next/link";
import { unstable_cache } from "next/cache";
import { ArrowRight, Home, MessageCircle } from "lucide-react";
import { HuellasFondo } from "@/components/shared/HuellasFondo";
import { TestimoniosVerticalSlider } from "@/components/error/TestimoniosVerticalSlider";
import { BENEFICIOS_NOT_FOUND } from "@/lib/not-found-beneficios";
import { getTestimoniosActivos } from "@/lib/testimonios";
import { createStaticClient } from "@/lib/supabase/static";
import { siteConfig, whatsappLink } from "@/lib/site-config";
import { cn } from "@/lib/utils";

// Página 404 del sitio. No es solo un aviso de error: la mayor parte del
// tráfico que cae aquí viene de URLs que Google todavía tiene indexadas de la
// tienda anterior en Shopify (/collections/*, /products/*), que ya no existen.
// Es gente con intención de compra, así que la página explica la mudanza en
// una línea y de ahí en adelante trabaja como una landing corta: beneficios
// reales + prueba social en video + una salida clara al catálogo.
//
// IMPORTANTE: usa createStaticClient (sin cookies), no lib/supabase/server.
// Next renderiza la ruta interna /_not-found en build; leer next/headers ahí
// la forzaría a dinámica y haría una consulta a Supabase en cada 404 —
// justamente en la página que más golpes va a recibir de bots y crawlers.
const getTestimoniosNotFound = unstable_cache(
  async () => {
    try {
      return await getTestimoniosActivos(createStaticClient());
    } catch {
      return [];
    }
  },
  ["testimonios-not-found"],
  { revalidate: 300 }
);

const ENLACES_RAPIDOS = [
  { label: "Ofertas", href: "/ofertas" },
  { label: "Combos", href: "/#combos" },
  { label: "Nosotros", href: "/nosotros" },
  { label: "Blog", href: "/blog" },
  { label: "Contáctanos", href: "/contacto" },
];

export default async function NotFound() {
  const testimonios = await getTestimoniosNotFound();
  const hayTestimonios = testimonios.length > 0;

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-secondary to-[#0f1b2e]">
      <HuellasFondo id="huellas-404" className="text-white/[0.04]" />
      <div className="pointer-events-none absolute -right-24 top-1/4 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />

      <div
        className={cn(
          "relative mx-auto grid max-w-container items-center gap-12 px-mobile-margin py-16 md:px-gutter md:py-20",
          hayTestimonios && "lg:grid-cols-[1.15fr_0.85fr] lg:gap-gutter"
        )}
      >
        {/* Columna de texto y beneficios */}
        <div className={cn(!hayTestimonios && "mx-auto max-w-3xl text-center")}>
          <p className="font-impact text-[clamp(4.5rem,14vw,9rem)] leading-[0.8] tracking-wide text-white/15">
            404
          </p>

          <h1 className="mt-2 font-display text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
            Esta página ya no existe
          </h1>

          <p className="mt-4 max-w-xl font-body text-base leading-relaxed text-white/75 md:text-lg">
            Es muy probable que llegaras desde un enlace antiguo de nuestra tienda anterior.
            Suplevet se mudó a esta web: los mismos productos de siempre, ahora con más
            beneficios para ti y tu mascota.
          </p>

          <div
            className={cn(
              "mt-7 flex flex-col gap-3 sm:flex-row",
              !hayTestimonios && "sm:justify-center"
            )}
          >
            <Link
              href="/productos"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 font-body text-base font-bold text-primary-foreground shadow-lg transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Ver todos los productos
              <ArrowRight className="h-5 w-5" strokeWidth={2} />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-7 py-3.5 font-body text-base font-bold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Home className="h-5 w-5" strokeWidth={2} />
              Ir al inicio
            </Link>
          </div>

          {/* Beneficios "acostados": ícono a la izquierda, texto a la derecha —
              se leen de un vistazo mientras la vista baja hacia los CTA. */}
          <ul
            className={cn(
              "mt-10 grid gap-4 sm:grid-cols-2",
              !hayTestimonios && "text-left"
            )}
          >
            {BENEFICIOS_NOT_FOUND.map(({ icono: Icono, titulo, texto }) => (
              <li
                key={titulo}
                className="flex items-start gap-3.5 rounded-[var(--radius-card)] border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/15">
                  <Icono className="h-5 w-5 text-accent" strokeWidth={1.75} />
                </span>
                <span className="flex flex-col gap-1">
                  <span className="font-body text-sm font-bold text-white">{titulo}</span>
                  <span className="font-body text-sm leading-snug text-white/65">{texto}</span>
                </span>
              </li>
            ))}
          </ul>

          <div
            className={cn(
              "mt-8 flex flex-wrap items-center gap-2",
              !hayTestimonios && "justify-center"
            )}
          >
            <span className="mr-1 font-body text-sm text-white/50">O ve directo a:</span>
            {ENLACES_RAPIDOS.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="rounded-full border border-white/20 px-4 py-1.5 font-body text-sm text-white/85 transition-colors hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                {label}
              </Link>
            ))}
            <a
              href={whatsappLink(
                siteConfig.whatsappB2C,
                "Hola, entré a un enlace antiguo de Suplevet y quiero información."
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-4 py-1.5 font-body text-sm text-white/85 transition-colors hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <MessageCircle className="h-4 w-4" strokeWidth={2} />
              Escríbenos
            </a>
          </div>
        </div>

        {/* Prueba social en video — refuerza la decisión justo al lado del CTA */}
        {hayTestimonios && (
          <div>
            <p className="mb-5 text-center font-body text-sm font-bold uppercase tracking-wide text-accent">
              Lo que dicen quienes ya lo probaron
            </p>
            <TestimoniosVerticalSlider testimonios={testimonios} />
          </div>
        )}
      </div>
    </section>
  );
}
