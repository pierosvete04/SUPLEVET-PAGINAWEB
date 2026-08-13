"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Banner } from "@/lib/banners";
import {
  HERO_BANNER_DESKTOP_FALLBACK,
  HERO_BANNER_MOBILE_FALLBACK,
  HERO_DESKTOP_OPTIMIZED_WIDTH,
  HERO_MOBILE_OPTIMIZED_WIDTH,
  optimizedHeroSrc,
} from "@/lib/hero";
import { dimensionesImg, type MapaDimensiones } from "@/lib/images";
import { trackEvent } from "@/lib/analytics";

const AUTOPLAY_MS = 6000;
const HERO_ENLACE_FALLBACK = "#combos";

interface HeroSlide {
  id: string;
  desktop: string;
  mobile: string;
  enlace: string;
}

interface HeroProps {
  banners: Banner[];
  bannerDesktop?: string | null;
  bannerMobile?: string | null;
  /** Tamaño real de cada imagen (URL original -> ancho/alto), medido en el
   *  servidor con lib/image-size.ts. Lo que falte simplemente no lleva
   *  width/height y se comporta como antes. */
  dimensiones?: MapaDimensiones;
}

// Portada dentro del mismo margen/gutter que el resto del sitio (no va borde
// a borde), igual que la portada de referencia.
//
// El alto lo define la proporción natural de la imagen (`w-full h-auto`), NO
// una altura fija en vh con object-cover: forzar un alto arbitrario obligaba
// a recortar el banner (se comía el texto por los lados en desktop y arriba/
// abajo en mobile). Con proporción natural el banner siempre se ve completo,
// y al ser de ancho completo del contenedor sigue creciendo en pantallas
// grandes. Se usa <img> nativo en vez del componente next/image porque no
// conocemos el ancho/alto real de cada banner subido desde /admin — mismo
// criterio que BannerCarousel. El peso sí se optimiza igual: el `src` pasa
// por optimizedHeroSrc, que redirige al optimizador de imágenes de Next
// (/_next/image), el mismo que usan el logo y las fotos de producto — no
// hace falta conocer las dimensiones originales, solo el ancho destino.
//
// Si hay banners configurados en /admin/banners con página "hero" se arma un
// slider con autoplay y sin controles visibles (ni flechas ni puntitos): si
// solo hay una imagen, se queda estático. Sin banners configurados, cae al
// banner único de /admin/configuracion.
export function Hero({ banners, bannerDesktop, bannerMobile, dimensiones }: HeroProps) {
  const slides: HeroSlide[] =
    banners.length > 0
      ? banners.map((b) => ({
          id: b.id,
          desktop: b.imagen,
          mobile: b.imagen_mobile ?? b.imagen,
          enlace: b.enlace || HERO_ENLACE_FALLBACK,
        }))
      : [
          {
            id: "fallback",
            desktop: bannerDesktop || HERO_BANNER_DESKTOP_FALLBACK,
            mobile: bannerMobile || HERO_BANNER_MOBILE_FALLBACK,
            enlace: HERO_ENLACE_FALLBACK,
          },
        ];

  const [activo, setActivo] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = setInterval(() => setActivo((i) => (i + 1) % slides.length), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="bg-white pt-2 md:pt-3">
      <div className="mx-auto max-w-container px-mobile-margin md:px-gutter">
        <div className="w-full overflow-hidden rounded-[17px]">
          <div
            className="flex items-start transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${activo * 100}%)` }}
          >
            {slides.map((slide, i) => (
              <Link
                key={slide.id}
                href={slide.enlace}
                aria-label="Ver combos de Suplevet"
                onClick={() =>
                  // El clic ya se registra como enlace genérico, pero sin saber
                  // qué banner estaba visible no se puede comparar uno contra
                  // otro ni saber si el tercero llega a verse.
                  trackEvent("banner_click", {
                    banner_id: slide.id,
                    posicion: i + 1,
                    total_banners: slides.length,
                    destino: slide.enlace,
                  })
                }
                className="block w-full shrink-0"
              >
                {/* width/height llevan el tamaño REAL del archivo (medido en
                    el servidor, ver lib/image-size.ts). Junto a `w-full h-auto`
                    el navegador no los usa como píxeles fijos sino como
                    proporción, y así reserva el alto correcto desde el primer
                    pintado en vez de empujar la página cuando la imagen llega
                    — el salto que PageSpeed reportaba como CLS 0.546. */}
                <img
                  src={optimizedHeroSrc(slide.mobile, HERO_MOBILE_OPTIMIZED_WIDTH)}
                  {...dimensionesImg(dimensiones, slide.mobile)}
                  alt=""
                  loading="eager"
                  decoding="async"
                  fetchPriority={i === 0 ? "high" : "low"}
                  className="block h-auto w-full sm:hidden"
                />
                <img
                  src={optimizedHeroSrc(slide.desktop, HERO_DESKTOP_OPTIMIZED_WIDTH)}
                  {...dimensionesImg(dimensiones, slide.desktop)}
                  alt=""
                  loading="eager"
                  decoding="async"
                  fetchPriority={i === 0 ? "high" : "low"}
                  className="hidden h-auto w-full sm:block"
                />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
