import type { Metadata } from "next";
import { CatalogoGrid } from "@/components/productos/CatalogoGrid";
import { BannerCarousel } from "@/components/shared/BannerCarousel";
import { PageBreadcrumbs } from "@/components/shared/PageBreadcrumbs";
import { getBannersProductos, getProductosPublicos } from "@/lib/data/publico";
import { medirImagenes } from "@/lib/image-size";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Productos Suplevet — Suplemento nutricional para mascotas",
  description:
    "Conoce todas las presentaciones de Suplevet: 150g, 250g y combos. Nutrición funcional para perros y gatos en todas las etapas de vida.",
  alternates: { canonical: `${siteConfig.siteUrl}/productos` },
};

export const revalidate = 60;

export default async function ProductosPage() {
  // En paralelo: antes eran dos esperas encadenadas sin motivo (el catálogo no
  // depende de los banners), o sea dos viajes a Supabase uno detrás del otro.
  const [productos, banners] = await Promise.all([getProductosPublicos(), getBannersProductos()]);
  const dimensiones = await medirImagenes(banners.flatMap((b) => [b.imagen, b.imagen_mobile]));

  return (
    <div className="bg-background pb-section-y">
      <PageBreadcrumbs items={[{ label: "Productos" }]} />
      <div className="mx-auto max-w-container px-mobile-margin text-center md:px-gutter">
        {banners.length > 0 && (
          <div className="mt-6 mb-10 text-left">
            <BannerCarousel banners={banners} dimensiones={dimensiones} />
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
