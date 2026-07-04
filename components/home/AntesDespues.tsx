"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";
import { HillCurve } from "@/components/ui/HillCurve";

// Pendiente operativo (PLAN.md sección 15): recolectar fotos/testimonios
// reales de clientes. Mientras tanto se muestra un placeholder honesto (no se
// inventan fotos de "antes/después" con imágenes que no son reales).
interface Caso {
  id: string;
  semanas: number;
  titulo: string;
}

const casos: Caso[] = [
  { id: "1", semanas: 4, titulo: "Mejora de pelaje" },
  { id: "2", semanas: 3, titulo: "Más energía" },
  { id: "3", semanas: 6, titulo: "Mejor digestión" },
  { id: "4", semanas: 5, titulo: "Recuperación articular" },
];

function CasoCard({ caso }: { caso: Caso }) {
  const [mostrarDespues, setMostrarDespues] = useState(false);

  return (
    <div className="w-64 shrink-0 overflow-hidden rounded-xl border border-border bg-white">
      <div className="relative flex aspect-[3/4] flex-col items-center justify-center gap-2 bg-soft-gray text-muted-foreground">
        <span className="absolute top-3 rounded-full bg-white px-3 py-1 font-body text-xs font-bold text-secondary shadow-sm">
          {caso.semanas} semanas
        </span>
        <ImageOff className="h-8 w-8" strokeWidth={1.5} />
        <span className="font-body text-xs">Foto pendiente</span>

        <div className="absolute bottom-3 flex rounded-full bg-secondary/90 p-1 font-body text-xs font-bold">
          <button
            type="button"
            onClick={() => setMostrarDespues(false)}
            className={`rounded-full px-3 py-1 ${!mostrarDespues ? "bg-white text-secondary" : "text-white"}`}
          >
            Antes
          </button>
          <button
            type="button"
            onClick={() => setMostrarDespues(true)}
            className={`rounded-full px-3 py-1 ${mostrarDespues ? "bg-white text-secondary" : "text-white"}`}
          >
            Después
          </button>
        </div>
      </div>
      <p className="p-4 text-center font-body text-sm font-bold text-secondary">{caso.titulo}</p>
    </div>
  );
}

export function AntesDespues() {
  return (
    <>
      <HillCurve fillClassName="fill-white" bgClassName="bg-secondary" />
      <section className="bg-white py-section-y">
        <div className="mx-auto max-w-container px-mobile-margin md:px-gutter">
          <h2 className="text-center font-display text-3xl font-bold text-secondary md:text-4xl">
            Resultados reales, mascotas reales
          </h2>
          <div className="mt-10 flex gap-4 overflow-x-auto pb-4">
            {casos.map((caso) => (
              <CasoCard key={caso.id} caso={caso} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
