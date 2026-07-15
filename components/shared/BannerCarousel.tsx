"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Banner } from "@/lib/banners";

const AUTOPLAY_MS = 6000;

interface BannerCarouselProps {
  banners: Banner[];
}

export function BannerCarousel({ banners }: BannerCarouselProps) {
  const [activo, setActivo] = useState(0);

  useEffect(() => {
    if (banners.length < 2) return;
    const timer = setInterval(() => setActivo((i) => (i + 1) % banners.length), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (banners.length === 0) return null;

  function ir(indice: number) {
    setActivo((indice + banners.length) % banners.length);
  }

  return (
    <div className="relative overflow-hidden rounded-[var(--radius-card)]">
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${activo * 100}%)` }}
      >
        {banners.map((banner) => {
          // <img> nativo en vez de next/image: no conocemos el ancho/alto real
          // de cada banner subido desde /admin, y forzar un aspect-ratio fijo
          // con object-cover recortaba texto/producto del banner. Con w-full
          // h-auto se respeta la proporción real del archivo, sin recortes.
          const imagen = (
            <>
              <img
                src={banner.imagen_mobile ?? banner.imagen}
                alt=""
                className="block w-full sm:hidden"
              />
              <img src={banner.imagen} alt="" className="hidden w-full sm:block" />
            </>
          );
          return (
            <div key={banner.id} className="w-full shrink-0">
              {banner.enlace ? <Link href={banner.enlace}>{imagen}</Link> : imagen}
            </div>
          );
        })}
      </div>

      {banners.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Banner anterior"
            onClick={() => ir(activo - 1)}
            className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-secondary hover:bg-white"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Siguiente banner"
            onClick={() => ir(activo + 1)}
            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-secondary hover:bg-white"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {banners.map((banner, i) => (
              <button
                key={banner.id}
                type="button"
                aria-label={`Ir al banner ${i + 1}`}
                onClick={() => ir(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === activo ? "w-6 bg-white" : "w-1.5 bg-white/60"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
