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
// next.config.ts). 1920 cubre el ancho máximo real del contenedor en desktop
// (max-w-container llega a 1800px) con margen para pantallas de alta densidad.
//
// El de mobile bajó de 1080 a 828: el banner mobile es vertical (1080x1550) y
// a 1080 pesaba 72 KB para mostrarse en un espacio de ~650px de ancho — 46 KB
// tirados en la métrica de PageSpeed, sobre la imagen que además ES el LCP.
// 828 sigue dando ~2x de densidad en un celular de 412px de ancho, que es lo
// que se nota; el salto a 1080 solo aporta en pantallas de 3x y a costa de la
// métrica que Google mide. Ojo: app/page.tsx usa esta misma constante para el
// <link rel="preload">, así que ambos cambian juntos y el preload sigue
// coincidiendo byte a byte con el src del <img> (si no, se descarta).
export const HERO_MOBILE_OPTIMIZED_WIDTH = 828;
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
