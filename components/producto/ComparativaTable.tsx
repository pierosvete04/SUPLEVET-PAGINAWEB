import { Check, Minus } from "lucide-react";
import type { ComparativaFila } from "@/lib/comparativa";

// PLAN.md sección 5.4.3 — no se nombran marcas de competencia, columna genérica.

// Rejilla de la tabla: beneficio a la izquierda y las dos columnas comparadas
// con el mismo peso. Se declara una sola vez para que encabezado y filas no se
// desalineen entre sí.
const REJILLA = "md:grid md:grid-cols-[minmax(10rem,0.9fr)_minmax(0,1.15fr)_minmax(0,1.15fr)]";

// Ambos encabezados comparten tipografía, tamaño y peso: la única diferencia
// entre Suplevet y la competencia es el color, nunca la jerarquía tipográfica.
const ENCABEZADO = "font-body text-sm font-bold uppercase tracking-wider";

interface ComparativaTableProps {
  filas: ComparativaFila[];
}

export function ComparativaTable({ filas }: ComparativaTableProps) {
  if (filas.length === 0) return null;

  return (
    <section className="bg-secondary py-section-y">
      <div className="mx-auto max-w-container px-mobile-margin md:px-gutter">
        <h2 className="text-center font-display text-2xl font-bold text-white md:text-3xl">
          Suplevet vs. otros suplementos
        </h2>

        <div className="mx-auto mt-10 max-w-4xl">
          {/* La tabla se despega del fondo con superficie propia, borde
              perimetral y sombra proyectada. overflow-hidden recorta el tinte
              de la columna Suplevet contra las esquinas redondeadas. */}
          <div className="overflow-hidden rounded-[var(--radius-card,1rem)] border border-white/15 bg-white/[0.03] shadow-[0_24px_50px_-12px_rgba(0,0,0,0.65)]">
            {/* Encabezado de columnas — solo en desktop, donde la tabla existe
                como rejilla real. Etiquetas alineadas a la izquierda de su
                columna, no centradas. */}
            <div className={`hidden ${REJILLA}`}>
              <span
                className={`px-5 py-4 font-body text-xs font-bold uppercase tracking-wider text-white/60`}
              >
                Beneficio clave
              </span>
              <div className="border-x border-accent/25 bg-accent/[0.07] px-5 py-4">
                <span className={`${ENCABEZADO} text-accent`}>Suplevet</span>
              </div>
              <div className="px-5 py-4">
                <span className={`${ENCABEZADO} text-white/70`}>Otros suplementos</span>
              </div>
            </div>

            {filas.map((fila) => (
              <div
                key={fila.id}
                className={`border-t border-white/10 px-5 py-6 first:border-t-0 md:px-0 md:py-0 md:first:border-t ${REJILLA} md:transition-colors md:hover:bg-white/[0.03]`}
              >
                <p className="font-display text-base font-bold text-white md:self-center md:px-5 md:py-6">
                  {fila.beneficio}
                </p>

                {/* Columna Suplevet — el destaque es por color y superficie, no
                    por atenuar la columna contraria: ambos textos se leen igual
                    de bien (WCAG AA sobre el navy de fondo). */}
                <div className="mt-4 rounded-sm border-l-2 border-accent bg-accent/[0.07] p-4 md:mt-0 md:rounded-none md:border-x md:border-accent/25 md:px-5 md:py-6">
                  <span className={`${ENCABEZADO} text-accent md:hidden`}>Suplevet</span>
                  <div className="flex items-start gap-2">
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                      strokeWidth={2.5}
                      aria-hidden
                    />
                    <p className="font-body text-sm font-bold text-accent">
                      {fila.suplevet_titulo}
                    </p>
                  </div>
                  <p className="mt-1.5 font-body text-[13px] leading-relaxed text-white/80">
                    {fila.suplevet_texto}
                  </p>
                </div>

                <div className="mt-3 rounded-sm border-l-2 border-white/20 bg-white/[0.03] p-4 md:mt-0 md:rounded-none md:border-l-0 md:bg-transparent md:px-5 md:py-6">
                  <span className={`${ENCABEZADO} text-white/70 md:hidden`}>Otros suplementos</span>
                  <div className="flex items-start gap-2">
                    <Minus
                      className="mt-0.5 h-4 w-4 shrink-0 text-white/70"
                      strokeWidth={2.5}
                      aria-hidden
                    />
                    <p className="font-body text-sm font-bold text-white">{fila.otros_titulo}</p>
                  </div>
                  <p className="mt-1.5 font-body text-[13px] leading-relaxed text-white/80">
                    {fila.otros_texto}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Cierre de marca — resume la diferencia en una frase, sin
              afirmaciones clínicas (evitar "previene/cura/trata"). */}
          <div className="mt-10 text-center">
            <p className="mx-auto max-w-2xl font-body text-sm leading-relaxed text-white/80">
              Suplevet no solo aporta nutrientes: combina ingredientes bioactivos que apoyan
              múltiples funciones fisiológicas del organismo, contribuyendo a una mejor
              recuperación, bienestar y calidad de vida de la mascota.
            </p>
            <p className="mt-4 font-display text-lg font-bold text-white">
              Suplevet<span className="align-super text-xs">®</span> Nutrición Funcional
            </p>
            <p className="font-body text-xs text-accent">para una vida más saludable.</p>

            {/* Nota separada del cuerpo del comparativo a propósito — casos
                oncológicos exigen el máximo cuidado regulatorio: solo soporte
                nutricional/inmunológico complementario, nunca un beneficio
                terapéutico ni sustituto del tratamiento del veterinario. */}
            <p className="mx-auto mt-6 max-w-xl font-body text-[11px] leading-relaxed text-white/60">
              En pacientes bajo tratamiento veterinario —incluyendo casos oncológicos— Suplevet
              puede brindar soporte nutricional e inmunológico complementario, siempre como apoyo
              adicional y bajo indicación del médico veterinario, nunca como sustituto del
              tratamiento.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
