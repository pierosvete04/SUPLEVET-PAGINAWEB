import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/producto/ProductGallery";
import { ProductBuyBox } from "@/components/producto/ProductBuyBox";
import { IngredientesSection } from "@/components/producto/IngredientesSection";
import { ComparativaTable } from "@/components/producto/ComparativaTable";
import { ProductReviewsSection } from "@/components/producto/ProductReviewsSection";
import { RelatedProducts } from "@/components/producto/RelatedProducts";
import { ComoSePrepara } from "@/components/shared/ComoSePrepara";
import { Faq } from "@/components/shared/Faq";
import { getProductoBySlug } from "@/lib/data/productos";
import { getRegalosAplicables } from "@/lib/regalos";
import { getResenasDeProducto } from "@/lib/resenas";
import { getIngredientesActivos } from "@/lib/ingredientes";
import { getComparativaActiva } from "@/lib/comparativa";
import { getFaqsActivas } from "@/lib/faqs";
import { createClient } from "@/lib/supabase/server";
import { createStaticClient } from "@/lib/supabase/static";

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

  return {
    title: producto.nombre,
    description: producto.descripcion,
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
    getRegalosAplicables(supabase, producto.slug),
    getResenasDeProducto(supabase, producto.shopifyProductId ?? producto.slug),
    getIngredientesActivos(supabase),
    getComparativaActiva(supabase),
    getFaqsActivas(supabase),
  ]);

  return (
    <div>
      <div className="mx-auto max-w-container px-mobile-margin py-section-y md:px-gutter">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
          <ProductGallery imagenes={producto.galeria} nombre={producto.nombre} />
          <ProductBuyBox producto={producto} regalos={regalos} resenas={resenas} />
        </div>
      </div>

      <ComoSePrepara mostrarBotonComprar={false} />
      <IngredientesSection ingredientes={ingredientes} />
      <ComparativaTable filas={comparativa} />
      <ProductReviewsSection resenas={resenas} />
      <Faq preguntas={faqs} />
      <RelatedProducts slugActual={producto.slug} />
    </div>
  );
}
