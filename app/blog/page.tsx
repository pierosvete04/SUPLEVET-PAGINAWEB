import type { Metadata } from "next";
import { Suspense } from "react";
import { getPublishedPosts } from "@/lib/data/blog";
import { getProductos } from "@/lib/data/productos";
import { BlogCard } from "@/components/blog/BlogCard";
import { BlogFilters } from "@/components/blog/BlogFilters";

export const metadata: Metadata = {
  title: "Blog Suplevet — Consejos de nutrición y salud para mascotas",
  description:
    "Artículos sobre dosificación, cuidado y salud de perros y gatos, respaldados por evidencia científica.",
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
    <div className="mx-auto max-w-container px-mobile-margin py-section-y md:px-gutter">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <h1 className="font-impact text-3xl uppercase tracking-wide text-secondary md:text-4xl">
          Blog
        </h1>
        <p className="mt-3 font-body text-muted-foreground">
          Consejos, novedades y guías sobre nutrición y salud para tu mascota.
        </p>
      </div>

      <Suspense>
        <div className="mb-10">
          <BlogFilters productos={productos} />
        </div>
      </Suspense>

      {visibles.length > 0 ? (
        <>
          <p className="mb-6 text-center font-body text-sm text-muted-foreground">
            {visibles.length} artículo{visibles.length !== 1 ? "s" : ""}
          </p>
          <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-3">
            {visibles.map((post) => (
              <BlogCard
                key={post.slug}
                post={post}
                productoNombre={productos.find((p) => p.slug === post.producto_slug)?.nombre}
              />
            ))}
          </div>
        </>
      ) : (
        <p className="py-16 text-center font-body text-muted-foreground">
          Aún no hay artículos publicados. Vuelve pronto.
        </p>
      )}
    </div>
  );
}
