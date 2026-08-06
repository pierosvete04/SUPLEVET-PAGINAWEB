import { unstable_cache } from "next/cache";
import { createStaticClient } from "@/lib/supabase/static";
import { getResenasAprobadas } from "@/lib/resenas";
import { getFaqsActivas } from "@/lib/faqs";
import { getConfiguracionSitio } from "@/lib/data/configuracion";
import { getBannersActivos, getBannersHero, getBannersHome } from "@/lib/banners";
import { getTestimoniosActivos } from "@/lib/testimonios";
import { getValoresActivos } from "@/lib/valores-nosotros";
import { getResultadosRealesActivos } from "@/lib/resultados-reales";
import { getIngredientesActivos } from "@/lib/ingredientes";
import { getComparativaActiva } from "@/lib/comparativa";
import { getVentajasActivas } from "@/lib/oportunidad-ventajas";
import { getProductos, getProductoBySlug } from "@/lib/data/productos";
import { getPublishedPosts } from "@/lib/data/blog";
import { getResenasDeProducto } from "@/lib/resenas";
import { getRegalosAplicables } from "@/lib/regalos";
import { getZonasEnvioActivas, getDistritosEnvioActivos } from "@/lib/shipping";
import { agruparVariantesPorDiseno, getVariantesActivas } from "@/lib/regalo-variantes";

// ---------------------------------------------------------------------------
// Lecturas públicas cacheadas
// ---------------------------------------------------------------------------
// Antes, cada visita a cualquier página pública repetía las mismas consultas a
// Supabase: la home sola disparaba 6 en cada carga, de cada usuario. Ese era el
// grueso del tiempo de origen que medía el CDN (`x-hcdn-upstream-rt` de 1,2 s
// en / y 1,4 s en /productos, ago 2026).
//
// Dos decisiones que van juntas y hay que entender como una sola:
//
// 1. `createStaticClient` (SIN cookies) en vez de `lib/supabase/server`. El
//    cliente con cookies llama a next/headers.cookies(), lo que marca la página
//    entera como dinámica: Next no la puede prerenderizar NI cachear, y encima
//    el `<Link>` que apunta a ella no puede prefetchear nada útil. Ninguna de
//    estas lecturas depende de quién es el visitante (son contenido público
//    igual para todos), así que las cookies no aportan nada y sí cuestan caro.
//
// 2. `unstable_cache` con un tag común. El resultado se guarda en la Data Cache
//    de Next y se reutiliza entre visitas y entre páginas.
//
// SOBRE LA EDICIÓN EN VIVO: el sitio se edita desde /admin sin deploy y el
// contenido debe salir al instante — cachear a ciegas rompería justamente eso.
// La protección es doble, a propósito:
//
//   a) Todo lleva el mismo tag (TAG_PUBLICO) y los formularios del panel llaman
//      a revalidarSitioPublico() al guardar (ver lib/revalidar-publico.ts), que
//      vacía el tag entero. Ese es el camino normal: el cambio se ve enseguida.
//
//   b) Igual se deja un TTL corto de 60 s. Las escrituras del admin están
//      repartidas en más de veinte formularios que van directo a Supabase desde
//      el navegador, sin un punto único por donde pasen todas; si alguno se
//      queda sin el aviso de (a) —o alguien edita la fila a mano en Supabase—
//      el peor caso es un minuto de desfase, no una hora. Sin este TTL, un
//      formulario olvidado se convertiría en "el sitio no actualiza nunca",
//      que es exactamente el tipo de fallo silencioso que cuesta días detectar.
export const TAG_PUBLICO = "contenido-publico";

const OPCIONES = { revalidate: 60, tags: [TAG_PUBLICO] };

/** Envuelve un getter que recibe el cliente de Supabase, inyectando el cliente
 *  sin cookies y cacheando el resultado bajo el tag público. */
function cachear<T>(clave: string, getter: (supabase: ReturnType<typeof createStaticClient>) => Promise<T>) {
  return unstable_cache(() => getter(createStaticClient()), ["publico", clave], OPCIONES);
}

// Cuántas reseñas se mandan al carrusel de la home/nosotros. El carrusel es
// infinito y circular: muestra 3-4 tarjetas a la vez y el usuario nunca llega
// al final, así que mandar las 50 aprobadas no agrega NADA visible — pero sí
// agregaba 946 iconos SVG y 1,1 MB de HTML a la home (ver InfiniteCarousel).
// Cada reseña cuesta ~11 KB de HTML: subir este número se paga en carga.
export const RESENAS_EN_CARRUSEL = 12;

export const getResenasCarrusel = unstable_cache(
  () => getResenasAprobadas(createStaticClient(), RESENAS_EN_CARRUSEL),
  ["publico", "resenas-carrusel"],
  OPCIONES
);

export const getConfiguracionPublica = cachear("configuracion", getConfiguracionSitio);
export const getFaqsPublicas = cachear("faqs", getFaqsActivas);
export const getBannersHeroPublicos = cachear("banners-hero", getBannersHero);
export const getBannersHomePublicos = cachear("banners-home", getBannersHome);
export const getTestimoniosPublicos = cachear("testimonios", getTestimoniosActivos);
export const getValoresPublicos = cachear("valores", getValoresActivos);
export const getResultadosPublicos = cachear("resultados", getResultadosRealesActivos);
export const getIngredientesPublicos = cachear("ingredientes", getIngredientesActivos);
export const getComparativaPublica = cachear("comparativa", getComparativaActiva);
export const getVentajasPublicas = cachear("ventajas", getVentajasActivas);

export const getBannersProductos = cachear("banners-productos", (s) => getBannersActivos(s, "productos"));
export const getBannersOfertas = cachear("banners-ofertas", (s) => getBannersActivos(s, "ofertas"));

export const getProductosPublicos = unstable_cache(getProductos, ["publico", "productos"], OPCIONES);
export const getPostsPublicos = unstable_cache(getPublishedPosts, ["publico", "blog"], OPCIONES);

/** Diseños de bandana del regalo "combo = bandana gratis", para la sección
 *  informativa de la home. Devuelve [] si el regalo está desactivado o no tiene
 *  variantes, que es la señal para que la sección no se renderice. */
export const getDisenosBandanaPublicos = cachear("bandanas-home", async (supabase) => {
  const { data: regalo } = await supabase
    .from("regalos")
    .select("id")
    .eq("activo", true)
    .eq("condicion_tipo", "categoria")
    .eq("condicion_categoria", "combo")
    .maybeSingle();

  if (!regalo) return [];

  return agruparVariantesPorDiseno(await getVariantesActivas(supabase, regalo.id));
});

export const getZonasEnvioPublicas = cachear("zonas-envio", getZonasEnvioActivas);
export const getDistritosEnvioPublicos = cachear("distritos-envio", getDistritosEnvioActivos);

/** Producto por slug — cache por slug (la clave incluye el slug). */
export function getProductoPublico(slug: string) {
  return unstable_cache(() => getProductoBySlug(slug), ["publico", "producto", slug], OPCIONES)();
}

/** Reseñas de un producto — cache por identificador de producto. */
export function getResenasProductoPublicas(productoId: string) {
  return unstable_cache(
    () => getResenasDeProducto(createStaticClient(), productoId),
    ["publico", "resenas-producto", productoId],
    OPCIONES
  )();
}

/** Regalos aplicables a un producto — cache por slug + categoría. */
export function getRegalosProductoPublicos(slug: string, categoria: string) {
  return unstable_cache(
    () => getRegalosAplicables(createStaticClient(), slug, categoria),
    ["publico", "regalos", slug, categoria],
    OPCIONES
  )();
}
