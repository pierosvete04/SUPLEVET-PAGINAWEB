import { HillCurve } from "@/components/ui/HillCurve";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { VideoEnViewport } from "@/components/shared/VideoEnViewport";

// Referencia visual: bloque "Swap Your Top For A New Look" de PopSockets
// (PLAN.md sección 5.2). Videos reales por paso (1:1, comprimidos, sin audio)
// alojados en Cloudflare R2 bajo el prefijo como-se-prepara-videos/.
const R2_BASE = "https://pub-ad8cb8681bd8458ba537a43f6735a89d.r2.dev/como-se-prepara-videos";

const pasos = [
  { numero: 1, texto: "Retira el sello protector", video: `${R2_BASE}/paso-1.mp4` },
  { numero: 2, texto: "Ábrelo, adentro encontrarás un scoop/cuchara de 10 g", video: `${R2_BASE}/paso-2.mp4` },
  { numero: 3, texto: "Dale un scoop/cuchara por cada 10 kilos que pese tu mascota y viértelo en la cantidad de agua que prefieras", video: `${R2_BASE}/paso-3.mp4` },
  { numero: 4, texto: "Mézclalo con su comida o dáselo solo, ¡a disfrutar!", video: `${R2_BASE}/paso-4.mp4` },
];

interface ComoSePreparaProps {
  /** true = viene precedida de una sección de fondo azul (agrega la curva de
   * transición hacia este bloque, que es de fondo blanco). */
  conCurvaSuperior?: boolean;
  /** false = oculta el CTA "Comprar ahora" — se usa en la página del propio
   * producto, donde ya existe el buy box arriba y el botón es redundante. */
  mostrarBotonComprar?: boolean;
  /** false = no aplica su propio degradado de fondo — se usa en Home, donde
   * un wrapper externo provee un degradado continuo que también cubre la
   * sección de Resultados reales de abajo. */
  fondoPropio?: boolean;
  /** true = reduce el padding inferior a la mitad — se usa en Home, donde le
   * sigue directamente "Resultados reales" y el espacio entre el botón
   * "Comprar ahora" y esa sección quedaba demasiado separado. */
  paddingInferiorReducido?: boolean;
  /** true = reduce el padding superior — se usa en Home, donde le precede
   * directamente "Nuevas presentaciones" y el espacio entre ambas secciones
   * quedaba demasiado separado. */
  paddingSuperiorReducido?: boolean;
}

export function ComoSePrepara({
  conCurvaSuperior = false,
  mostrarBotonComprar = true,
  fondoPropio = true,
  paddingInferiorReducido = false,
  paddingSuperiorReducido = false,
}: ComoSePreparaProps) {
  return (
    <>
      {conCurvaSuperior && <HillCurve fillClassName="fill-soft-gray" bgClassName="bg-secondary" />}
      <section
        id="como-se-prepara"
        className={`${paddingSuperiorReducido ? "pt-7" : "pt-section-y"} ${paddingInferiorReducido ? "pb-12 md:pb-16" : "pb-section-y"} ${fondoPropio ? "bg-gradient-to-b from-soft-gray to-accent" : ""}`}
      >
        <div className="mx-auto max-w-container px-mobile-margin md:px-gutter">
          <h2 className="text-center font-display text-3xl font-bold text-secondary md:text-4xl">
            ¿Cómo se prepara?
          </h2>
          {/* Mobile: scroll horizontal (una tarjeta grande a la vez, arrastras
              para ver las 4) — igual que "Resultados reales" más abajo. Desde
              md para arriba pasa a grid de 4 columnas fijo. */}
          <div className="no-scrollbar mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-4 md:gap-gutter md:overflow-visible md:pb-0">
            {pasos.map(({ numero, texto, video }, i) => (
              <ScrollReveal
                key={numero}
                delay={i * 0.1}
                className="w-[78%] shrink-0 snap-start flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-white text-center sm:w-64 md:w-auto md:shrink"
              >
                {/* El video ocupa todo el ancho de la tarjeta y se reproduce en
                    bucle silencioso, sin controles, para que se sienta como un
                    GIF pero con mucho menor peso. La descarga se difiere hasta
                    que la tarjeta se acerca a pantalla (ver VideoEnViewport):
                    son 3,2 MB entre los cuatro y competían con la carga del
                    hero. El fondo gris reserva el cuadro mientras tanto. */}
                <div className="aspect-square w-full overflow-hidden bg-soft-gray">
                  <VideoEnViewport src={video} className="h-full w-full object-cover" />
                </div>
                <div className="flex flex-col gap-2 p-5">
                  <span className="font-impact text-sm text-secondary">PASO {numero}</span>
                  <p className="font-body text-sm text-secondary">{texto}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
          {mostrarBotonComprar && (
            <div className="mt-10 text-center">
              <a
                href="/productos"
                className="inline-block rounded-[17px] bg-primary px-6 py-3 font-body font-bold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Comprar ahora
              </a>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
