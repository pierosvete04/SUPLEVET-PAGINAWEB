import { Check, Minus } from "lucide-react";
import { comparativaFilas } from "@/lib/data/productos-temp";

// PLAN.md sección 5.4.3 — no se nombran marcas de competencia, columna genérica.
export function ComparativaTable() {
  return (
    <section className="bg-white py-section-y">
      <div className="mx-auto max-w-container px-mobile-margin md:px-gutter">
        <h2 className="text-center font-display text-2xl font-bold text-secondary md:text-3xl">
          Suplevet vs. otros suplementos
        </h2>

        <div className="mx-auto mt-8 max-w-2xl overflow-hidden rounded-xl border border-border">
          <div className="grid grid-cols-3 bg-soft-gray font-body text-sm font-bold text-secondary">
            <div className="p-4">Atributo</div>
            <div className="border-l-2 border-primary bg-primary/5 p-4 text-center text-primary">
              Suplevet
            </div>
            <div className="p-4 text-center">Otros suplementos</div>
          </div>
          {comparativaFilas.map((fila, i) => (
            <div
              key={fila.atributo}
              className={`grid grid-cols-3 font-body text-sm ${i % 2 === 1 ? "bg-soft-gray/50" : ""}`}
            >
              <div className="p-4 text-secondary">{fila.atributo}</div>
              <div className="flex items-center justify-center border-l-2 border-primary bg-primary/5">
                <Check className="h-5 w-5 text-primary" strokeWidth={2} />
              </div>
              <div className="flex items-center justify-center text-muted-foreground">
                <Minus className="h-5 w-5" strokeWidth={2} />
                <span className="ml-1 text-xs">Varía</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
