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
import { TrackOnMount } from "@/components/analytics/TrackOnMount";
import { getProductoBySlug } from "@/lib/data/productos";
import {
  getComparativaPublica,
  getDistritosEnvioPublicos,
  getFaqsPublicas,
  getIngredientesPublicos,
  getRegalosProductoPublicos,
  getResenasProductoPublicas,
  getZonasEnvioPublicas,
} from "@/lib/data/publico";
import { detallesEnvioSchema, politicaDevolucionesSchema } from "@/lib/schema-producto";
import { resolverSeoProducto } from "@/lib/seo-producto";
import { createStaticClient } from "@/lib/supabase/static";
import { siteConfig } from "@/lib/site-config";

interface ProductoPageProps {
  params: Promise<{ slug: string }>;
}

// Cuántas reseñas se incrustan en el JSON-LD de la ficha. Google solo usa unas
// pocas para armar el snippet; mandarlas todas engorda el HTML de la página
// sin ningún beneficio en buscadores.
const MAX_RESENAS_JSON_LD = 5;

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
  const seo = resolverSeoProducto(producto);

  return {
    // `absolute` evita la plantilla "%s — Suplevet" del layout raíz: el título
    // ya viene completo desde resolverSeoProducto, así no sale "Suplevet 150g
    // — Suplevet" con la marca repetida.
    title: { absolute: seo.titulo },
    description: seo.descripcion,
    alternates: { canonical: url },
    robots: seo.indexable ? undefined : { index: false, follow: false },
    openGraph: {
      type: "website",
      title: seo.titulo,
      description: seo.descripcion,
      url,
      images: seo.imagenSocial ? [{ url: seo.imagenSocial }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: seo.titulo,
      description: seo.descripcion,
      images: seo.imagenSocial ? [seo.imagenSocial] : undefined,
    },
  };
}

export default async function ProductoPage({ params }: ProductoPageProps) {
  const { slug } = await params;
  const producto = await getProductoBySlug(slug);

  if (!producto) {
    notFound();
  }

  const [regalos, resenas, ingredientes, comparativa, faqs, zonasEnvio, distritosEnvio] =
    await Promise.all([
      getRegalosProductoPublicos(producto.slug, producto.categoria),
      getResenasProductoPublicas(producto.shopifyProductId ?? producto.slug),
      getIngredientesPublicos(),
      getComparativaPublica(),
      getFaqsPublicas(),
      // Solo alimentan el JSON-LD de abajo (costo de envío por zona en el
      // snippet de Google); la ficha en sí no muestra tarifas.
      getZonasEnvioPublicas(),
      getDistritosEnvioPublicos(),
    ]);

  // JSON-LD (schema.org Product) — habilita precio/disponibilidad/estrellas
  // directamente en el snippet de resultados de Google. aggregateRating solo
  // se incluye si hay reseñas reales (Google penaliza ratings sin reseñas
  // detrás: https://developers.google.com/search/docs/appearance/structured-data/review-snippet).
  const promedioCalificacion =
    resenas.length > 0
      ? resenas.reduce((suma, r) => suma + r.calificacion, 0) / resenas.length
      : null;

  // Además del promedio, Google pide reseñas individuales: sin ellas marca el
  // aviso "Falta el campo review" en Search Console y el snippet sale sin las
  // opiniones. Se mandan solo las más recientes — el objetivo es alimentar el
  // resultado de búsqueda, no volcar la base entera en el HTML.
  const resenasEstructuradas = resenas.slice(0, MAX_RESENAS_JSON_LD).map((r) => ({
    "@type": "Review",
    author: { "@type": "Person", name: r.cliente_nombre || "Cliente verificado" },
    datePublished: r.created_at?.slice(0, 10),
    reviewBody: r.texto,
    reviewRating: {
      "@type": "Rating",
      ratingValue: r.calificacion,
      bestRating: 5,
      worstRating: 1,
    },
  }));
  const seo = resolverSeoProducto(producto);

  // `stock` nulo significa "no llevo control de inventario", no cero: solo el
  // 0 explícito marca agotado. Antes esto decía InStock siempre, así que un
  // producto agotado seguía apareciendo como disponible en Google.
  const disponibilidad =
    producto.stock === 0 ? "https://schema.org/OutOfStock" : "https://schema.org/InStock";

  // Google Search Console avisa "Falta el campo priceValidUntil" y deja de
  // mostrar el precio en el snippet cuando la fecha vence. Un año por delante
  // es el horizonte habitual para catálogo estable.
  const validoHasta = new Date();
  validoHasta.setFullYear(validoHasta.getFullYear() + 1);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: producto.nombre,
    description: seo.descripcionLarga,
    image: producto.galeria?.length > 0 ? producto.galeria : producto.imagen ? [producto.imagen] : undefined,
    // El SKU real cuando existe; el slug solo como respaldo, porque Google
    // exige un identificador estable y único por producto.
    sku: producto.sku || producto.slug,
    ...(producto.sku && { mpn: producto.sku }),
    ...(producto.gtin && { gtin: producto.gtin }),
    brand: { "@type": "Brand", name: "Suplevet" },
    offers: {
      "@type": "Offer",
      url: `${siteConfig.siteUrl}/productos/${producto.slug}`,
      priceCurrency: "PEN",
      price: producto.precio,
      priceValidUntil: validoHasta.toISOString().slice(0, 10),
      itemCondition: "https://schema.org/NewCondition",
      availability: disponibilidad,
      shippingDetails: detallesEnvioSchema(zonasEnvio, distritosEnvio),
      hasMerchantReturnPolicy: politicaDevolucionesSchema,
    },
    ...(promedioCalificacion !== null && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: Number(promedioCalificacion.toFixed(1)),
        reviewCount: resenas.length,
        bestRating: 5,
        worstRating: 1,
      },
      review: resenasEstructuradas,
    }),
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* Sin view_item no se puede saber si un producto vende poco porque
          nadie entra a su ficha o porque quien entra no se convence. */}
      <TrackOnMount
        evento="view_item"
        clave={producto.slug}
        params={{
          item_slug: producto.slug,
          item_name: producto.nombre,
          item_category: producto.categoria,
          value: producto.precio,
        }}
      />
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
