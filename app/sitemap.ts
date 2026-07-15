import type { MetadataRoute } from "next";
import { createStaticClient } from "@/lib/supabase/static";
import { siteConfig } from "@/lib/site-config";

const PAGINAS_ESTATICAS = [
  "",
  "/productos",
  "/ofertas",
  "/nosotros",
  "/blog",
  "/contacto",
  "/oportunidad-de-negocio",
  "/legal/privacidad",
  "/legal/envios",
  "/legal/devoluciones",
  "/legal/terminos",
  "/legal/cookies",
  "/legal/libro-de-reclamaciones",
];

// Genera /sitemap.xml en build/request — combina las páginas fijas del sitio
// con los slugs reales de productos y artículos de blog publicados, para que
// Google encuentre contenido nuevo sin depender de que alguien lo enlace.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createStaticClient();

  const [{ data: productos }, { data: posts }] = await Promise.all([
    supabase.from("productos_web").select("slug").eq("activo", true),
    supabase.from("blog_posts").select("slug, updated_at").eq("estado", "publicado"),
  ]);

  const paginasEstaticas: MetadataRoute.Sitemap = PAGINAS_ESTATICAS.map((ruta) => ({
    url: `${siteConfig.siteUrl}${ruta}`,
    changeFrequency: ruta === "" ? "daily" : "weekly",
    priority: ruta === "" ? 1 : 0.7,
  }));

  const paginasProductos: MetadataRoute.Sitemap = (productos ?? []).map((p: { slug: string }) => ({
    url: `${siteConfig.siteUrl}/productos/${p.slug}`,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  const paginasBlog: MetadataRoute.Sitemap = (posts ?? []).map(
    (p: { slug: string; updated_at: string }) => ({
      url: `${siteConfig.siteUrl}/blog/${p.slug}`,
      lastModified: p.updated_at,
      changeFrequency: "monthly",
      priority: 0.6,
    })
  );

  return [...paginasEstaticas, ...paginasProductos, ...paginasBlog];
}
