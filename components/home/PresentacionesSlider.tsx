"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { Banner } from "@/lib/banners";

const AUTOPLAY_MS = 3800;

interface PresentacionesSliderProps {
  imagenes: Banner[];
}

// Slider gestionable desde el panel admin (Banners -> "Nuevas presentaciones
// (Home)") — reemplaza la foto estática fija que había antes al lado de las
// tarjetas de producto.
export function PresentacionesSlider({ imagenes }: PresentacionesSliderProps) {
  const [activo, setActivo] = useState(0);
  const pausado = useRef(false);
  const total = imagenes.length;

  useEffect(() => {
    if (total <= 1) return;
    const intervalo = setInterval(() => {
      if (!pausado.current) setActivo((i) => (i + 1) % total);
    }, AUTOPLAY_MS);
    return () => clearInterval(intervalo);
  }, [total]);

  if (total === 0) return null;

  return (
    <div
      className="relative hidden overflow-hidden rounded-[var(--radius-card)] md:block"
      onMouseEnter={() => (pausado.current = true)}
      onMouseLeave={() => (pausado.current = false)}
    >
      {imagenes.map((img, i) => (
        <Image
          key={img.id}
          src={img.imagen}
          alt=""
          fill
          className={`object-cover transition-opacity duration-700 ease-out ${
            i === activo ? "opacity-100" : "opacity-0"
          }`}
          sizes="45vw"
          priority={i === 0}
        />
      ))}

      {total > 1 && (
        <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
          {imagenes.map((img, i) => (
            <button
              key={img.id}
              type="button"
              aria-label={`Ver imagen ${i + 1}`}
              onClick={() => {
                pausado.current = true;
                setActivo(i);
              }}
              className={`h-2 rounded-full transition-all ${
                i === activo ? "w-6 bg-white" : "w-2 bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
