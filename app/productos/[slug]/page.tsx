import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/producto/ProductGallery";
import { ProductBuyBox } from "@/components/producto/ProductBuyBox";
import { IngredientesSection } from "@/components/producto/IngredientesSection";
import { FuncionesApoyadas } from "@/components/producto/FuncionesApoyadas";
import { ComparativaTable } from "@/components/producto/ComparativaTable";
import { ProductReviewsSection } from "@/components/producto/ProductReviewsSection";
import { RelatedProducts } from "@/components/producto/RelatedProducts";
import { ComoSePrepara } from "@/components/shared/ComoSePrepara";
import { Faq } from "@/components/shared/Faq";
import { PageBreadcrumbs } from "@/components/shared/PageBreadcrumbs";
import { getProductoBySlug } from "@/lib/data/productos";
import { getRegalosAplicables } from "@/lib/regalos";
import { getResenasDeProducto } from "@/lib/resenas";
import { getIngredientesActivos } from "@/lib/ingredientes";
import { getComparativaActiva } from "@/lib/comparativa";
import { getFaqsActivas } from "@/lib/faqs";
import { createClient } from "@/lib/supabase/server";
import { createStaticClient } from "@/lib/supabase/static";
import { siteConfig } from "@/lib/site-config";

interface ProductoPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const { data } = await createStaticClient()
    .from("productos_web")
    .select("slug")
    .eq("activo", true);
  return (data ?? []).map((p: { slug: string }) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: ProductoPageProps): Promise<Metadata> {
  const { slug } = await params;
  const producto = await getProductoBySlug(slug);
  if (!producto) return {};

  const url = `${siteConfig.siteUrl}/productos/${producto.slug}`;

  return {
    title: producto.nombre,
    description: producto.descripcion,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: producto.nombre,
      description: producto.descripcion,
      url,
      images: producto.imagen ? [{ url: producto.imagen, width: 1200, height: 1200 }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: producto.nombre,
      description: producto.descripcion,
      images: producto.imagen ? [producto.imagen] : undefined,
    },
  };
}

export default async function ProductoPage({ params }: ProductoPageProps) {
  const { slug } = await params;
  const producto = await getProductoBySlug(slug);

  if (!producto) {
    notFound();
  }

  const supabase = await createClient();
  const [regalos, resenas, ingredientes, comparativa, faqs] = await Promise.all([
    getRegalosAplicables(supabase, producto.slug, producto.categoria),
    getResenasDeProducto(supabase, producto.shopifyProductId ?? producto.slug),
    getIngredientesActivos(supabase),
    getComparativaActiva(supabase),
    getFaqsActivas(supabase),
  ]);

  // JSON-LD (schema.org Product) — habilita precio/disponibilidad/estrellas
  // directamente en el snippet de resultados de Google. aggregateRating solo
  // se incluye si hay reseñas reales (Google penaliza ratings sin reseñas
  // detrás: https://developers.google.com/search/docs/appearance/structured-data/review-snippet).
  const promedioCalificacion =
    resenas.length > 0
      ? resenas.reduce((suma, r) => suma + r.calificacion, 0) / resenas.length
      : null;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: producto.nombre,
    description: producto.descripcion,
    image: producto.galeria?.length > 0 ? producto.galeria : producto.imagen ? [producto.imagen] : undefined,
    sku: producto.slug,
    brand: { "@type": "Brand", name: "Suplevet" },
    offers: {
      "@type": "Offer",
      url: `${siteConfig.siteUrl}/productos/${producto.slug}`,
      priceCurrency: "PEN",
      price: producto.precio,
      availability: "https://schema.org/InStock",
    },
    ...(promedioCalificacion !== null && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: Number(promedioCalificacion.toFixed(1)),
        reviewCount: resenas.length,
      },
    }),
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageBreadcrumbs items={[{ label: "Productos", href: "/productos" }, { label: producto.nombre }]} />
      <div className="mx-auto max-w-container px-mobile-margin pb-section-y pt-4 md:px-gutter md:pt-6">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
          <ProductGallery imagenes={producto.galeria} nombre={producto.nombre} />
          <ProductBuyBox producto={producto} regalos={regalos} resenas={resenas} />
        </div>
      </div>

      <ComoSePrepara mostrarBotonComprar={false} />
      <IngredientesSection ingredientes={ingredientes} />
      <FuncionesApoyadas />
      <ComparativaTable filas={comparativa} />
      <ProductReviewsSection resenas={resenas} />
      <Faq preguntas={faqs} paddingSuperiorReducido />
      <RelatedProducts slugActual={producto.slug} />
    </div>
  );
}
