"use client";

import { useState } from "react";
import Image from "next/image";
import type { DisenoBandana, TallaBandana } from "@/lib/regalo-variantes";

const TALLAS: TallaBandana[] = ["S", "M", "L"];

interface BandanaShowcaseCardProps {
  diseno: DisenoBandana;
}

// Toggle de talla puramente de vista previa — no toca el carrito. La
// elección real (que sí afecta el pedido) ocurre en el carrito/checkout vía
// RegaloBandanaSelector, una vez que hay un combo en el carrito.
export function BandanaShowcaseCard({ diseno }: BandanaShowcaseCardProps) {
  const [talla, setTalla] = useState<TallaBandana>("S");

  return (
    <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] bg-white p-4 text-center shadow-[0_8px_30px_rgba(37,60,97,0.08)]">
      <div className="relative aspect-square w-full overflow-hidden rounded-[17px] bg-soft-gray">
        {diseno.imagen && (
          <Image
            src={diseno.imagen}
            alt={`Bandana ${diseno.nombre}`}
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
            onClick={() => setTalla(t)}
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
    </div>
  );
}
