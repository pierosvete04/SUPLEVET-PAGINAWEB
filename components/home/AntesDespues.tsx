"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { InfiniteCarousel } from "@/components/shared/InfiniteCarousel";
import type { ResultadoReal } from "@/lib/resultados-reales";

interface AntesDespuesProps {
  resultados: ResultadoReal[];
}

function CasoCard({ caso }: { caso: ResultadoReal }) {
  const [mostrarDespues, setMostrarDespues] = useState(false);
  const foto = mostrarDespues ? caso.foto_despues_url : caso.foto_antes_url;

  return (
    <div className="w-72 shrink-0 overflow-hidden rounded-[var(--radius-card)] border border-border bg-white sm:w-80">
      {/* Ratio 9:16 (formato foto de celular), para que las fotos reales de
          clientes se vean a tamaño natural sin recortes raros. */}
      <div className="relative flex aspect-[9/16] flex-col items-center justify-center gap-2 bg-soft-gray text-muted-foreground">
        <span className="absolute top-3 z-10 rounded-full bg-white px-3 py-1 font-body text-xs font-bold text-secondary shadow-sm">
          {caso.semanas} semanas
        </span>

        {foto ? (
          <Image src={foto} alt={caso.titulo} fill className="object-cover" sizes="320px" />
        ) : (
          <>
            <ImageOff className="h-8 w-8" strokeWidth={1.5} />
            <span className="font-body text-xs">Foto pendiente</span>
          </>
        )}

        <div className="absolute bottom-3 z-10 flex rounded-[17px] bg-secondary/90 p-1 font-body text-xs font-bold">
          <button
            type="button"
            onClick={() => setMostrarDespues(false)}
            className={`rounded-[17px] px-3 py-1 ${!mostrarDespues ? "bg-white text-secondary" : "text-white"}`}
          >
            Antes
          </button>
          <button
            type="button"
            onClick={() => setMostrarDespues(true)}
            className={`rounded-[17px] px-3 py-1 ${mostrarDespues ? "bg-white text-secondary" : "text-white"}`}
          >
            Después
          </button>
        </div>
      </div>
      <p className="p-4 text-center font-body text-sm font-bold text-secondary">{caso.titulo}</p>
    </div>
  );
}

export function AntesDespues({ resultados }: AntesDespuesProps) {
  if (resultados.length === 0) return null;

  return (
    <section className="pb-section-y pt-6 md:pt-8">
      <div className="mx-auto max-w-container px-mobile-margin md:px-gutter">
        <h2 className="text-center font-display text-3xl font-bold text-secondary md:text-4xl">
          Resultados reales, mascotas reales
        </h2>
        <InfiniteCarousel
          ariaLabel="Resultados reales de clientes"
          className="mt-10"
          items={resultados.map((caso) => (
            <CasoCard key={caso.id} caso={caso} />
          ))}
        />
      </div>
    </section>
  );
}
