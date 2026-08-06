import type { NextConfig } from "next";

// No se incluye Content-Security-Policy acá a propósito: escribir una CSP
// correcta requiere enumerar con precisión cada origen que carga el sitio
// (GTM, GA, Supabase Storage, WhatsApp, fuentes) y un error rompe silenciosamente
// analytics o imágenes en producción. Los headers de abajo son de bajo riesgo
// (no dependen de ninguna lista de orígenes) y suben el puntaje de Lighthouse
// "Best Practices" sin ese riesgo — la CSP queda como tarea aparte, más lenta
// y con su propio testing.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "geolocation=(), camera=(), microphone=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

// ---------------------------------------------------------------------------
// Redirecciones desde la tienda anterior en Shopify
// ---------------------------------------------------------------------------
// Google todavía tiene indexadas las URLs de la tienda vieja (/products/...,
// /collections/...). Sin estas reglas devuelven 404, y un 404 le dice a Google
// "esta página murió": termina borrándola del buscador y el posicionamiento
// que había ganado no se traslada a ningún lado. Un redirect permanente le
// dice "se mudó acá" y le pasa ese posicionamiento a la página nueva, además
// de llevar al visitante directo al producto en vez de a un error.
//
// Para agregar más: si conoces el equivalente exacto, va en el mapa de abajo;
// si no, las reglas por patrón del final ya lo mandan a una página relacionada.
// La lista real de URLs rotas sale de Search Console → Indexación → Páginas →
// "No encontrada (404)".

/** Handle antiguo en Shopify (/products/<handle>) → ruta actual del producto.
 *  Los handles salen del informe de páginas 404 de Search Console (jul 2026). */
const PRODUCTOS_SHOPIFY: Record<string, string> = {
  "suplemento-hiperproteico-para-mascotas-150-gr": "/productos/suplevet-150g",
  "suplemento-hiperproteico-para-mascotas-250-gr": "/productos/suplevet-250g",
  // Ojo con este handle: se llama "combo-de-2-bolsas" a secas, pero el título
  // que Google tiene indexado es "2 bolsas de Suplevet de 250 gr - Combo".
  // Es el de 250g, no el de 150g — el handle no dice el gramaje.
  "combo-de-2-bolsas": "/productos/combo-250g-x2",
  "2-bolsas-de-suplevet-de-150-gr-combo": "/productos/combo-150g-x2",
  "1-bolsa-de-150-gr-1-de-250-gr-combo": "/productos/combo-mix",
};

/** Páginas legales de Shopify (/policies/<slug>) → sección legal actual. */
const POLITICAS_SHOPIFY: Record<string, string> = {
  "refund-policy": "/legal/devoluciones",
  "privacy-policy": "/legal/privacidad",
  "terms-of-service": "/legal/terminos",
  "shipping-policy": "/legal/envios",
  "legal-notice": "/legal/terminos",
};

/** Páginas de contenido de Shopify (/pages/<slug>) → equivalente actual.
 *  Los slugs confirmados en Search Console son quienes-somos, contact,
 *  beneficios y libro-de-reclamaciones; el resto son variantes habituales de
 *  Shopify que se dejan cubiertas por si alguna quedó enlazada desde afuera. */
const PAGINAS_SHOPIFY: Record<string, string> = {
  "quienes-somos": "/nosotros",
  nosotros: "/nosotros",
  about: "/nosotros",
  "about-us": "/nosotros",
  contact: "/contacto",
  contacto: "/contacto",
  "contact-us": "/contacto",
  // La página "beneficios" de Shopify explicaba qué aporta el producto a la
  // mascota. Ese contenido hoy no tiene página propia: se decidió mandarla a
  // /nosotros, que es donde el sitio cuenta el respaldo y los valores de la
  // marca. No se manda a la home: Google trata el "todo a la portada" como
  // soft 404 y no traslada posicionamiento.
  beneficios: "/nosotros",
  "libro-de-reclamaciones": "/legal/libro-de-reclamaciones",
  reclamaciones: "/legal/libro-de-reclamaciones",
  faq: "/#faq",
  preguntas: "/#faq",
};

function redireccionesDesde(prefijo: string, mapa: Record<string, string>) {
  return Object.entries(mapa).map(([handle, destination]) => ({
    source: `${prefijo}/${handle}`,
    destination,
    permanent: true,
  }));
}

const nextConfig: NextConfig = {
  // `permanent: true` emite un 308, que Google y Bing tratan igual que un 301
  // clásico (traslada el posicionamiento). El orden importa: las reglas
  // específicas van primero, y las genéricas al final como red de seguridad.
  //
  // No hay ninguna regla que mande el tráfico roto a la home a lo bruto: Google
  // trata ese patrón como "soft 404" y no traslada nada. Lo que no tenga un
  // destino razonable cae a app/not-found.tsx, que ya invita a la web nueva.
  async redirects() {
    return [
      ...redireccionesDesde("/products", PRODUCTOS_SHOPIFY),
      ...redireccionesDesde("/policies", POLITICAS_SHOPIFY),
      ...redireccionesDesde("/pages", PAGINAS_SHOPIFY),

      // Genéricas — cualquier producto o colección que no esté mapeado arriba
      // aterriza en el catálogo, que es la página más cercana en intención.
      { source: "/products/:handle", destination: "/productos", permanent: true },
      { source: "/collections/:path*", destination: "/productos", permanent: true },
      { source: "/search", destination: "/productos", permanent: true },
      // Shopify anida el blog como /blogs/<blog>/<articulo>.
      { source: "/blogs/:path*", destination: "/blog", permanent: true },
      { source: "/cart", destination: "/carrito", permanent: true },
      { source: "/cart/:path*", destination: "/carrito", permanent: true },
      { source: "/account", destination: "/mi-cuenta", permanent: true },
      { source: "/account/:path*", destination: "/mi-cuenta", permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "bcahhdszzwearqaafhpa.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Bucket de Cloudflare R2 (reemplaza Supabase Storage para banners,
      // fotos/videos de productos, blog y cursos — ver lib/r2.ts). El de
      // arriba se mantiene mientras dura la migración de archivos existentes.
      {
        protocol: "https",
        hostname: "*.r2.dev",
      },
    ],
    unoptimized: false,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
