import type { Banner } from "@/lib/banners";

// Vive fuera de components/home/Hero.tsx (que es "use client") a propósito:
// app/page.tsx (Server Component) necesita llamar a resolvePrimaryHeroImages
// para precargar (<link rel="preload">) la imagen del primer slide, y Next
// no permite invocar funciones exportadas desde un módulo cliente en el
// servidor — solo se puede importar el Component en sí.
export const HERO_BANNER_DESKTOP_FALLBACK = "/images/hero/banner-nuevas-presentaciones.png";
export const HERO_BANNER_MOBILE_FALLBACK = "/images/hero/banner-nuevas-presentaciones-mobile.png";

// Anchos objetivo para el optimizador de imágenes de Next (deben existir en
// images.deviceSizes — la lista por defecto de Next ya los incluye, ver
// next.config.ts). 1080 cubre pantallas mobile con hasta ~3x de densidad;
// 1920 cubre el ancho máximo real del contenedor en desktop (max-w-container
// llega a 1800px) con margen para pantallas de alta densidad.
export const HERO_MOBILE_OPTIMIZED_WIDTH = 1080;
export const HERO_DESKTOP_OPTIMIZED_WIDTH = 1920;

// Resuelve qué imagen va en el primer slide del hero, con la misma prioridad
// que usa el componente Hero (banners de /admin/banners > banner único de
// /admin/configuracion > fallback estático).
export function resolvePrimaryHeroImages(
  banners: Banner[],
  bannerDesktop?: string | null,
  bannerMobile?: string | null
): { desktop: string; mobile: string } {
  const primero = banners[0];
  return {
    desktop: primero?.imagen || bannerDesktop || HERO_BANNER_DESKTOP_FALLBACK,
    mobile: primero?.imagen_mobile || primero?.imagen || bannerMobile || HERO_BANNER_MOBILE_FALLBACK,
  };
}

// Re-exportada por comodidad — quien ya importa cosas del hero desde este
// módulo no necesita un segundo import de lib/images.ts solo para esto.
export { optimizedImageSrc as optimizedHeroSrc } from "@/lib/images";
