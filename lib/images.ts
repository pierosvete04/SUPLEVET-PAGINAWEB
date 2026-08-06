// Banners subidos desde /admin (home, productos, ofertas) usan <img> nativo
// en vez del componente next/image porque no conocemos el ancho/alto real
// del archivo que sube cada admin, y forzar un aspect-ratio fijo con
// object-cover recorta texto/producto del banner (ver comentarios en
// Hero.tsx y BannerCarousel.tsx). Eso no debería significar renunciar a la
// optimización de peso: esta función redirige el `src` al optimizador de
// imágenes propio de Next (/_next/image) — el mismo que ya usan el logo y
// las fotos de producto vía next/image — que redimensiona, comprime y sirve
// WebP/AVIF según el navegador sin necesitar las dimensiones originales de
// antemano, solo el ancho destino. remotePatterns en next.config.ts ya
// autoriza el storage de Supabase donde se alojan los banners subidos.
export function optimizedImageSrc(src: string, width: number, quality = 75): string {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
}

/** Ancho/alto reales de un archivo de imagen. */
export interface ImageDimensions {
  width: number;
  height: number;
}

/** URL original de la imagen -> su tamaño real. Lo llena el servidor con
 *  lib/image-size.ts y lo consumen los componentes cliente para emitir
 *  width/height en el <img> y así reservar el espacio antes de que la imagen
 *  cargue (evita el salto de layout que PageSpeed mide como CLS). */
export type MapaDimensiones = Record<string, ImageDimensions>;

/** Atributos width/height para un <img> nativo, o `{}` si no se conoce el
 *  tamaño. Se usan junto a `w-full h-auto`: el navegador toma la PROPORCIÓN de
 *  estos números (no los píxeles literales) para reservar el alto correcto. */
export function dimensionesImg(
  mapa: MapaDimensiones | undefined,
  src: string | null | undefined
): { width: number; height: number } | Record<string, never> {
  const dims = src ? mapa?.[src] : undefined;
  return dims ? { width: dims.width, height: dims.height } : {};
}
