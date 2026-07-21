import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPostBySlug, getRelatedPosts, formatFechaPost } from "@/lib/data/blog";
import { PageBreadcrumbs } from "@/components/shared/PageBreadcrumbs";
import { getProductoBySlug } from "@/lib/data/productos";
import { getConfiguracionSitio } from "@/lib/data/configuracion";
import { whatsappLink, siteConfig } from "@/lib/site-config";
import { createClient } from "@/lib/supabase/server";
import { sanitizeHtml } from "@/lib/sanitize-html";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};

  const titulo = post.meta_title || post.titulo;
  const tituloCompleto = `${titulo} — Suplevet`;
  const descripcion = post.meta_description || post.resumen || undefined;
  const url = `${siteConfig.siteUrl}/blog/${post.slug}`;

  return {
    title: titulo,
    description: descripcion,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: tituloCompleto,
      description: descripcion,
      url,
      publishedTime: post.fecha_publicacion,
      authors: post.autor ? [post.autor] : undefined,
      images: post.imagen_destacada ? [{ url: post.imagen_destacada, width: 1200, height: 630 }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: tituloCompleto,
      description: descripcion,
      images: post.imagen_destacada ? [post.imagen_destacada] : undefined,
    },
  };
}

// Server Component (a diferencia de la referencia de SUSEGUR, que renderiza
// el post con JS en el navegador tras un "Cargando artículo…") — el HTML que
// recibe Google ya trae el artículo completo, sin espera. Ver PLAN.md 21.4/22.
export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const [relacionados, producto, config] = await Promise.all([
    getRelatedPosts(post.slug, post.producto_slug),
    post.producto_slug ? getProductoBySlug(post.producto_slug) : Promise.resolve(null),
    getConfiguracionSitio(await createClient()),
  ]);
  const whatsappB2C = config?.whatsapp_b2c || siteConfig.whatsappB2C;

  // JSON-LD (schema.org BlogPosting) — le da a Google el contexto explícito
  // del artículo (autor, fecha, imagen) para habilitar resultados enriquecidos.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.titulo,
    description: post.meta_description || post.resumen || undefined,
    image: post.imagen_destacada || undefined,
    datePublished: post.fecha_publicacion,
    author: { "@type": "Person", name: post.autor || "Equipo Suplevet" },
    publisher: {
      "@type": "Organization",
      name: "Suplevet",
      logo: { "@type": "ImageObject", url: `${siteConfig.siteUrl}/logos/icon-only/icon-celeste.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${siteConfig.siteUrl}/blog/${post.slug}` },
  };

  return (
    <>
      <PageBreadcrumbs items={[{ label: "Blog", href: "/blog" }, { label: post.titulo }]} />
      <article className="mx-auto grid max-w-container grid-cols-1 gap-12 px-mobile-margin pb-section-y pt-4 md:px-gutter md:pt-6 lg:grid-cols-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="lg:col-span-8">
        <Link
          href="/blog"
          className="mb-6 flex w-fit items-center gap-1 font-body text-sm font-bold text-secondary"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al blog
        </Link>

        {post.imagen_destacada && (
          <div className="relative mb-8 h-[280px] overflow-hidden rounded-md md:h-[400px]">
            <Image
              src={post.imagen_destacada}
              alt={post.titulo}
              fill
              priority
              className="object-cover"
              sizes="(min-width: 1024px) 66vw, 100vw"
            />
          </div>
        )}

        <h1 className="mb-3 font-display text-3xl font-bold text-secondary md:text-4xl">
          {post.titulo}
        </h1>
        <p className="mb-10 font-body text-sm text-muted-foreground">
          {formatFechaPost(post.fecha_publicacion)}
          {post.autor && ` · ${post.autor}`}
        </p>

        <div
          className="flex flex-col gap-4 font-body text-secondary [&_h2]:mt-4 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.contenido_html) }}
        />

        <div className="mt-12 flex flex-col items-center justify-between gap-5 rounded-md bg-secondary p-6 md:flex-row md:p-8">
          <div>
            <h3 className="font-display text-lg font-bold text-white">
              {producto ? `¿Quieres ver ${producto.nombre}?` : "¿Quieres conocer nuestros productos?"}
            </h3>
            <p className="font-body text-sm text-white/70">
              Te ayudamos a elegir la mejor opción para tu mascota.
            </p>
          </div>
          <Link
            href={producto ? `/productos/${producto.slug}` : "/productos"}
            className="shrink-0 whitespace-nowrap rounded-[17px] bg-primary px-6 py-3 font-body font-bold text-primary-foreground hover:opacity-90"
          >
            Ver producto
          </Link>
        </div>

        <div className="mt-4 text-center">
          <a
            href={whatsappLink(whatsappB2C, `Hola, tengo una consulta sobre "${post.titulo}"`)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-body text-sm font-bold text-secondary underline"
          >
            ¿Tienes dudas? Escríbenos por WhatsApp
          </a>
        </div>
      </div>

      <aside className="lg:col-span-4">
        <div className="sticky top-24 rounded-md bg-soft-gray p-6">
          <h3 className="mb-5 font-display text-lg font-bold text-secondary">Más artículos</h3>
          <div className="flex flex-col gap-5">
            {relacionados.length > 0 ? (
              relacionados.map((p) => (
                <Link key={p.slug} href={`/blog/${p.slug}`} className="group flex gap-3">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[10px] bg-white">
                    {p.imagen_destacada && (
                      <Image
                        src={p.imagen_destacada}
                        alt=""
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="80px"
                      />
                    )}
                  </div>
                  <div>
                    <h4 className="mb-1 font-display text-sm font-bold leading-snug text-secondary group-hover:text-secondary">
                      {p.titulo}
                    </h4>
                    <p className="font-body text-xs text-muted-foreground">
                      {formatFechaPost(p.fecha_publicacion)}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <p className="font-body text-sm text-muted-foreground">Pronto más contenido.</p>
            )}
          </div>
        </div>
      </aside>
      </article>
    </>
  );
}
