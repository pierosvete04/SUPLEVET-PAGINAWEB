import type { Metadata } from "next";
import { CatalogoGrid } from "@/components/productos/CatalogoGrid";
import { BannerCarousel } from "@/components/shared/BannerCarousel";
import { PageBreadcrumbs } from "@/components/shared/PageBreadcrumbs";
import { getProductos } from "@/lib/data/productos";
import { getBannersActivos } from "@/lib/banners";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Productos Suplevet — Suplemento nutricional para mascotas",
  description:
    "Conoce todas las presentaciones de Suplevet: 150g, 250g y combos. Nutrición funcional para perros y gatos en todas las etapas de vida.",
};

export default async function ProductosPage() {
  const productos = await getProductos();
  const banners = await getBannersActivos(await createClient(), "productos");

  return (
    <div className="bg-background pb-section-y pt-8 md:pt-10">
      <PageBreadcrumbs items={[{ label: "Productos" }]} />
      <div className="mx-auto max-w-container px-mobile-margin text-center md:px-gutter">
        {banners.length > 0 && (
          <div className="mb-10 text-left">
            <BannerCarousel banners={banners} />
          </div>
        )}
        <h1 className="font-display text-4xl font-bold text-secondary md:text-5xl">
          Catálogo de Productos
        </h1>
        <p className="mx-auto mt-4 max-w-xl font-body text-muted-foreground">
          Nutrición funcional hiperproteica formulada para el bienestar de tu mascota. Descubre
          nuestras opciones individuales y combos especiales.
        </p>

        <div className="mt-10 text-left">
          <CatalogoGrid productos={productos} />
        </div>
      </div>
    </div>
  );
}
