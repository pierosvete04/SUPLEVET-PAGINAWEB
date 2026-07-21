import type { Metadata } from "next";
import { Suspense } from "react";
import { getPublishedPosts } from "@/lib/data/blog";
import { getProductos } from "@/lib/data/productos";
import { BlogCard } from "@/components/blog/BlogCard";
import { BlogFilters } from "@/components/blog/BlogFilters";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { PageBreadcrumbs } from "@/components/shared/PageBreadcrumbs";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Blog Suplevet — Consejos de nutrición y salud para mascotas",
  description:
    "Artículos sobre dosificación, cuidado y salud de perros y gatos, respaldados por evidencia científica.",
  alternates: { canonical: `${siteConfig.siteUrl}/blog` },
};

interface BlogPageProps {
  searchParams: Promise<{ producto?: string; orden?: string }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { producto, orden } = await searchParams;
  const [posts, productos] = await Promise.all([getPublishedPosts(), getProductos()]);

  let visibles = producto ? posts.filter((p) => p.producto_slug === producto) : posts;
  visibles = [...visibles].sort((a, b) => {
    const diff = new Date(b.fecha_publicacion).getTime() - new Date(a.fecha_publicacion).getTime();
    return orden === "antiguos" ? -diff : diff;
  });

  return (
    <div>
      {/* Banda de altura automática, no un hero a 42vh: el índice del blog es
          una página de navegación y el visitante viene a encontrar un artículo,
          así que la rejilla debe entrar en pantalla. El gradiente reutiliza el
          lenguaje de la tarjeta del FAQ (navy + halos difuminados) en vez de
          introducir un tratamiento visual nuevo. */}
      <section className="relative overflow-hidden bg-gradient-to-br from-secondary to-[#0f1b2e] text-center">
        <PageBreadcrumbs items={[{ label: "Blog" }]} overlay />
        <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
        <ScrollReveal className="relative mx-auto max-w-2xl px-mobile-margin pb-10 pt-16 md:pb-12 md:pt-20">
          <p className="font-impact text-sm tracking-wide text-sky">CONSEJOS Y NOVEDADES</p>
          <h1 className="mt-1 font-display text-4xl font-bold text-white md:text-5xl">Blog</h1>
          <p className="mt-3 font-body text-sm text-white/85 md:text-base">
            Guías, novedades y consejos sobre nutrición y salud para tu mascota, respaldados por
            evidencia científica.
          </p>
        </ScrollReveal>
      </section>

      <div className="mx-auto max-w-container px-mobile-margin py-section-y md:px-gutter">
        {/* Conteo y filtros comparten fila y se apoyan en la misma línea base:
            antes el conteo iba centrado debajo, desconectado de los controles
            que lo modifican. */}
        <div className="mb-8 flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
          <p className="font-body text-sm text-muted-foreground">
            {visibles.length} artículo{visibles.length !== 1 ? "s" : ""}
          </p>
          <Suspense>
            <BlogFilters productos={productos} />
          </Suspense>
        </div>

        {visibles.length > 0 ? (
          <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-3">
            {visibles.map((post) => (
              <BlogCard
                key={post.slug}
                post={post}
                productoNombre={productos.find((p) => p.slug === post.producto_slug)?.nombre}
              />
            ))}
          </div>
        ) : (
          <p className="py-16 text-center font-body text-muted-foreground">
            Aún no hay artículos publicados. Vuelve pronto.
          </p>
        )}
      </div>
    </div>
  );
}
