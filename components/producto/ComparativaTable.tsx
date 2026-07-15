import Image from "next/image";
import type { ComparativaFila } from "@/lib/comparativa";

// PLAN.md sección 5.4.3 — no se nombran marcas de competencia, columna genérica.
const BOLSA_150G = "/images/comparativa/bolsa-150g-posterior.png";

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
          {/* Encabezado de columnas — la bolsa flota justo encima de "Suplevet" */}
          <div className="grid grid-cols-[1fr_1fr] items-end gap-3 px-1 md:grid-cols-[200px_1fr_1fr] md:gap-4">
            <span className="hidden font-body text-xs font-bold uppercase tracking-wide text-white/40 md:block">
              Beneficio Clave
            </span>
            <div className="flex flex-col items-center gap-2">
              <Image
                src={BOLSA_150G}
                alt="Suplevet 150g"
                width={90}
                height={90}
                className="h-16 w-auto object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.35)] md:h-20"
              />
              <span className="rounded-full border border-accent px-3 py-1 text-center font-body text-xs font-bold text-accent md:text-sm">
                SUPLEVET 🐾
              </span>
            </div>
            <div className="flex h-full items-end justify-center pb-1.5">
              <span className="text-center font-body text-xs text-white/50 md:text-sm">
                Otros suplementos ❌
              </span>
            </div>
          </div>

          {/* Filas */}
          <div className="mt-6 flex flex-col gap-4">
            {filas.map((fila) => (
              <div
                key={fila.id}
                className="rounded-sm bg-white/5 p-4 md:grid md:grid-cols-[200px_1fr_1fr] md:items-center md:gap-4 md:p-5"
              >
                <p className="font-display text-base font-bold text-white md:text-sm md:text-white/90">
                  {fila.beneficio}
                </p>

                <div className="mt-3 rounded-sm border border-accent/30 bg-accent/10 p-4 md:mt-0">
                  <p className="font-body text-sm font-bold text-accent">{fila.suplevet_titulo}</p>
                  <p className="mt-1 font-body text-xs leading-relaxed text-white/80">{fila.suplevet_texto}</p>
                </div>

                <div className="mt-3 rounded-sm border border-white/10 bg-white/5 p-4 md:mt-0">
                  <p className="font-body text-sm font-bold text-white/50">{fila.otros_titulo}</p>
                  <p className="mt-1 font-body text-xs leading-relaxed text-white/40">{fila.otros_texto}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
