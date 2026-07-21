"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { getVariantesActivas, type RegaloVariante } from "@/lib/regalo-variantes";

const INTERVALO_MS = 2500;

interface RegaloBandanaCarouselProps {
  regaloId: string;
}

// Slide automático de los diseños de bandana — vive en el banner de regalo
// de la ficha de producto para mostrar las opciones reales sin ocupar el
// espacio de una galería completa (la elección real ocurre en el carrito).
export function RegaloBandanaCarousel({ regaloId }: RegaloBandanaCarouselProps) {
  const [variantes, setVariantes] = useState<RegaloVariante[]>([]);
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    getVariantesActivas(createClient(), regaloId).then(setVariantes);
  }, [regaloId]);

  useEffect(() => {
    if (variantes.length === 0) return;
    const intervalo = setInterval(() => {
      setIndice((i) => (i + 1) % variantes.length);
    }, INTERVALO_MS);
    return () => clearInterval(intervalo);
  }, [variantes]);

  if (variantes.length === 0) return null;
  const bandana = variantes[indice % variantes.length];

  return (
    <div className="mt-3 flex items-center gap-4">
      <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-[var(--radius-card)] border border-border bg-soft-gray shadow-[0_4px_14px_rgba(37,60,97,0.1)]">
        {bandana.imagen && (
          <Image
            key={bandana.slug}
            src={bandana.imagen}
            alt={`Bandana ${bandana.nombre}`}
            fill
            className="object-cover"
            sizes="128px"
          />
        )}
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
          {variantes.map((b, i) => (
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
