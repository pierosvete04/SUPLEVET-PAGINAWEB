"use client";

import { useState } from "react";
import Image from "next/image";

interface ProductGalleryProps {
  imagenes: string[];
  nombre: string;
}

export function ProductGallery({ imagenes, nombre }: ProductGalleryProps) {
  const [activa, setActiva] = useState(0);

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-xl bg-soft-gray">
        <Image
          src={imagenes[activa]}
          alt={nombre}
          fill
          className="object-cover"
          sizes="(min-width: 768px) 50vw, 100vw"
          priority
        />
      </div>
      {imagenes.length > 1 && (
        <div className="mt-4 flex gap-3">
          {imagenes.map((img, i) => (
            <button
              key={img}
              type="button"
              onClick={() => setActiva(i)}
              aria-label={`Ver imagen ${i + 1}`}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 bg-soft-gray transition-colors ${
                activa === i ? "border-primary" : "border-transparent"
              }`}
            >
              <Image src={img} alt="" fill className="object-cover" sizes="80px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
