"use client";

import { useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { trackEvent } from "@/lib/analytics";

interface ProductGalleryProps {
  imagenes: string[];
  nombre: string;
}

export function ProductGallery({ imagenes, nombre }: ProductGalleryProps) {
  const [zoom, setZoom] = useState<string | null>(null);
  const [principal, ...secundarias] = imagenes;

  // Ampliar una foto es de las señales más claras de que alguien está
  // evaluando el producto en serio, no solo pasando.
  function abrirZoom(img: string, posicion: number) {
    trackEvent("galeria_zoom", { item_name: nombre, posicion });
    setZoom(img);
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => abrirZoom(principal, 1)}
        aria-label="Ver imagen en grande"
        className="relative aspect-square overflow-hidden rounded-[var(--radius-card)] bg-soft-gray shadow-[0_8px_30px_rgba(37,60,97,0.08)]"
      >
        <Image
          src={principal}
          alt={nombre}
          fill
          className="object-cover"
          sizes="(min-width: 768px) 50vw, 100vw"
          priority
        />
      </button>

      {secundarias.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {secundarias.map((img, i) => (
            <button
              key={img}
              type="button"
              onClick={() => abrirZoom(img, i + 2)}
              aria-label={`Ver imagen ${i + 2} en grande`}
              className="relative aspect-square overflow-hidden rounded-[var(--radius-card)] bg-soft-gray transition-opacity hover:opacity-90"
            >
              <Image src={img} alt="" fill className="object-cover" sizes="(min-width: 768px) 25vw, 50vw" />
            </button>
          ))}
        </div>
      )}

      <Dialog open={!!zoom} onOpenChange={(open) => !open && setZoom(null)}>
        <DialogContent className="max-w-2xl bg-black p-0">
          <DialogTitle className="sr-only">{nombre}</DialogTitle>
          {zoom && (
            <div className="relative aspect-square w-full overflow-hidden rounded-md">
              <Image src={zoom} alt={nombre} fill className="object-contain" sizes="90vw" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
