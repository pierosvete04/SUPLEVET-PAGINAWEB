"use client";

import { useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import type { DisenoBandana, TallaBandana } from "@/lib/regalo-variantes";

const TALLAS: TallaBandana[] = ["S", "M", "L"];

interface BandanaShowcaseCardProps {
  diseno: DisenoBandana;
}

// Toggle de talla puramente de vista previa — no toca el carrito. La
// elección real (que sí afecta el pedido) ocurre en el carrito/checkout vía
// RegaloBandanaSelector, una vez que hay un combo en el carrito. Sin talla
// elegida se ve la foto de producto; al elegir una talla se ve la bandana
// puesta en una mascota de ese tamaño (imágenes en /images/regalos/aplicacion)
// y además se abre en pantalla completa, mismo patrón que el lightbox de
// video de TestimoniosCarousel.
export function BandanaShowcaseCard({ diseno }: BandanaShowcaseCardProps) {
  const [talla, setTalla] = useState<TallaBandana | null>(null);
  const [pantallaCompleta, setPantallaCompleta] = useState(false);

  const variante = talla ? diseno.porTalla[talla] : undefined;
  const imagen = variante ? `/images/regalos/aplicacion/${variante.slug}.jpg` : diseno.imagen;
  const alt = talla
    ? `Bandana ${diseno.nombre} talla ${talla} puesta en una mascota`
    : `Bandana ${diseno.nombre}`;

  function elegirTalla(t: TallaBandana) {
    const siguiente = talla === t ? null : t;
    setTalla(siguiente);
    if (siguiente) setPantallaCompleta(true);
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] bg-white p-4 text-center shadow-[0_8px_30px_rgba(37,60,97,0.08)]">
      <div className="relative aspect-square w-full overflow-hidden rounded-[17px] bg-soft-gray">
        {imagen && (
          <Image
            key={imagen}
            src={imagen}
            alt={alt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 45vw, 220px"
          />
        )}
      </div>
      <p className="font-body text-sm font-bold text-secondary">Bandana {diseno.nombre}</p>
      <div className="flex gap-1.5">
        {TALLAS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => elegirTalla(t)}
            className={`rounded-[10px] border px-3 py-1 font-body text-xs font-bold transition-colors ${
              talla === t
                ? "border-accent bg-accent text-white"
                : "border-border text-secondary hover:border-secondary/40"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {pantallaCompleta && imagen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setPantallaCompleta(false)}
        >
          <button
            type="button"
            aria-label="Cerrar imagen"
            onClick={() => setPantallaCompleta(false)}
            className="absolute right-4 top-4 z-10 text-white/80 hover:text-white"
          >
            <X className="h-8 w-8" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imagen}
            alt={alt}
            className="max-h-full max-w-full rounded-md object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
