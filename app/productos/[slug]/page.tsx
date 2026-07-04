import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/producto/ProductGallery";
import { ProductBuyBox } from "@/components/producto/ProductBuyBox";
import { VideoCarousel } from "@/components/producto/VideoCarousel";
import { IngredientesSection } from "@/components/producto/IngredientesSection";
import { ComparativaTable } from "@/components/producto/ComparativaTable";
import { RelatedProducts } from "@/components/producto/RelatedProducts";
import { ComoSePrepara } from "@/components/shared/ComoSePrepara";
import { Faq } from "@/components/shared/Faq";
import { getProductoBySlug } from "@/lib/data/productos";
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
    title: `${producto.nombre} — Suplevet`,
    description: producto.descripcion,
  };
}

export default async function ProductoPage({ params }: ProductoPageProps) {
  const { slug } = await params;
  const producto = await getProductoBySlug(slug);

  if (!producto) {
    notFound();
  }

  return (
    <div>
      <div className="mx-auto max-w-container px-mobile-margin py-section-y md:px-gutter">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
          <ProductGallery imagenes={producto.galeria} nombre={producto.nombre} />
          <ProductBuyBox producto={producto} />
        </div>
      </div>

      <VideoCarousel />
      <IngredientesSection />
      <ComparativaTable />
      <ComoSePrepara />
      <Faq />
      <RelatedProducts slugActual={producto.slug} />
    </div>
  );
}
