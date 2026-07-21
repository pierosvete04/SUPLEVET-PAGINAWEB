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
