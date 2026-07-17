import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { getPublishedPosts } from "@/lib/data/blog";
import { getProductos } from "@/lib/data/productos";
import { BlogCard } from "@/components/blog/BlogCard";
import { BlogFilters } from "@/components/blog/BlogFilters";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { PageBreadcrumbs } from "@/components/shared/PageBreadcrumbs";

export const metadata: Metadata = {
  title: "Blog Suplevet — Consejos de nutrición y salud para mascotas",
  description:
    "Artículos sobre dosificación, cuidado y salud de perros y gatos, respaldados por evidencia científica.",
};

// Misma foto lifestyle usada en Home/Hero — hero editorial para que entrar al
// blog se sienta como una sección propia y no como una lista de tarjetas fría.
const HERO_IMG =
  "https://bcahhdszzwearqaafhpa.supabase.co/storage/v1/object/public/productos-web-fotos/suplevet-150g/lifestyle-perro.jpg";

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
      <PageBreadcrumbs items={[{ label: "Blog" }]} />
      <section className="relative flex min-h-[42vh] items-center justify-center overflow-hidden bg-secondary text-center">
        <Image src={HERO_IMG} alt="" fill className="object-cover opacity-40" sizes="100vw" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/70 via-secondary/60 to-secondary" />
        <ScrollReveal className="relative mx-auto max-w-2xl px-mobile-margin">
          <p className="font-impact text-sky text-sm tracking-wide">CONSEJOS Y NOVEDADES</p>
          <h1 className="mt-2 font-display text-4xl font-bold text-white md:text-6xl">Blog</h1>
          <p className="mt-3 font-body text-white/85 md:text-lg">
            Guías, novedades y consejos sobre nutrición y salud para tu mascota, respaldados por
            evidencia científica.
          </p>
        </ScrollReveal>
      </section>

      <div className="mx-auto max-w-container px-mobile-margin py-section-y md:px-gutter">
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
    </div>
  );
}
