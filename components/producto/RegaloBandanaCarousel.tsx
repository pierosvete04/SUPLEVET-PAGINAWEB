"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { BANDANAS_REGALO } from "@/lib/data/bandanas-regalo";

const INTERVALO_MS = 2500;

// Slide automático de los 4 diseños de bandana — vive en el banner de regalo
// de la ficha de producto para mostrar las opciones reales sin ocupar el
// espacio de una galería completa (la elección real ocurre en el carrito).
export function RegaloBandanaCarousel() {
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    const intervalo = setInterval(() => {
      setIndice((i) => (i + 1) % BANDANAS_REGALO.length);
    }, INTERVALO_MS);
    return () => clearInterval(intervalo);
  }, []);

  const bandana = BANDANAS_REGALO[indice];

  return (
    <div className="mt-3 flex items-center gap-4">
      <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-[var(--radius-card)] border border-border bg-soft-gray shadow-[0_4px_14px_rgba(37,60,97,0.1)]">
        <Image
          key={bandana.slug}
          src={bandana.imagen}
          alt={`Bandana ${bandana.nombre}`}
          fill
          className="object-cover"
          sizes="128px"
        />
        <span className="absolute left-1.5 top-1.5 rounded-[6px] bg-secondary px-1.5 py-0.5 font-body text-[9px] font-bold uppercase tracking-wide text-white">
          Gratis
        </span>
      </div>
      <div className="flex flex-col gap-2">
        <div>
          <p className="font-body text-[11px] text-muted-foreground">Tu regalo</p>
          <p className="font-body text-sm font-bold text-secondary">Bandana {bandana.nombre}</p>
        </div>
        <div className="flex gap-1.5">
          {BANDANAS_REGALO.map((b, i) => (
            <button
              key={b.slug}
              type="button"
              aria-label={`Ver bandana ${b.nombre}`}
              onClick={() => setIndice(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === indice ? "w-4 bg-secondary" : "w-1.5 bg-secondary/25"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
